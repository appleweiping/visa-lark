import { describe, it, expect } from "vitest";
import {
  evaluateAutoBook,
  earliestAcceptable,
  dateMatchesMonitor,
  DEFAULT_AUTOBOOK_CONFIG,
  type AutoBookContext,
} from "../src/interlocks.js";
import type { BookingTarget, Monitor } from "../src/types.js";

const baseMonitor: Monitor = {
  id: "m1",
  label: "test",
  facilityIds: ["95", "96"],
  visaType: "B1/B2",
  dowFilter: [],
  expedite: false,
  mode: "auto",
  pollProfile: "patient",
  enabled: true,
};

const target: BookingTarget = {
  facilityId: "95",
  date: "2026-07-01",
  time: "09:00",
  monitorId: "m1",
};

const okCtx: AutoBookContext = {
  current: { date: "2026-12-01", facilityId: "95" },
  bookingsMade: 5, // past confirmFirstN
  bookingsToday: 0,
};

function cfg(overrides = {}) {
  return {
    ...DEFAULT_AUTOBOOK_CONFIG,
    allowedFacilityIds: ["95", "96"],
    confirmFirstN: 0,
    ...overrides,
  };
}

describe("auto-book interlocks", () => {
  it("allows a strictly-better booking to an allowed facility", () => {
    const d = evaluateAutoBook(target, cfg(), okCtx);
    expect(d.allowed).toBe(true);
  });

  it("blocks when kill switch engaged", () => {
    const d = evaluateAutoBook(target, cfg({ killSwitch: true }), okCtx);
    expect(d.allowed).toBe(false);
  });

  it("refuses to move to a facility not in the allowlist", () => {
    const d = evaluateAutoBook(target, cfg({ allowedFacilityIds: ["96"] }), okCtx);
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.reason).toMatch(/allowlist/i);
  });

  it("refuses a marginal improvement below minImprovementDays", () => {
    const nearTarget = { ...target, date: "2026-11-28" }; // only 3 days earlier
    const d = evaluateAutoBook(nearTarget, cfg({ minImprovementDays: 7 }), okCtx);
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.reason).toMatch(/earlier/i);
  });

  it("refuses to auto-book a FIRST appointment (no current date)", () => {
    const d = evaluateAutoBook(target, cfg(), { ...okCtx, current: {} });
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.reason).toMatch(/first appointment/i);
  });

  it("requires human confirm for the first N bookings", () => {
    const d = evaluateAutoBook(target, cfg({ confirmFirstN: 1 }), {
      ...okCtx,
      bookingsMade: 0,
    });
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.requiresHumanConfirm).toBe(true);
  });

  it("enforces per-day cap", () => {
    const d = evaluateAutoBook(target, cfg({ perDayCap: 2 }), {
      ...okCtx,
      bookingsToday: 2,
    });
    expect(d.allowed).toBe(false);
  });

  it("honors dry-run flag", () => {
    const d = evaluateAutoBook(target, cfg({ dryRun: true }), okCtx);
    expect(d.allowed).toBe(true);
    if (d.allowed) expect(d.dryRun).toBe(true);
  });
});

describe("filters + earliest selection", () => {
  it("earliestAcceptable picks the soonest matching date across facilities", () => {
    const dates = [
      { date: "2026-09-01", facilityId: "95" },
      { date: "2026-08-15", facilityId: "96" },
      { date: "2026-08-10", facilityId: "99" }, // not in monitor facilities
    ];
    const e = earliestAcceptable(dates, baseMonitor);
    expect(e?.date).toBe("2026-08-15");
    expect(e?.facilityId).toBe("96");
  });

  it("date range filter excludes out-of-range dates", () => {
    const m = { ...baseMonitor, dateMin: "2026-08-01", dateMax: "2026-08-31" };
    expect(dateMatchesMonitor("2026-08-15", m)).toBe(true);
    expect(dateMatchesMonitor("2026-09-15", m)).toBe(false);
    expect(dateMatchesMonitor("2026-07-15", m)).toBe(false);
  });

  it("day-of-week filter works", () => {
    // 2026-07-01 is a Wednesday (UTC). Filter to weekends only → excluded.
    const m = { ...baseMonitor, dowFilter: [0, 6] };
    expect(dateMatchesMonitor("2026-07-01", m)).toBe(false);
    // 2026-07-04 is a Saturday → included.
    expect(dateMatchesMonitor("2026-07-04", m)).toBe(true);
  });
});
