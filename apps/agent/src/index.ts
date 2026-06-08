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
  loadConfig,
  toSession,
  loadState,
  saveState,
  type AgentConfig,
  type AgentState,
} from "./config.js";

/**
 * VisaLark local agent. Power-user data plane: runs 24x7 on the USER'S OWN
 * residential machine, cookie-only, same engine as the extension, same safety
 * laws. It refuses to run on detected cloud infra (residential-IP guard).
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
      const m = `⛔ This looks like a DATACENTER IP (${ip.matchedHint}). Polling usvisa-info from a cloud ASN while you logged in from home is the #1 way to get your visa account SUSPENDED (impossible-travel detection). Run the agent on your own home network instead.`;
      if (!cfg.allowDatacenterIp) {
        log(m);
        log("Refusing to start. Set allowDatacenterIp:true to override (NOT recommended).");
        process.exit(2);
      }
      log(`${m}\n(allowDatacenterIp override is set — proceeding against advice.)`);
    } else {
      log("✅ IP looks residential. Safe to proceed.");
    }
  } else {
    log("⚠️ Could not verify egress IP. Proceeding, but ensure you're on your home network.");
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
      confirmUrlBase: cfg.controlPlaneUrl
        ? `${cfg.controlPlaneUrl.replace(/\/$/, "")}/confirm`
        : undefined,
      getCurrentAppointment: () => cfg.currentAppointment,
      getAutoBookContext: () => ({
        bookingsMade: bk.bookingsMade,
        bookingsToday: bk.bookingTimes.filter((t) => t > dayAgo()).length,
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

  // keep process alive
  process.on("SIGINT", () => {
    log("Shutting down. State saved.");
    saveState(cfg.stateFile!, state);
    for (const t of timers.values()) clearTimeout(t);
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
    await fetch(`${cfg.controlPlaneUrl.replace(/\/$/, "")}/api/observations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.controlPlaneToken}`,
      },
      body: JSON.stringify({ monitorId, dates, at }),
    });
  } catch {
    /* control plane optional */
  }
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
