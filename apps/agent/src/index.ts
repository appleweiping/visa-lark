#!/usr/bin/env node
import {
  POLL_PROFILES,
  DEFAULT_PROFILE,
  initBackoff,
  runMonitorOnce,
  type BackoffState,
  type Monitor,
} from "@visa-lark/shared";
import { UsVisaInfoAdapter } from "@visa-lark/adapter-usvisa-info";
import { buildChannels } from "@visa-lark/notify";
import { NodeTransport } from "./transport.js";
import { checkEgressIp } from "./ip-guard.js";
import {
  ConfigError,
  loadConfig,
  toSession,
  loadState,
  saveState,
  type AgentConfig,
  type AgentState,
} from "./config.js";

/**
 * VisaLark local agent. Runs the extension's monitor engine on the user's own
 * home machine with a copied session cookie, and refuses to start on a detected
 * cloud network (residential-IP guard).
 */

const log = (msg: string) => console.log(`[${new Date().toISOString()}] ${msg}`);

function timersByMonitor(): Map<string, NodeJS.Timeout> {
  return new Map();
}

async function main() {
  const configPath = process.argv[2] ?? process.env.VISALARK_CONFIG ?? "./visalark.config.json";
  const cfg = loadConfig(configPath);
  const session = toSession(cfg);
  const transport = new NodeTransport(session);
  const adapter = new UsVisaInfoAdapter(transport);

  // ---- Residential-IP guard (DESIGN.md §3.1) ----
  log("Checking egress IP reputation...");
  const ip = await checkEgressIp();
  if (ip.checked) {
    log(`Egress IP ${ip.ip ?? "?"} org="${ip.org ?? "?"}"`);
    if (ip.isLikelyDatacenter) {
      const m = `This looks like a datacenter IP (${ip.matchedHint}). Requests from a cloud network while you logged in from home can look like account takeover to the visa site and get the account restricted. Run the agent on your home network instead.`;
      if (!cfg.allowDatacenterIp) {
        log(m);
        log("Refusing to start. Set allowDatacenterIp:true to override (NOT recommended).");
        process.exit(2);
      }
      log(`${m}\n(allowDatacenterIp override is set — proceeding against advice.)`);
    } else {
      log("IP does not match a known cloud provider. Starting.");
    }
  } else {
    log("Could not look up the egress IP. Starting anyway; make sure you are on your home network.");
  }

  const state: AgentState = loadState(cfg.stateFile!);
  const channels = buildChannels(cfg.channels);
  const timers = timersByMonitor();
  const dayAgo = () => Date.now() - 24 * 60 * 60_000;

  async function tick(monitor: Monitor) {
    if (!monitor.enabled) return;
    const profile = POLL_PROFILES[monitor.pollProfile] ?? POLL_PROFILES[DEFAULT_PROFILE]!;
    const backoff = (state.backoff[monitor.id] as BackoffState) ?? initBackoff();
    const bk = state.bookkeeping[monitor.id] ?? { bookingsMade: 0, bookingTimes: [] };

    const result = await runMonitorOnce(monitor, session, profile, cfg.autoBook, backoff, {
      adapter,
      channels,
      // The agent has no local confirm UI and the control plane can't book
      // (it holds no credentials), so a confirm deep link would lead nowhere.
      // Agent only emits notify/auto — `confirm` is downgraded to notify
      // (see config normalization). No confirmUrlBase here.
      getCurrentAppointment: () => cfg.currentAppointment,
      getAutoBookContext: () => ({
        bookingsMade: bk.bookingsMade,
        bookingsToday: bk.bookingTimes.filter((t) => t > dayAgo()).length,
      }),
      // Account-wide daily request budget across all monitors. An agent that
      // runs around the clock needs this more than the extension does.
      getGlobalRequestBudget: () => ({
        used: state.globalPolls.filter((t) => t > dayAgo()).length,
        cap: Math.round(profile.dailyCap * 1.5),
      }),
      onObservation: (dates, at) => void relay(cfg, monitor.id, dates, at),
      onBooked: (r) => {
        if (r.status === "confirmed") {
          bk.bookingsMade += 1;
          bk.bookingTimes.push(Date.now());
        }
      },
    });

    state.backoff[monitor.id] = result.backoff;
    state.bookkeeping[monitor.id] = bk;
    // Append this cycle's real request count to the global budget, prune >24h.
    const nowTs = Date.now();
    state.globalPolls = [
      ...state.globalPolls.filter((t) => t > nowTs - 24 * 60 * 60_000),
      ...Array.from({ length: result.requestsIssued }, () => nowTs),
    ];
    saveState(cfg.stateFile!, state);
    log(`[${monitor.label || monitor.id}] ${result.outcome} — ${result.note}`);

    if (result.next.kind === "stopped") {
      log(`[${monitor.label || monitor.id}] STOPPED: ${result.next.reason}`);
      return; // do not reschedule
    }
    const t = setTimeout(() => void tick(monitor), result.next.delayMs);
    timers.set(monitor.id, t);
  }

  log(`Starting ${cfg.monitors.filter((m) => m.enabled).length} monitor(s).`);
  for (const m of cfg.monitors) {
    if (!m.enabled) continue;
    // stagger initial fire
    const jitter = 1000 + Math.random() * 30_000;
    setTimeout(() => void tick(m), jitter);
  }

  // Periodic IP re-check: a long-running agent can have its network change (VPN
  // toggled on, routed through a datacenter). Re-verify hourly; if it drifts to
  // a datacenter ASN, stop all monitors to protect the account.
  const ipRecheck = setInterval(async () => {
    if (cfg.allowDatacenterIp) return;
    const r = await checkEgressIp();
    if (r.checked && r.isLikelyDatacenter) {
      log(`Egress IP changed to a datacenter network (${r.matchedHint}). Stopping all monitors.`);
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();
    }
  }, 60 * 60_000);
  ipRecheck.unref?.();

  // keep process alive
  process.on("SIGINT", () => {
    log("Shutting down. State saved.");
    saveState(cfg.stateFile!, state);
    for (const t of timers.values()) clearTimeout(t);
    clearInterval(ipRecheck);
    process.exit(0);
  });
}

async function relay(
  cfg: AgentConfig,
  monitorId: string,
  dates: { date: string; facilityId: string }[],
  at: number,
): Promise<void> {
  if (!cfg.controlPlaneUrl || !cfg.controlPlaneToken || dates.length === 0) return;
  try {
    const res = await fetch(`${cfg.controlPlaneUrl.replace(/\/$/, "")}/api/observations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.controlPlaneToken}`,
      },
      body: JSON.stringify({ monitorId, dates, at }),
    });
    if (!res.ok) log(`control-plane relay rejected: HTTP ${res.status}`);
  } catch {
    /* control plane optional — a relay failure must never break monitoring */
  }
}

main().catch((e) => {
  // A config mistake is the user's to fix, so print just the message. Anything
  // else is a bug and keeps its stack trace.
  if (e instanceof ConfigError) console.error(e.message);
  else console.error("Fatal:", e);
  process.exit(1);
});
