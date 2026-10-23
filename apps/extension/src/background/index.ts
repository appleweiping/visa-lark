import {
  POLL_PROFILES,
  DEFAULT_PROFILE,
  initBackoff,
  resetBackoff,
  runMonitorOnce,
  dispatch,
  decideNextAction,
  recordOutcome,
  type Monitor,
  type Session,
  type RunResult,
  type PollOutcome,
} from "@visa-lark/shared";
import { UsVisaInfoAdapter } from "@visa-lark/adapter-usvisa-info";
import { buildChannels } from "@visa-lark/notify";
import { BrowserTransport } from "../lib/transport.js";
import { BrowserNotificationChannel } from "../lib/browser-notify.js";
import {
  DAY_MS,
  globalCap,
  usedToday,
  appendGlobalPolls,
  checkConfirmGuard as guardConfirm,
  bookingKey,
  isDuplicateBooking,
} from "../lib/guards.js";
import {
  loadState,
  saveState,
  appendLog,
  mutate,
  type ExtState,
} from "../lib/storage.js";

/**
 * Background service worker. Drives the monitor engine on a jittered schedule
 * using chrome.alarms. MV3 service workers are ephemeral, so ALL state
 * (backoff, schedule, logs) is persisted in chrome.storage and reloaded each
 * wake — a worker eviction can never reset a cooldown (DESIGN.md §3.4).
 */

const ALARM_PREFIX = "visalark:";
const HEARTBEAT_ALARM = "visalark-heartbeat";
const transport = new BrowserTransport();
const adapter = new UsVisaInfoAdapter(transport);

function alarmName(monitorId: string): string {
  return `${ALARM_PREFIX}${monitorId}`;
}

function buildSession(state: ExtState): Session | null {
  if (!state.sessionCtx) return null;
  return {
    cookie: "(browser-managed)", // we never read the cookie; the browser sends it
    embassyCode: state.sessionCtx.embassyCode,
    scheduleId: state.sessionCtx.scheduleId,
    acquiredAt: Date.now(),
  };
}

function channelsFor(state: ExtState) {
  const configured = buildChannels(state.channels);
  return state.browserNotifications
    ? [new BrowserNotificationChannel(), ...configured]
    : configured;
}

/** Monitors currently mid-tick. Stops a `runNow` and a scheduled alarm from
 * polling the same monitor at the same time, which would double the request
 * burst and could submit the same booking twice. */
const inFlight = new Set<string>();

/** Recently submitted booking targets, for the idempotency lock. A second
 * confirmBook for the same target within the window is refused (key/window logic
 * in lib/guards.ts), so a double-clicked notification / two confirm tabs can't
 * fire two destructive reschedule POSTs. */
const recentBookings = new Map<string, number>();

/** Run one monitor and schedule the next alarm based on the result. */
async function tick(monitorId: string): Promise<void> {
  if (inFlight.has(monitorId)) return; // a tick for this monitor is already running
  inFlight.add(monitorId);
  try {
    await tickInner(monitorId);
  } finally {
    inFlight.delete(monitorId);
  }
}


