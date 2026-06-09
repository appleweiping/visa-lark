import {
  POLL_PROFILES,
  DEFAULT_PROFILE,
  initBackoff,
  resetBackoff,
  runMonitorOnce,
  dispatch,
  type Monitor,
  type Session,
  type RunResult,
} from "@visa-lark/shared";
import { UsVisaInfoAdapter } from "@visa-lark/adapter-usvisa-info";
import { buildChannels } from "@visa-lark/notify";
import { BrowserTransport } from "../lib/transport.js";
import { BrowserNotificationChannel } from "../lib/browser-notify.js";
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

/** Run one monitor and schedule the next alarm based on the result. */
async function tick(monitorId: string): Promise<void> {
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
  const dayAgo = Date.now() - 24 * 60 * 60_000;

  let result: RunResult;
  try {
    result = await runMonitorOnce(monitor, session, profile, state.autoBook, backoff, {
      adapter,
      channels: channelsFor(state),
      // The one-tap confirm link points at an EXTENSION page (not the control
      // plane). Booking must happen in the data plane that holds the warm
      // browser session — the control plane has no session and cannot book (C1).
      confirmUrlBase: chrome.runtime.getURL("confirm.html"),
      getCurrentAppointment: () => state.currentAppointment,
      getAutoBookContext: () => ({
        bookingsMade: bk.bookingsMade,
        bookingsToday: bk.bookingTimes.filter((t) => t > dayAgo).length,
      }),
      onObservation: (dates, at) => {
        void relayObservation(state, monitorId, dates, at);
      },
      onBooked: (r) => {
        if (r.status === "confirmed") {
          bk.bookingsMade += 1;
          bk.bookingTimes.push(Date.now());
        }
      },
    });
  } catch (e) {
    await appendLog({ at: Date.now(), monitorId, outcome: "error", note: String(e) });
    // schedule a conservative retry
    await chrome.alarms.create(alarmName(monitorId), { delayInMinutes: 10 });
    return;
  }

  // Persist new backoff + bookkeeping + log atomically (H3 — serialized write).
  const stopped = result.next.kind === "stopped";
  await mutate(async (fresh) => {
    fresh.backoff[monitorId] = result.backoff;
    fresh.bookkeeping[monitorId] = bk;
    fresh.logs.push({
      at: Date.now(),
      monitorId,
      outcome: result.outcome,
      note: result.note,
    });
    if (stopped) {
      // Disable the monitor so it doesn't silently keep retrying a banned/expired session.
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
  state: ExtState,
  monitorId: string,
  dates: { date: string; facilityId: string }[],
  at: number,
): Promise<void> {
  if (!state.controlPlaneUrl || !state.controlPlaneToken || dates.length === 0) return;
  try {
    await fetch(`${state.controlPlaneUrl.replace(/\/$/, "")}/api/observations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.controlPlaneToken}`,
      },
      body: JSON.stringify({ monitorId, dates, at }),
    });
  } catch {
    // Control plane is optional; never let a relay failure affect monitoring.
  }
}

/** (Re)arm alarms for all enabled monitors. */
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
  // Heartbeat (M3): a daily low-priority "still alive" ping so the user can tell
  // "monitor alive, no slots" apart from "monitor died". Only if a channel exists.
  await chrome.alarms.create(HEARTBEAT_ALARM, { periodInMinutes: 24 * 60, delayInMinutes: 24 * 60 });
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
        const monitor =
          state.monitors.find((m) => m.id === msg.monitorId) ??
          ({ expedite: false } as never);
        const times = await adapter.getTimes(monitor, msg.date, msg.facilityId, session);
        sendResponse({ ok: true, times });
        break;
      }
      case "confirmBook": {
        // The HUMAN clicked "confirm" — book using the warm browser session (C1).
        // This is human-in-the-loop, so it does NOT run the unattended auto-book
        // interlocks; the user explicitly chose this slot. We still fail safe.
        const state = await loadState();
        const session = buildSession(state);
        if (!session) {
          sendResponse({ ok: false, error: "会话未同步，请先在弹窗中同步会话。" });
          break;
        }
        const result = await adapter.reschedule(
          {
            facilityId: msg.facilityId,
            date: msg.date,
            time: msg.time,
            monitorId: msg.monitorId,
          },
          session,
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
      case "resumeMonitor": {
        // Re-sync recovery (M4): clear the error/cooldown state but keep the
        // daily request history, then re-enable + rearm.
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
