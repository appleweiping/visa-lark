import type { PollOutcome, SessionHealth } from "./types.js";

/**
 * Safety core. Codifies DESIGN.md §3 hard laws.
 *
 * Primary safety is RESIDENTIAL IP (enforced where the data plane runs).
 * This module covers the *secondary* safety controls: cadence, jitter, backoff,
 * cooldown, daily caps, and the fail-safe state machine. Cadence is secondary
 * because IP/fingerprint dominate the ban score — but we still behave politely.
 */

export interface PollProfile {
  /** Human label. */
  name: string;
  /** Base interval between polls, ms. Actual interval is jittered ± jitterPct. */
  baseIntervalMs: number;
  /** Jitter fraction, e.g. 0.4 = ±40%. Never poll on a fixed cadence. */
  jitterPct: number;
  /** Max polls allowed per rolling 24h window. Hard cap. */
  dailyCap: number;
}

/**
 * Named profiles. Intervals are deliberately conservative (90–300s range) — this
 * is NOT a speed tool. "patient" is the recommended default for account safety.
 */
export const POLL_PROFILES: Record<string, PollProfile> = {
  patient: { name: "patient", baseIntervalMs: 300_000, jitterPct: 0.4, dailyCap: 200 },
  balanced: { name: "balanced", baseIntervalMs: 180_000, jitterPct: 0.45, dailyCap: 350 },
  // "eager" is offered but flagged in UI as higher ban-risk. Still ≥90s.
  eager: { name: "eager", baseIntervalMs: 90_000, jitterPct: 0.5, dailyCap: 600 },
};

export const DEFAULT_PROFILE = "patient";

/** Cooldown applied after a soft failure (rate limit). */
export const RATE_LIMIT_COOLDOWN_MS = 60 * 60_000; // 1 hour
/** Cooldown applied after a hard wall (challenge / Cloudflare). STOP territory. */
export const CHALLENGE_COOLDOWN_MS = 4 * 60 * 60_000; // 4 hours
/** Max consecutive errors before we force a long cooldown and alert. */
export const MAX_CONSECUTIVE_ERRORS = 3;

/** Compute a jittered delay for the next poll. Never returns a fixed value. */
export function jitteredInterval(profile: PollProfile, rng: () => number = Math.random): number {
  const { baseIntervalMs, jitterPct } = profile;
  const delta = baseIntervalMs * jitterPct;
  // uniform in [base - delta, base + delta]
  return Math.round(baseIntervalMs - delta + rng() * 2 * delta);
}

/**
 * Scheduler backoff state. Persisted (SQLite / extension storage) so it survives
 * restarts — a restart must NOT reset a cooldown and resume hammering.
 */
export interface BackoffState {
  consecutiveErrors: number;
  /** Epoch ms before which we must not poll. */
  cooldownUntil: number;
  /** Rolling poll timestamps (epoch ms) within the last 24h, for the daily cap. */
  recentPolls: number[];
}

export function initBackoff(): BackoffState {
  return { consecutiveErrors: 0, cooldownUntil: 0, recentPolls: [] };
}

/**
 * Clear the error/cooldown state while PRESERVING the daily-request history.
 * Called when the user re-syncs their session after a challenge/expiry stop
 * (M4) — re-syncing should let monitoring resume, but it must not reset the
 * daily request cap (that protects the account regardless of session changes).
 */
export function resetBackoff(state: BackoffState): BackoffState {
  return { consecutiveErrors: 0, cooldownUntil: 0, recentPolls: state.recentPolls };
}

export type NextAction =
  | { kind: "poll" }
  | { kind: "wait"; untilMs: number; reason: string }
  | { kind: "stop"; reason: string; notify: true };

/**
 * The fail-safe decision function. Given current state + last outcome, decide
 * whether to poll, wait, or STOP-and-notify. Implements DESIGN.md §3.4:
 * any challenge/ban → STOP (never retry-through).
 */
export function decideNextAction(
  state: BackoffState,
  profile: PollProfile,
  now: number,
): NextAction {
  // Hard stop: a challenge/ban cooldown is treated as STOP+notify, the loop
  // should not silently resume — the human must re-establish a session.
  if (state.cooldownUntil > now && state.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
    return {
      kind: "stop",
      reason: "Repeated failures or a security challenge were detected. Polling halted to protect your visa account. Please re-open the visa site in your browser and re-sync your session.",
      notify: true,
    };
  }
  if (state.cooldownUntil > now) {
    return { kind: "wait", untilMs: state.cooldownUntil, reason: "cooldown" };
  }
  // Daily cap enforcement.
  const dayAgo = now - 24 * 60 * 60_000;
  const pollsToday = state.recentPolls.filter((t) => t > dayAgo).length;
  if (pollsToday >= profile.dailyCap) {
    const oldest = state.recentPolls.find((t) => t > dayAgo) ?? now;
    return { kind: "wait", untilMs: oldest + 24 * 60 * 60_000, reason: "daily_cap" };
  }
  return { kind: "poll" };
}

