import { describe, it, expect, vi } from "vitest";
import { runMonitorOnce } from "../src/engine.js";
import { initBackoff, POLL_PROFILES } from "../src/safety.js";
import { DEFAULT_AUTOBOOK_CONFIG } from "../src/interlocks.js";
import type {
  VisaAdapter,
  NotifyChannel,
  Monitor,
  Session,
  DayResult,
  EngineDeps,
} from "../src/index.js";

const session: Session = {
  cookie: "c",
  embassyCode: "en-cn",
  scheduleId: "1",
  acquiredAt: 0,
};

const monitor: Monitor = {
  id: "m1",
  label: "Beijing B1/B2",
  facilityIds: ["95"],
  visaType: "B1/B2",
  dowFilter: [],
  expedite: false,
  mode: "notify",
  pollProfile: "patient",
  enabled: true,
};

function fakeAdapter(
  day: DayResult,
  times: string[] = ["09:00"],
  timesOutcome: "ok" | "challenge" | "session_expired" = "ok",
): VisaAdapter {
  return {
    id: "fake",
    displayName: "Fake",
    validateSession: async () => "healthy",
    getAvailableDays: async () => day,
    getTimes: async (_m, date, facilityId) => ({
      outcome: timesOutcome,
      date,
      facilityId,
      times: timesOutcome === "ok" ? times : [],
    }),
    reschedule: async (t) => ({ status: "confirmed", bookedDate: t.date, bookedTime: t.time }),
  };
}

function captureChannel(): { channel: NotifyChannel; sent: any[] } {
  const sent: any[] = [];
  return {
    sent,
    channel: {
      id: "cap",
      displayName: "cap",
      chinaReliable: true,
      send: async (m) => {
        sent.push(m);
        return { channel: "cap", delivered: true };
      },
    },
  };
}

function baseDeps(adapter: VisaAdapter, channel: NotifyChannel): EngineDeps {
  return {
    adapter,
    channels: [channel],
    getCurrentAppointment: () => ({ date: "2026-12-01", facilityId: "95" }),
    getAutoBookContext: () => ({ bookingsMade: 5, bookingsToday: 0 }),
    now: () => 1_000_000,
    rng: () => 0.5,
  };
}

describe("runMonitorOnce — notify mode", () => {
  it("pushes a high-priority alert when an acceptable slot is found", async () => {
    const adapter = fakeAdapter({
      outcome: "ok",
      dates: [{ date: "2026-08-01", facilityId: "95" }],
      earliest: { date: "2026-08-01", facilityId: "95" },
    });
    const cap = captureChannel();
    const r = await runMonitorOnce(
      monitor,
      session,
      POLL_PROFILES.patient!,
      DEFAULT_AUTOBOOK_CONFIG,
      initBackoff(),
      baseDeps(adapter, cap.channel),
    );
    expect(r.outcome).toBe("ok");
    expect(cap.sent).toHaveLength(1);
    expect(cap.sent[0].kind).toBe("slot_found");
    expect(cap.sent[0].priority).toBe("high");
    expect(r.next.kind).toBe("schedule");
  });

  it("does not alert when dates exist but none match the date filter", async () => {
    const m = { ...monitor, dateMin: "2026-01-01", dateMax: "2026-03-01" };
    const adapter = fakeAdapter({
      outcome: "ok",
      dates: [{ date: "2026-08-01", facilityId: "95" }],
      earliest: { date: "2026-08-01", facilityId: "95" },
    });
    const cap = captureChannel();
    const r = await runMonitorOnce(
      m,
      session,
      POLL_PROFILES.patient!,
      DEFAULT_AUTOBOOK_CONFIG,
      initBackoff(),
      baseDeps(adapter, cap.channel),
    );
    expect(cap.sent).toHaveLength(0);
    expect(r.note).toMatch(/none match/);
  });
});

describe("runMonitorOnce — fail-safe", () => {
  it("STOPS and notifies on a challenge outcome", async () => {
    const adapter = fakeAdapter({ outcome: "challenge", dates: [] });
    const cap = captureChannel();
    const r = await runMonitorOnce(
      monitor,
      session,
      POLL_PROFILES.patient!,
      DEFAULT_AUTOBOOK_CONFIG,
      initBackoff(),
      baseDeps(adapter, cap.channel),
    );
    expect(r.outcome).toBe("challenge");
    expect(r.next.kind).toBe("stopped");
  });

  it("notifies on session expiry and schedules a backoff", async () => {
    const adapter = fakeAdapter({ outcome: "session_expired", dates: [] });
    const cap = captureChannel();
    const r = await runMonitorOnce(
      monitor,
      session,
      POLL_PROFILES.patient!,
      DEFAULT_AUTOBOOK_CONFIG,
      initBackoff(),
      baseDeps(adapter, cap.channel),
    );
    expect(cap.sent.some((m) => m.kind === "session_expired")).toBe(true);
  });
});