async function tickInner(monitorId: string): Promise<void> {
  const state = await loadState();
  const monitor = state.monitors.find((m) => m.id === monitorId);
  if (!monitor || !monitor.enabled) return;

  const session = buildSession(state);
  if (!session) {
    await appendLog({
      at: Date.now(),
      monitorId,
      outcome: "config_error",
      note: "No session context. Open the visa schedule page and sync first.",
    });
    return;
  }

  const profile = POLL_PROFILES[monitor.pollProfile] ?? POLL_PROFILES[DEFAULT_PROFILE]!;
  const backoff = state.backoff[monitorId] ?? initBackoff();
  const bk = state.bookkeeping[monitorId] ?? { bookingsMade: 0, bookingTimes: [] };
  const dayAgo = Date.now() - DAY_MS;
  // Track deltas and apply them to fresh state inside `mutate`. Writing values
  // computed from the state loaded at the start of the tick would overwrite
  // anything another alarm or the confirm page changed in the meantime.
  let bookingDelta = 0;
  const newBookingTimes: number[] = [];

  let result: RunResult;
  try {
    result = await runMonitorOnce(monitor, session, profile, state.autoBook, backoff, {
      adapter,
      channels: channelsFor(state),
      // The one-tap confirm link points at an EXTENSION page (not the control
      // plane). Booking must happen in the data plane that holds the warm
      // browser session; the control plane has no session and cannot book.
      confirmUrlBase: chrome.runtime.getURL("confirm.html"),
      getCurrentAppointment: () => state.currentAppointment,
      getAutoBookContext: () => ({
        bookingsMade: bk.bookingsMade,
        bookingsToday: bk.bookingTimes.filter((t) => t > dayAgo).length,
      }),
      getGlobalRequestBudget: () => ({
        used: usedToday(state.globalPolls, Date.now()),
        cap: globalCap(monitor.pollProfile),
      }),
      onObservation: (dates, at) => {
        void relayObservation(state.controlPlaneUrl, state.controlPlaneToken, monitorId, dates, at);
      },
      onBooked: (r) => {
        if (r.status === "confirmed") {
          bookingDelta += 1;
          newBookingTimes.push(Date.now());
        }
      },
    });
  } catch (e) {
    // A thrown error still has to escalate the backoff toward the stop
    // threshold; otherwise the monitor would retry every 10 minutes forever.
    // Record it as a network_error and use the resulting cooldown.
    let nextBo = backoff;
    await mutate(async (fresh) => {
      const cur = fresh.backoff[monitorId] ?? initBackoff();
      nextBo = recordOutcome(cur, "network_error", Date.now(), 1);
      fresh.backoff[monitorId] = nextBo;
      fresh.logs.push({ at: Date.now(), monitorId, outcome: "error", note: String(e) });
      return fresh;
    });
    const action = decideNextAction(nextBo, profile, Date.now());
    if (action.kind === "stop") {
      await mutate(async (fresh) => {
        fresh.monitors = fresh.monitors.map((m) => (m.id === monitorId ? { ...m, enabled: false } : m));
        return fresh;
      });
      await chrome.alarms.clear(alarmName(monitorId));
      return;
    }
    const retryMin =
      action.kind === "wait" ? Math.max(1, (action.untilMs - Date.now()) / 60_000) : 10;
    await chrome.alarms.create(alarmName(monitorId), { delayInMinutes: retryMin });
    return;
  }

  // The engine reports how many requests it actually issued. Use that instead
  // of diffing recentPolls, which drops entries older than 24h and miscounts.
  const requestsThisCycle = result.requestsIssued;
  const stopped = result.next.kind === "stopped";

  // Apply every state change in one `mutate` against fresh state, using the deltas.
  await mutate(async (fresh) => {
    fresh.backoff[monitorId] = result.backoff;
    const fbk = fresh.bookkeeping[monitorId] ?? { bookingsMade: 0, bookingTimes: [] };
    fbk.bookingsMade += bookingDelta;
    fbk.bookingTimes.push(...newBookingTimes);
    fresh.bookkeeping[monitorId] = fbk;
    // global request budget: append this cycle's request stamps, prune >24h
    const now = Date.now();
    fresh.globalPolls = appendGlobalPolls(fresh.globalPolls, requestsThisCycle, now);
    fresh.logs.push({ at: now, monitorId, outcome: result.outcome, note: result.note });
    if (stopped) {
      fresh.monitors = fresh.monitors.map((m) =>
        m.id === monitorId ? { ...m, enabled: false } : m,
      );
    }
    return fresh;
  });

  // Schedule next run, or stop.
  if (result.next.kind === "stopped") {
    await chrome.alarms.clear(alarmName(monitorId));
    return;
  }
  const delayInMinutes = Math.max(0.5, result.next.delayMs / 60_000);
  await chrome.alarms.create(alarmName(monitorId), { delayInMinutes });
}

async function relayObservation(
  controlPlaneUrl: string | undefined,
  controlPlaneToken: string | undefined,
  monitorId: string,
  dates: { date: string; facilityId: string }[],
  at: number,
): Promise<void> {
  if (!controlPlaneUrl || !controlPlaneToken || dates.length === 0) return;
  try {
    await fetch(`${controlPlaneUrl.replace(/\/$/, "")}/api/observations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${controlPlaneToken}`,
      },
      body: JSON.stringify({ monitorId, dates, at }),
    });
  } catch {
    // Control plane is optional; never let a relay failure affect monitoring.
  }
}