/** Map a session health into a poll outcome for backoff bookkeeping. */
export function healthToOutcome(h: SessionHealth): PollOutcome {
  switch (h) {
    case "healthy":
      return "ok";
    case "expired":
      return "session_expired";
    case "challenge":
      return "challenge";
    case "rate_limited":
      return "rate_limited";
    case "banned":
      return "banned";
    default:
      return "network_error";
  }
}

/**
 * Update backoff state after a poll cycle. Pure function — returns the new state.
 *
 * `requestCount` is the number of actual HTTP requests the cycle issued (a
 * multi-facility monitor makes one request per facility, plus times/reschedule
 * calls). The daily cap counts REQUESTS, not cycles, so it bounds the real load
 * on usvisa-info (H2). Defaults to 1 for callers that issue a single request.
 */
export function recordOutcome(
  state: BackoffState,
  outcome: PollOutcome,
  now: number,
  requestCount = 1,
): BackoffState {
  const dayAgo = now - 24 * 60 * 60_000;
  const newStamps = Array.from({ length: Math.max(1, requestCount) }, () => now);
  const recentPolls = [...state.recentPolls.filter((t) => t > dayAgo), ...newStamps];

  switch (outcome) {
    case "ok":
    case "empty":
      return { consecutiveErrors: 0, cooldownUntil: 0, recentPolls };
    case "rate_limited": {
      const consecutiveErrors = state.consecutiveErrors + 1;
      return {
        consecutiveErrors,
        cooldownUntil: now + RATE_LIMIT_COOLDOWN_MS,
        recentPolls,
      };
    }
    case "challenge":
    case "banned": {
      // Hard wall → long cooldown AND escalate the error count to the stop threshold.
      return {
        consecutiveErrors: Math.max(state.consecutiveErrors + 1, MAX_CONSECUTIVE_ERRORS),
        cooldownUntil: now + CHALLENGE_COOLDOWN_MS,
        recentPolls,
      };
    }
    case "session_expired":
      // Not a ban — but stop and ask the human to re-sync. Short error bump.
      return {
        consecutiveErrors: state.consecutiveErrors + 1,
        cooldownUntil: now + RATE_LIMIT_COOLDOWN_MS,
        recentPolls,
      };
    case "network_error":
    default: {
      const consecutiveErrors = state.consecutiveErrors + 1;
      // transient — short backoff, escalate only if persistent
      const cooldownUntil =
        consecutiveErrors >= MAX_CONSECUTIVE_ERRORS ? now + RATE_LIMIT_COOLDOWN_MS : 0;
      return { consecutiveErrors, cooldownUntil, recentPolls };
    }
  }
}

/**
 * Known datacenter/cloud ASNs and hostname hints. The data plane refuses to poll
 * (or loudly warns) when it detects it is running on cloud infra — because that
 * is the #1 account-ban vector (ASN / impossible-travel mismatch, DESIGN.md §1).
 * This is a best-effort heuristic, not a guarantee.
 */
export const CLOUD_ASN_HINTS: ReadonlyArray<string> = [
  "amazon",
  "aws",
  "ec2",
  "google cloud",
  "gcp",
  "googleusercontent",
  "microsoft",
  "azure",
  "oracle",
  "oraclecloud",
  "digitalocean",
  "linode",
  "akamai",
  "hetzner",
  "ovh",
  "vultr",
  "alibaba",
  "aliyun",
  "tencent",
  "cloudflare",
];

export interface IpReputation {
  isLikelyDatacenter: boolean;
  matchedHint?: string;
  org?: string;
}

/** Inspect an IP-info org/ISP string for datacenter hints. */
export function classifyIpOrg(org: string | undefined): IpReputation {
  if (!org) return { isLikelyDatacenter: false };
  const lower = org.toLowerCase();
  const matchedHint = CLOUD_ASN_HINTS.find((h) => lower.includes(h));
  return { isLikelyDatacenter: !!matchedHint, matchedHint, org };
}
