import { describe, it, expect } from "vitest";
import { computeHeatmap, type ObservationRecord } from "../src/heatmap.js";

/** Build an epoch-ms instant in UTC from explicit fields (deterministic). */
function utc(y: number, mo: number, d: number, h: number, mi = 0): number {
  return Date.UTC(y, mo - 1, d, h, mi, 0, 0);
}

describe("computeHeatmap", () => {
  it("returns a fully zero-filled 7x24 grid for empty input", () => {
    const r = computeHeatmap([]);
    expect(r.cells).toHaveLength(168);
    expect(r.hourly).toHaveLength(24);
    expect(r.daily).toHaveLength(7);
    expect(r.totalObservations).toBe(0);
    expect(r.totalReleases).toBe(0);
    expect(r.distinctSlots).toBe(0);
    expect(r.bestHour).toBeNull();
    expect(r.bestHours).toEqual([]);
    expect(r.cells.every((c) => c.observations === 0 && c.releases === 0)).toBe(true);
  });

  it("counts every observation but only first-seen (facility,date) as a release", () => {
    // Same slot (95, 2026-07-01) seen 3 times → 3 observations, 1 release.
    const obs: ObservationRecord[] = [
      { monitorId: "m1", facilityId: "95", date: "2026-07-01", observedAt: utc(2026, 6, 1, 9) },
      { monitorId: "m1", facilityId: "95", date: "2026-07-01", observedAt: utc(2026, 6, 1, 10) },
      { monitorId: "m1", facilityId: "95", date: "2026-07-01", observedAt: utc(2026, 6, 1, 11) },
    ];
    const r = computeHeatmap(obs);
    expect(r.totalObservations).toBe(3);
    expect(r.totalReleases).toBe(1);
    expect(r.distinctSlots).toBe(1);
    // The release is attributed to the EARLIEST sighting (09:00 UTC).
    expect(r.bestHour).toBe(9);
  });

  it("attributes a release to the earliest sighting regardless of input order", () => {
    const obs: ObservationRecord[] = [
      { monitorId: "m1", facilityId: "98", date: "2026-08-10", observedAt: utc(2026, 6, 2, 15) },
      { monitorId: "m1", facilityId: "98", date: "2026-08-10", observedAt: utc(2026, 6, 2, 3) },
      { monitorId: "m1", facilityId: "98", date: "2026-08-10", observedAt: utc(2026, 6, 2, 9) },
    ];
    const r = computeHeatmap(obs);
    expect(r.totalReleases).toBe(1);
    expect(r.bestHour).toBe(3); // earliest = 03:00 UTC
  });

  it("ranks bestHours by release count and computes share", () => {
    const obs: ObservationRecord[] = [
      // two distinct slots first-seen at hour 14
      { monitorId: "m", facilityId: "95", date: "2026-07-01", observedAt: utc(2026, 6, 1, 14) },
      { monitorId: "m", facilityId: "95", date: "2026-07-02", observedAt: utc(2026, 6, 1, 14, 30) },
      // one distinct slot first-seen at hour 9
      { monitorId: "m", facilityId: "95", date: "2026-07-03", observedAt: utc(2026, 6, 1, 9) },
    ];
    const r = computeHeatmap(obs);
    expect(r.totalReleases).toBe(3);
    expect(r.bestHour).toBe(14);
    expect(r.bestHours[0]).toMatchObject({ hour: 14, releases: 2 });
    expect(r.bestHours[0]!.share).toBeCloseTo(2 / 3, 5);
    expect(r.bestHours[1]).toMatchObject({ hour: 9, releases: 1 });
  });

  it("filters by facilityId when requested", () => {
    const obs: ObservationRecord[] = [
      { monitorId: "m", facilityId: "95", date: "2026-07-01", observedAt: utc(2026, 6, 1, 9) },
      { monitorId: "m", facilityId: "98", date: "2026-07-01", observedAt: utc(2026, 6, 1, 10) },
    ];
    const all = computeHeatmap(obs);
    expect(all.totalReleases).toBe(2); // (95,07-01) and (98,07-01) are distinct
    const beijing = computeHeatmap(obs, { facilityId: "95" });
    expect(beijing.facilityId).toBe("95");
    expect(beijing.totalObservations).toBe(1);
    expect(beijing.totalReleases).toBe(1);
    expect(beijing.bestHour).toBe(9);
  });

  it("buckets by local wall-clock using tzOffsetMinutes", () => {
    // 23:30 UTC on a Wednesday → +480min (Beijing) = 07:30 next day (Thursday).
    const obs: ObservationRecord[] = [
      { monitorId: "m", facilityId: "95", date: "2026-07-01", observedAt: utc(2026, 6, 3, 23, 30) },
    ];
    const utcR = computeHeatmap(obs, { tzOffsetMinutes: 0 });
    expect(utcR.bestHour).toBe(23);
    const cnR = computeHeatmap(obs, { tzOffsetMinutes: 480 });
    expect(cnR.bestHour).toBe(7);
    // day-of-week should have rolled forward by one in CN local time
    const utcDow = utcR.cells.find((c) => c.releases > 0)!.dow;
    const cnDow = cnR.cells.find((c) => c.releases > 0)!.dow;
    expect(cnDow).toBe((utcDow + 1) % 7);
  });

  it("is pure: repeated calls on the same input give identical output", () => {
    const obs: ObservationRecord[] = [
      { monitorId: "m", facilityId: "95", date: "2026-07-01", observedAt: utc(2026, 6, 1, 9) },
      { monitorId: "m", facilityId: "96", date: "2026-07-05", observedAt: utc(2026, 6, 1, 9) },
    ];
    expect(computeHeatmap(obs)).toEqual(computeHeatmap(obs));
  });
});
