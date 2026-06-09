import {
  POLL_PROFILES,
  DEFAULT_PROFILE,
  initBackoff,
  decideNextAction,
  type BackoffState,
} from "@visa-lark/shared";

/**
 * Pure host-side helpers extracted from the background service worker so the
 * money-path logic (confirm guard, global budget, idempotency) is unit-testable
 * without a `chrome` mock (M4). The worker is a thin wrapper over these.
 */

export const DAY_MS = 24 * 60 * 60_000;

/** Global account-wide daily request ceiling for a given poll profile. */
export function globalCap(pollProfile: string): number {
  const p = POLL_PROFILES[pollProfile] ?? POLL_PROFILES[DEFAULT_PROFILE]!;
  return Math.round(p.dailyCap * 1.5);
}

/** Count request stamps within the last 24h. */
export function usedToday(globalPolls: number[], now: number): number {
  const dayAgo = now - DAY_MS;
  return globalPolls.filter((t) => t > dayAgo).length;
}

/** Append `count` request stamps and prune anything older than 24h. */
export function appendGlobalPolls(globalPolls: number[], count: number, now: number): number[] {
  const dayAgo = now - DAY_MS;
  const stamps = Array.from({ length: Math.max(0, count) }, () => now);
  return [...globalPolls.filter((t) => t > dayAgo), ...stamps];
}

export type ConfirmGuard = { ok: true } | { ok: false; reason: string };

/**
 * Decide whether a human-initiated confirm action may touch usvisa-info.
 * Honors the monitor's hard cooldown (challenge/ban) and the global daily
 * budget even though a human triggered it (MEDIUM-2).
 */
export function checkConfirmGuard(
  backoff: BackoffState | undefined,
  pollProfile: string,
  globalPolls: number[],
  now: number,
): ConfirmGuard {
  const bo = backoff ?? initBackoff();
  const profile = POLL_PROFILES[pollProfile] ?? POLL_PROFILES[DEFAULT_PROFILE]!;
  const action = decideNextAction(bo, profile, now);
  if (action.kind === "stop") {
    return { ok: false, reason: "该监控处于安全冷却中（曾遇验证拦截/限制），请稍后再试或重新同步会话。" };
  }
  if (usedToday(globalPolls, now) >= globalCap(pollProfile)) {
    return { ok: false, reason: "今日请求已达账号安全上限，请明日再试。" };
  }
  return { ok: true };
}

/**
 * Idempotency check for a destructive booking (H3): refuse a duplicate target
 * within the window. Returns whether the booking may proceed.
 */
export function bookingKey(monitorId: string, facilityId: string, date: string, time: string): string {
  return `${monitorId}|${facilityId}|${date}|${time}`;
}

export const BOOKING_IDEMPOTENCY_MS = 2 * 60_000;

export function isDuplicateBooking(
  recent: Map<string, number>,
  key: string,
  now: number,
): boolean {
  const last = recent.get(key);
  return !!last && now - last < BOOKING_IDEMPOTENCY_MS;
}
