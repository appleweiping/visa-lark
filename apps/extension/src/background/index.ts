import {
  POLL_PROFILES,
  DEFAULT_PROFILE,
  initBackoff,
  runMonitorOnce,
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
  type ExtState,
} from "../lib/storage.js";

/**
 * Background service worker. Drives the monitor engine on a jittered schedule
 * using chrome.alarms. MV3 service workers are ephemeral, so ALL state
 * (backoff, schedule, logs) is persisted in chrome.storage and reloaded each
 * wake — a worker eviction can never reset a cooldown (DESIGN.md §3.4).
 */

const ALARM_PREFIX = "visalark:";
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
      confirmUrlBase: state.controlPlaneUrl
        ? `${state.controlPlaneUrl.replace(/\/$/, "")}/confirm`
        : undefined,
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

  // Persist new backoff + bookkeeping + log.
  const fresh = await loadState();
  fresh.backoff[monitorId] = result.backoff;
  fresh.bookkeeping[monitorId] = bk;
  fresh.logs.push({
    at: Date.now(),
    monitorId,
    outcome: result.outcome,
    note: result.note,
  });
  await saveState(fresh);

  // Schedule next run, or stop.
  if (result.next.kind === "stopped") {
    // Disable the monitor so it doesn't silently keep retrying a banned/expired session.
    fresh.monitors = fresh.monitors.map((m) =>
      m.id === monitorId ? { ...m, enabled: false } : m,
    );
    await saveState(fresh);
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
}

// ---- Event wiring ----

chrome.runtime.onInstalled.addListener(() => {
  void rearmAll();
});
chrome.runtime.onStartup.addListener(() => {
  void rearmAll();
});

chrome.alarms.onAlarm.addListener((alarm) => {
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
      default:
        sendResponse({ ok: false, error: "unknown message" });
    }
  })();
  return true; // async response
});
