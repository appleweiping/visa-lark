import { readFileSync, existsSync, writeFileSync } from "node:fs";
import {
  Monitor,
  type Session,
  type CurrentAppointment,
  type AutoBookConfig,
  DEFAULT_AUTOBOOK_CONFIG,
} from "@visa-lark/shared";
import type { ChannelConfig } from "@visa-lark/notify";

/**
 * Agent config schema. Loaded from a JSON file (default ./visalark.config.json).
 * Cookie-only: the user pastes the `_yatri_session` cookie they exported from
 * their own logged-in browser. We never store a password. (DESIGN.md §3.3)
 */
export interface AgentConfig {
  session: {
    /** Full Cookie header value, e.g. "_yatri_session=...". */
    cookie: string;
    embassyCode: string;
    scheduleId: string;
    userAgent?: string;
  };
  monitors: Monitor[];
  channels: ChannelConfig[];
  currentAppointment: CurrentAppointment;
  autoBook: AutoBookConfig;
  /** Override the residential-IP guard (NOT recommended). */
  allowDatacenterIp?: boolean;
  /** Optional control-plane relay. */
  controlPlaneUrl?: string;
  controlPlaneToken?: string;
  /** State file for persisted backoff/bookkeeping (so restarts keep cooldowns). */
  stateFile?: string;
}

/** A problem in the user's config file. The agent prints the message without a stack trace. */
export class ConfigError extends Error {
  override name = "ConfigError";
}

export function loadConfig(path: string): AgentConfig {
  if (!existsSync(path)) {
    throw new ConfigError(
      `Config not found at ${path}. Copy visalark.config.example.json and fill it in.`,
    );
  }
  let raw: Partial<AgentConfig>;
  try {
    raw = JSON.parse(readFileSync(path, "utf8")) as Partial<AgentConfig>;
  } catch (e) {
    throw new ConfigError(`Config at ${path} is not valid JSON: ${(e as Error).message}`);
  }
  if (!raw.session?.cookie || !raw.session.embassyCode || !raw.session.scheduleId) {
    throw new ConfigError("Config.session must include cookie, embassyCode, scheduleId.");
  }
  const monitors = (raw.monitors ?? []).map((m) => Monitor.parse(m)).map((m) => {
    // The agent can't serve a one-tap confirm link (no local UI, and the
    // control plane holds no session). Downgrade `confirm` → `notify` so users
    // never get a dead button. `auto` (unattended) still works on the agent.
    if (m.mode === "confirm") {
      console.warn(
        `[config] Monitor "${m.label || m.id}": mode "confirm" is not supported by the local agent (it's extension-only). Downgrading to "notify". Use the browser extension for one-tap confirm, or "auto" for unattended booking.`,
      );
      return { ...m, mode: "notify" as const };
    }
    return m;
  });
  return {
    session: raw.session,
    monitors,
    channels: raw.channels ?? [],
    currentAppointment: raw.currentAppointment ?? {},
    autoBook: { ...DEFAULT_AUTOBOOK_CONFIG, ...(raw.autoBook ?? {}) },
    allowDatacenterIp: raw.allowDatacenterIp ?? false,
    controlPlaneUrl: raw.controlPlaneUrl,
    controlPlaneToken: raw.controlPlaneToken,
    stateFile: raw.stateFile ?? "./visalark.state.json",
  };
}

export function toSession(cfg: AgentConfig): Session {
  return {
    cookie: cfg.session.cookie,
    embassyCode: cfg.session.embassyCode,
    scheduleId: cfg.session.scheduleId,
    userAgent: cfg.session.userAgent,
    acquiredAt: Date.now(),
  };
}

// ---- Persisted runtime state (backoff + bookkeeping) ----
export interface AgentState {
  backoff: Record<string, unknown>;
  bookkeeping: Record<string, { bookingsMade: number; bookingTimes: number[] }>;
  /** Request timestamps across all monitors, for the account-wide daily cap. */
  globalPolls: number[];
}

export function loadState(path: string): AgentState {
  if (existsSync(path)) {
    try {
      const s = JSON.parse(readFileSync(path, "utf8")) as Partial<AgentState>;
      return { backoff: s.backoff ?? {}, bookkeeping: s.bookkeeping ?? {}, globalPolls: s.globalPolls ?? [] };
    } catch {
      /* corrupt → reset */
    }
  }
  return { backoff: {}, bookkeeping: {}, globalPolls: [] };
}

export function saveState(path: string, state: AgentState): void {
  writeFileSync(path, JSON.stringify(state, null, 2));
}