/**
 * Guard for the confirm page. Requests made after a human click still count
 * against the cooldown and the daily budget. Thin wrapper over the tested
 * helper in lib/guards.ts.
 */
function checkConfirmGuard(state: ExtState, monitorId: string): { ok: true } | { ok: false; reason: string } {
  const profile = state.monitors.find((m) => m.id === monitorId)?.pollProfile ?? DEFAULT_PROFILE;
  return guardConfirm(state.backoff[monitorId] as never, profile, state.globalPolls, Date.now());
}

/** Record one confirm-page request in the monitor's backoff and the global budget. */
async function recordConfirmRequest(monitorId: string, outcome: PollOutcome): Promise<void> {
  const now = Date.now();
  await mutate(async (s) => {
    const bo = s.backoff[monitorId] ?? initBackoff();
    s.backoff[monitorId] = recordOutcome(bo, outcome, now, 1);
    s.globalPolls = appendGlobalPolls(s.globalPolls, 1, now);
    return s;
  });
}
async function rearmAll(): Promise<void> {
  const state = await loadState();
  const existing = await chrome.alarms.getAll();
  for (const a of existing) {
    if (a.name.startsWith(ALARM_PREFIX)) await chrome.alarms.clear(a.name);
  }
  for (const m of state.monitors) {
    if (m.enabled) {
      // Stagger initial fire so multiple monitors don't burst together.
      const jitter = 0.2 + Math.random() * 1.5;
      await chrome.alarms.create(alarmName(m.id), { delayInMinutes: jitter });
    }
  }
  // Heartbeat: a daily low-priority "still alive" ping, so silence means "no
  // slots" and not "the extension died". Only create the alarm if it is missing:
  // rearmAll runs on every settings edit, and recreating it each time would keep
  // pushing the 24h delay out so it never fires.
  const existingHb = await chrome.alarms.get(HEARTBEAT_ALARM);
  if (!existingHb) {
    await chrome.alarms.create(HEARTBEAT_ALARM, { periodInMinutes: 24 * 60, delayInMinutes: 24 * 60 });
  }
}

async function sendHeartbeat(): Promise<void> {
  const state = await loadState();
  const enabled = state.monitors.filter((m) => m.enabled).length;
  if (enabled === 0) return;
  await dispatch(channelsFor(state), {
    title: "🐦 VisaLark 心跳 / heartbeat",
    body: `监控运行正常，共 ${enabled} 个在盯。无消息=暂无符合条件的位（不是挂了）。`,
    priority: "low",
    kind: "heartbeat",
  });
}

// ---- Event wiring ----

chrome.runtime.onInstalled.addListener(() => {
  void rearmAll();
});
chrome.runtime.onStartup.addListener(() => {
  void rearmAll();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === HEARTBEAT_ALARM) {
    void sendHeartbeat();
    return;
  }
  if (alarm.name.startsWith(ALARM_PREFIX)) {
    const monitorId = alarm.name.slice(ALARM_PREFIX.length);
    void tick(monitorId);
  }
});

// Open the deep link when a native notification is clicked.
chrome.notifications.onClicked.addListener(async (id) => {
  const got = await chrome.storage.session.get(`notif_url_${id}`);
  const url = got[`notif_url_${id}`] as string | undefined;
  if (url) await chrome.tabs.create({ url });
  chrome.notifications.clear(id);
});

