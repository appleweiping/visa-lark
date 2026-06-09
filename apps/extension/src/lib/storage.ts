import type { Monitor, CurrentAppointment } from "@visa-lark/shared";
import type { BackoffState } from "@visa-lark/shared";
import type { ChannelConfig } from "@visa-lark/notify";
import type { AutoBookConfig } from "@visa-lark/shared";

/**
 * Persisted extension state in chrome.storage.local.
 *
 * What we DO store: monitor configs, notification channel configs, poll profile,
 * backoff/scheduler state (so a restart can't reset a cooldown), poll logs,
 * slot-observation history, and the user's CURRENT appointment (date/facility)
 * which the user enters manually — needed for auto-book interlocks.
 *
 * What we NEVER store: the visa-portal password, or a copied session cookie.
 * The session lives in the browser's own cookie jar; we ride it via
 * credentials:"include". (DESIGN.md §3.3)
 */
export interface ExtState {
  monitors: Monitor[];
  channels: ChannelConfig[];
  /** Session context the user must provide (from their logged-in browser). */
  sessionCtx?: {
    embassyCode: string;
    scheduleId: string;
  };
  currentAppointment: CurrentAppointment;
  autoBook: AutoBookConfig;
  /** Per-monitor backoff state, keyed by monitor id. */
  backoff: Record<string, BackoffState>;
  /** Per-monitor bookkeeping for interlocks. */
  bookkeeping: Record<string, { bookingsMade: number; bookingTimes: number[] }>;
  /** Global (cross-monitor) request timestamps for the account-wide daily cap (MEDIUM-1). */
  globalPolls: number[];
  logs: PollLogEntry[];
  /** Optional control-plane URL to relay observations/notifications. */
  controlPlaneUrl?: string;
  controlPlaneToken?: string;
  /** Whether to also show a native browser notification on slot found. */
  browserNotifications: boolean;
}

export interface PollLogEntry {
  at: number;
  monitorId: string;
  outcome: string;
  note: string;
}

const KEY = "visalark_state_v1";

const DEFAULT_STATE: ExtState = {
  monitors: [],
  channels: [],
  currentAppointment: {},
  autoBook: {
    minImprovementDays: 7,
    allowedFacilityIds: [],
    confirmFirstN: 1,
    perDayCap: 2,
    killSwitch: false,
    dryRun: false,
  },
  backoff: {},
  bookkeeping: {},
  globalPolls: [],
  logs: [],
  browserNotifications: true,
};

export async function loadState(): Promise<ExtState> {
  const raw = await chrome.storage.local.get(KEY);
  const stored = raw[KEY] as Partial<ExtState> | undefined;
  return { ...DEFAULT_STATE, ...(stored ?? {}) };
}

export async function saveState(state: ExtState): Promise<void> {
  // Cap logs to the most recent 500 to bound storage.
  const logs = state.logs.slice(-500);
  await chrome.storage.local.set({ [KEY]: { ...state, logs } });
}

export async function patchState(patch: Partial<ExtState>): Promise<ExtState> {
  return mutate(async (cur) => {
    Object.assign(cur, patch);
    return cur;
  });
}

export async function appendLog(entry: PollLogEntry): Promise<void> {
  await mutate(async (cur) => {
    cur.logs.push(entry);
    return cur;
  });
}

/**
 * Serialized read-modify-write (H3). MV3 alarms for different monitors fire
 * independently and their handlers interleave; because each writes the WHOLE
 * state blob, a naive load→modify→save loses concurrent updates (dropped
 * cooldowns → resumed hammering; dropped bookkeeping → interlock bypass /
 * double-book). JS is single-threaded, so chaining every mutation onto one
 * promise queue makes each load→modify→save atomic w.r.t. the others.
 */
let writeChain: Promise<unknown> = Promise.resolve();

export function mutate(fn: (state: ExtState) => Promise<ExtState> | ExtState): Promise<ExtState> {
  const run = writeChain.then(async () => {
    const cur = await loadState();
    const next = await fn(cur);
    await saveState(next);
    return next;
  });
  // keep the chain alive even if one mutation throws
  writeChain = run.catch(() => undefined);
  return run;
}