describe("runMonitorOnce — auto mode + interlocks", () => {
  it("auto-books when interlocks pass (strictly better)", async () => {
    const m = { ...monitor, mode: "auto" as const };
    const adapter = fakeAdapter({
      outcome: "ok",
      dates: [{ date: "2026-08-01", facilityId: "95" }],
      earliest: { date: "2026-08-01", facilityId: "95" },
    });
    const cap = captureChannel();
    const deps = {
      ...baseDeps(adapter, cap.channel),
      getAutoBookContext: () => ({ bookingsMade: 5, bookingsToday: 0 }),
    };
    const cfg = { ...DEFAULT_AUTOBOOK_CONFIG, allowedFacilityIds: ["95"], confirmFirstN: 0 };
    const onBooked = vi.fn();
    const r = await runMonitorOnce(m, session, POLL_PROFILES.patient!, cfg, initBackoff(), {
      ...deps,
      onBooked,
    });
    expect(r.bookingResult?.status).toBe("confirmed");
    expect(onBooked).toHaveBeenCalled();
    expect(cap.sent.some((x) => x.kind === "booked")).toBe(true);
  });

  it("does NOT auto-book when facility not in allowlist; falls back to notify", async () => {
    const m = { ...monitor, mode: "auto" as const };
    const adapter = fakeAdapter({
      outcome: "ok",
      dates: [{ date: "2026-08-01", facilityId: "95" }],
      earliest: { date: "2026-08-01", facilityId: "95" },
    });
    const cap = captureChannel();
    const rescheduleSpy = vi.spyOn(adapter, "reschedule");
    const cfg = { ...DEFAULT_AUTOBOOK_CONFIG, allowedFacilityIds: [], confirmFirstN: 0 };
    const r = await runMonitorOnce(
      m,
      session,
      POLL_PROFILES.patient!,
      cfg,
      initBackoff(),
      baseDeps(adapter, cap.channel),
    );
    expect(rescheduleSpy).not.toHaveBeenCalled();
    expect(r.bookingResult?.status).toBe("interlock_blocked");
    expect(cap.sent.some((x) => x.kind === "slot_found")).toBe(true);
  });

  it("STOPS in auto mode when the TIMES endpoint hits a challenge (H1 — no swallow)", async () => {
    const m = { ...monitor, mode: "auto" as const };
    const adapter = fakeAdapter(
      {
        outcome: "ok",
        dates: [{ date: "2026-08-01", facilityId: "95" }],
        earliest: { date: "2026-08-01", facilityId: "95" },
      },
      [],
      "challenge",
    );
    const cap = captureChannel();
    const rescheduleSpy = vi.spyOn(adapter, "reschedule");
    const cfg = { ...DEFAULT_AUTOBOOK_CONFIG, allowedFacilityIds: ["95"], confirmFirstN: 0 };
    const r = await runMonitorOnce(
      m,
      session,
      POLL_PROFILES.patient!,
      cfg,
      initBackoff(),
      baseDeps(adapter, cap.channel),
    );
    expect(r.next.kind).toBe("stopped"); // did NOT fall through to ok+reschedule
    expect(rescheduleSpy).not.toHaveBeenCalled();
  });

  it("falls back to a slot_found notification when times come back empty (H1)", async () => {
    const m = { ...monitor, mode: "auto" as const };
    const adapter = fakeAdapter(
      {
        outcome: "ok",
        dates: [{ date: "2026-08-01", facilityId: "95" }],
        earliest: { date: "2026-08-01", facilityId: "95" },
      },
      [], // ok but no times (race)
      "ok",
    );
    const cap = captureChannel();
    const cfg = { ...DEFAULT_AUTOBOOK_CONFIG, allowedFacilityIds: ["95"], confirmFirstN: 0 };
    const r = await runMonitorOnce(
      m,
      session,
      POLL_PROFILES.patient!,
      cfg,
      initBackoff(),
      baseDeps(adapter, cap.channel),
    );
    expect(r.next.kind).toBe("schedule");
    expect(cap.sent.some((x) => x.kind === "slot_found")).toBe(true); // not dropped
  });
});

describe("runMonitorOnce — daily request accounting (H2)", () => {
  it("records one poll per facility request, not one per cycle", async () => {
    const m = { ...monitor, facilityIds: ["95", "98", "99"] };
    const adapter = fakeAdapter({
      outcome: "empty",
      dates: [],
      requestCount: 3, // adapter polled 3 facilities
    });
    const r = await runMonitorOnce(
      m,
      session,
      POLL_PROFILES.patient!,
      DEFAULT_AUTOBOOK_CONFIG,
      initBackoff(),
      baseDeps(adapter, captureChannel().channel),
    );
    expect(r.backoff.recentPolls).toHaveLength(3);
  });
});