// Messages from popup/options to control monitoring.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    switch (msg?.type) {
      case "rearm":
        await rearmAll();
        sendResponse({ ok: true });
        break;
      case "runNow":
        await tick(msg.monitorId);
        sendResponse({ ok: true });
        break;
      case "validateSession": {
        const state = await loadState();
        const session = buildSession(state);
        if (!session) {
          sendResponse({ ok: false, health: "unknown", reason: "no session context" });
          break;
        }
        const health = await adapter.validateSession(session);
        sendResponse({ ok: true, health });
        break;
      }
      case "getTimes": {
        // Used by the one-tap confirm page to list bookable times for a date.
        const state = await loadState();
        const session = buildSession(state);
        if (!session) {
          sendResponse({ ok: false, error: "no session context" });
          break;
        }
        // The confirm page sends real requests to the visa site, so it honors
        // the monitor's cooldown (after a challenge or ban) and the global daily
        // budget like the scheduled polls do.
        const guard = checkConfirmGuard(state, msg.monitorId);
        if (!guard.ok) {
          sendResponse({ ok: false, error: guard.reason });
          break;
        }
        const monitor =
          state.monitors.find((m) => m.id === msg.monitorId) ??
          // If the monitor was deleted, fall back to the expedite flag carried
          // in the confirm link so we query the correct calendar.
          ({ expedite: !!msg.expedite } as never);
        const times = await adapter.getTimes(monitor, msg.date, msg.facilityId, session);
        await recordConfirmRequest(msg.monitorId, times.outcome);
        sendResponse({ ok: true, times });
        break;
      }
      case "confirmBook": {
        // The user clicked "confirm": book with the logged-in browser session.
        // A person picked this slot, so the unattended auto-book checks do not
        // apply, but the kill switch, the cooldown and the global budget still do.
        const state = await loadState();
        const session = buildSession(state);
        if (!session) {
          sendResponse({ ok: false, error: "会话未同步，请先在弹窗中同步会话。" });
          break;
        }
        if (state.autoBook.killSwitch) {
          sendResponse({ ok: false, error: "预约总开关（kill switch）已开启，已拒绝改期。" });
          break;
        }
        const guard = checkConfirmGuard(state, msg.monitorId);
        if (!guard.ok) {
          sendResponse({ ok: false, error: guard.reason });
          break;
        }
        // Idempotency lock: refuse a duplicate booking for the same target
        // within the window, and block a concurrent auto-tick for this monitor.
        const key = bookingKey(msg.monitorId, msg.facilityId, msg.date, msg.time);
        if (isDuplicateBooking(recentBookings, key, Date.now()) || inFlight.has(msg.monitorId)) {
          sendResponse({
            ok: false,
            error: "该预约请求正在处理或刚刚已提交，已忽略重复点击（防止重复改期）。",
          });
          break;
        }
        recentBookings.set(key, Date.now());
        inFlight.add(msg.monitorId);
        let result: { status: string; message?: string };
        try {
          result = await adapter.reschedule(
            {
              facilityId: msg.facilityId,
              date: msg.date,
              time: msg.time,
              monitorId: msg.monitorId,
            },
            session,
          );
        } finally {
          inFlight.delete(msg.monitorId);
        }
        await recordConfirmRequest(
          msg.monitorId,
          result.status === "recaptcha_required" ? "challenge" : result.status === "failed" ? "network_error" : "ok",
        );
        // On confirmed booking, update the user's current appointment locally.
        if (result.status === "confirmed") {
          const fresh = await mutate(async (s) => {
            s.currentAppointment = { date: msg.date, facilityId: msg.facilityId };
            const bk = s.bookkeeping[msg.monitorId] ?? { bookingsMade: 0, bookingTimes: [] };
            bk.bookingsMade += 1;
            bk.bookingTimes.push(Date.now());
            s.bookkeeping[msg.monitorId] = bk;
            return s;
          });
          await dispatch(channelsFor(fresh), {
            title: "✅ 预约已确认 / Booked",
            body: `${msg.date} ${msg.time}`,
            priority: "high",
            kind: "booked",
          });
        }
        sendResponse({ ok: true, result });
        break;
      }
      case "testNotify": {
        // Sent from the options page so you can check that each channel really delivers.
        const state = await loadState();
        const results = await dispatch(buildChannels(state.channels), {
          title: "VisaLark 测试 / test",
          body: "如果你收到这条，这个渠道可以用。If you got this, the channel works.",
          priority: "normal",
          kind: "heartbeat",
        });
        sendResponse({ ok: true, results });
        break;
      }
      case "resumeMonitor": {
        // Resume after a stop: clear the error/cooldown state but keep the
        // daily request history, then re-enable and rearm.
        await mutate(async (state) => {
          const bo = state.backoff[msg.monitorId];
          if (bo) state.backoff[msg.monitorId] = resetBackoff(bo);
          state.monitors = state.monitors.map((m) =>
            m.id === msg.monitorId ? { ...m, enabled: true } : m,
          );
          return state;
        });
        await rearmAll();
        sendResponse({ ok: true });
        break;
      }
      default:
        sendResponse({ ok: false, error: "unknown message" });
    }
  })();
  return true; // async response
});
