import { describe, it, expect } from "vitest";
import {
  globalCap,
  usedToday,
  appendGlobalPolls,
  checkConfirmGuard,
  bookingKey,
  isDuplicateBooking,
  BOOKING_IDEMPOTENCY_MS,
} from "./guards.js";
import { initBackoff, recordOutcome, POLL_PROFILES } from "@visa-lark/shared";

const NOW = 1_000_000_000;

describe("global request budget accounting (H1/H2/MEDIUM-1)", () => {
  it("globalCap is 1.5x the profile daily cap", () => {
    expect(globalCap("patient")).toBe(Math.round(POLL_PROFILES.patient!.dailyCap * 1.5));
  });

  it("usedToday counts only stamps within 24h", () => {
    const polls = [NOW - 25 * 3600_000, NOW - 1000, NOW - 2000];
    expect(usedToday(polls, NOW)).toBe(2);
  });

  it("appendGlobalPolls adds exactly `count` stamps and prunes old ones", () => {
    const polls = [NOW - 25 * 3600_000]; // stale
    const next = appendGlobalPolls(polls, 3, NOW);
    expect(next).toHaveLength(3); // stale pruned, 3 added
    expect(next.every((t) => t === NOW)).toBe(true);
  });

  it("appendGlobalPolls with count 0 just prunes", () => {
    expect(appendGlobalPolls([NOW - 1000], 0, NOW)).toHaveLength(1);
    expect(appendGlobalPolls([NOW - 25 * 3600_000], 0, NOW)).toHaveLength(0);
  });
});

describe("checkConfirmGuard (MEDIUM-2)", () => {
  it("allows when healthy and under budget", () => {
    expect(checkConfirmGuard(initBackoff(), "patient", [], NOW).ok).toBe(true);
  });

  it("blocks when the monitor is in a hard cooldown (challenge)", () => {
    let bo = initBackoff();
    bo = recordOutcome(bo, "challenge", NOW); // forces stop-level cooldown
    const g = checkConfirmGuard(bo, "patient", [], NOW + 1000);
    expect(g.ok).toBe(false);
  });

  it("blocks when the global daily budget is exhausted", () => {
    const cap = globalCap("patient");
    const polls = Array.from({ length: cap }, () => NOW - 1000);
    const g = checkConfirmGuard(initBackoff(), "patient", polls, NOW);
    expect(g.ok).toBe(false);
    if (!g.ok) expect(g.reason).toMatch(/上限/);
  });
});

describe("idempotency lock (H3)", () => {
  it("flags a duplicate booking within the window", () => {
    const recent = new Map<string, number>();
    const key = bookingKey("m1", "95", "2026-07-01", "09:00");
    recent.set(key, NOW);
    expect(isDuplicateBooking(recent, key, NOW + 1000)).toBe(true);
    expect(isDuplicateBooking(recent, key, NOW + BOOKING_IDEMPOTENCY_MS + 1)).toBe(false);
  });

  it("different targets are not duplicates", () => {
    const recent = new Map<string, number>();
    recent.set(bookingKey("m1", "95", "2026-07-01", "09:00"), NOW);
    expect(isDuplicateBooking(recent, bookingKey("m1", "95", "2026-07-01", "10:00"), NOW)).toBe(false);
  });
});
