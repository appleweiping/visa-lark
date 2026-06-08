import { describe, it, expect } from "vitest";
import {
  POLL_PROFILES,
  jitteredInterval,
  initBackoff,
  decideNextAction,
  recordOutcome,
  classifyIpOrg,
  MAX_CONSECUTIVE_ERRORS,
  CHALLENGE_COOLDOWN_MS,
} from "../src/safety.js";

describe("jitteredInterval", () => {
  it("never returns a fixed value (stays within ± jitter band)", () => {
    const p = POLL_PROFILES.patient!;
    const lo = p.baseIntervalMs * (1 - p.jitterPct);
    const hi = p.baseIntervalMs * (1 + p.jitterPct);
    for (let i = 0; i < 200; i++) {
      const v = jitteredInterval(p);
      expect(v).toBeGreaterThanOrEqual(Math.floor(lo) - 1);
      expect(v).toBeLessThanOrEqual(Math.ceil(hi) + 1);
    }
  });
  it("respects a deterministic rng at the extremes", () => {
    const p = POLL_PROFILES.balanced!;
    expect(jitteredInterval(p, () => 0)).toBe(
      Math.round(p.baseIntervalMs * (1 - p.jitterPct)),
    );
    expect(jitteredInterval(p, () => 1)).toBe(
      Math.round(p.baseIntervalMs * (1 + p.jitterPct)),
    );
  });
  it("all profiles poll no faster than 90s base", () => {
    for (const p of Object.values(POLL_PROFILES)) {
      expect(p.baseIntervalMs).toBeGreaterThanOrEqual(90_000);
    }
  });
});

describe("fail-safe state machine", () => {
  it("a challenge forces a long cooldown AND escalates to STOP", () => {
    const now = 1_000_000;
    let s = initBackoff();
    s = recordOutcome(s, "challenge", now);
    expect(s.consecutiveErrors).toBeGreaterThanOrEqual(MAX_CONSECUTIVE_ERRORS);
    expect(s.cooldownUntil).toBe(now + CHALLENGE_COOLDOWN_MS);
    const action = decideNextAction(s, POLL_PROFILES.patient!, now + 1000);
    expect(action.kind).toBe("stop");
    if (action.kind === "stop") expect(action.notify).toBe(true);
  });

  it("a ban is treated as STOP+notify", () => {
    const now = 2_000_000;
    let s = initBackoff();
    s = recordOutcome(s, "banned", now);
    const action = decideNextAction(s, POLL_PROFILES.patient!, now + 1000);
    expect(action.kind).toBe("stop");
  });

  it("ok outcome resets error count and clears cooldown", () => {
    const now = 3_000_000;
    let s = initBackoff();
    s = recordOutcome(s, "rate_limited", now);
    expect(s.consecutiveErrors).toBe(1);
    s = recordOutcome(s, "ok", now + 1000);
    expect(s.consecutiveErrors).toBe(0);
    expect(s.cooldownUntil).toBe(0);
  });

  it("rate limit triggers a cooldown wait, not an immediate poll", () => {
    const now = 4_000_000;
    let s = initBackoff();
    s = recordOutcome(s, "rate_limited", now);
    const action = decideNextAction(s, POLL_PROFILES.patient!, now + 1000);
    expect(action.kind).toBe("wait");
  });

  it("enforces the daily cap", () => {
    const now = 5_000_000;
    let s = initBackoff();
    const profile = { ...POLL_PROFILES.patient!, dailyCap: 3 };
    // 3 successful polls
    for (let i = 0; i < 3; i++) s = recordOutcome(s, "ok", now + i);
    const action = decideNextAction(s, profile, now + 10);
    expect(action.kind).toBe("wait");
    if (action.kind === "wait") expect(action.reason).toBe("daily_cap");
  });

  it("after cooldown expires with errors below threshold, resumes polling", () => {
    const now = 6_000_000;
    let s = initBackoff();
    s = recordOutcome(s, "network_error", now); // 1 error, no cooldown yet
    const action = decideNextAction(s, POLL_PROFILES.patient!, now + 1000);
    expect(action.kind).toBe("poll");
  });
});

describe("datacenter ASN guard", () => {
  it("flags known cloud orgs", () => {
    expect(classifyIpOrg("Oracle Cloud (OCI)").isLikelyDatacenter).toBe(true);
    expect(classifyIpOrg("AS16509 Amazon.com, Inc.").isLikelyDatacenter).toBe(true);
    expect(classifyIpOrg("Alibaba (US) Technology Co.").isLikelyDatacenter).toBe(true);
  });
  it("does not flag residential ISPs", () => {
    expect(classifyIpOrg("China Telecom Guangdong").isLikelyDatacenter).toBe(false);
    expect(classifyIpOrg("Comcast Cable").isLikelyDatacenter).toBe(false);
    expect(classifyIpOrg(undefined).isLikelyDatacenter).toBe(false);
  });
});
