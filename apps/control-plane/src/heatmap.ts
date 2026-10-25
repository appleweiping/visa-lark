/**
 * Heatmap and "best hour to check" aggregation (see DESIGN.md §8). Pure and
 * dependency-free so it is easy to unit-test and could move into the shared
 * package later.
 *
 * Input: a flat list of slot observations. Each row = "at epoch `observedAt`
 * we saw appointment `date` available at `facilityId`". The data plane writes
 * these; the control plane only aggregates them. NO visa network access here.
 *
 * Two distinct signals are derived:
 *   - `observations`: raw density (how often we saw *anything* in a bucket).
 *   - `releases`: the first time a given (facilityId, appointment-date) pair is
 *     ever seen. A release ≈ a slot opening up. `bestHours` ranks
 *     hour-of-day by release count.
 *
 * Bucketing is done in the user's local wall-clock via `tzOffsetMinutes`
 * (default 0 = UTC) so the result is deterministic and timezone-correct.
 */

export interface ObservationRecord {
  monitorId: string;
  facilityId: string;
  /** The available appointment date, yyyy-mm-dd. */
  date: string;
  /** Epoch ms when this availability was observed. */
  observedAt: number;
}

export interface HeatmapCell {
  /** Day of week, 0=Sun .. 6=Sat (local). */
  dow: number;
  /** Hour of day, 0..23 (local). */
  hour: number;
  observations: number;
  releases: number;
}

export interface HourBucket {
  hour: number;
  observations: number;
  releases: number;
}

export interface DayBucket {
  dow: number;
  observations: number;
  releases: number;
}

export interface BestHour {
  hour: number;
  releases: number;
  observations: number;
  /** Fraction of all releases that landed in this hour (0..1). */
  share: number;
}

export interface HeatmapResult {
  /** Which facility this was computed for, or null for "all facilities". */
  facilityId: string | null;
  /** Full 7×24 grid (always 168 cells, zero-filled) for a calendar heatmap. */
  cells: HeatmapCell[];
  /** 24 hour-of-day buckets (zero-filled). */
  hourly: HourBucket[];
  /** 7 day-of-week buckets (zero-filled). */
  daily: DayBucket[];
  /** Hours ranked by release count, descending. Empty if no releases. */
  bestHours: BestHour[];
  /** The single best hour-of-day to check, or null if there is no signal. */
  bestHour: number | null;
  totalObservations: number;
  totalReleases: number;
  /** Distinct (facility,date) slots ever seen — the breadth of the dataset. */
  distinctSlots: number;
  tzOffsetMinutes: number;
}

export interface HeatmapOptions {
  /** Restrict to a single facility. Undefined/null = aggregate across all. */
  facilityId?: string | null;
  /**
   * Minutes to add to UTC to reach the user's local wall-clock used for
   * bucketing (e.g. +480 for Beijing, -300 for US Eastern). Default 0 (UTC).
   */
  tzOffsetMinutes?: number;
}

/** Local [dow, hour] for an epoch ms given a fixed UTC offset (minutes). */
function localDowHour(observedAt: number, tzOffsetMinutes: number): [number, number] {
  // Shift the instant by the offset, then read UTC fields (avoids host TZ).
  const shifted = new Date(observedAt + tzOffsetMinutes * 60_000);
  return [shifted.getUTCDay(), shifted.getUTCHours()];
}

/**
 * Aggregate observations into heatmap buckets + a "best time to check" ranking.
 * Pure: same input always yields the same output. Never throws on empty input.
 */
export function computeHeatmap(
  observations: ObservationRecord[],
  options: HeatmapOptions = {},
): HeatmapResult {
  const facilityId = options.facilityId ?? null;
  const tzOffsetMinutes = options.tzOffsetMinutes ?? 0;

  const rows = facilityId
    ? observations.filter((o) => o.facilityId === facilityId)
    : observations;

  // Zero-filled 7×24 grid.
  const grid: HeatmapCell[][] = Array.from({ length: 7 }, (_, dow) =>
    Array.from({ length: 24 }, (_, hour) => ({ dow, hour, observations: 0, releases: 0 })),
  );

  // Track the earliest observedAt per (facility,date) → that instant is the
  // "release" event. Sorting first guarantees first-seen detection is stable.
  const firstSeen = new Map<string, number>();
  const sorted = [...rows].sort((a, b) => a.observedAt - b.observedAt);

  let totalObservations = 0;
  let totalReleases = 0;

  for (const row of sorted) {
    const [dow, hour] = localDowHour(row.observedAt, tzOffsetMinutes);
    const cell = grid[dow]![hour]!;
    cell.observations += 1;
    totalObservations += 1;

    const key = `${row.facilityId}\u0000${row.date}`;
    if (!firstSeen.has(key)) {
      firstSeen.set(key, row.observedAt);
      cell.releases += 1;
      totalReleases += 1;
    }
  }

  const cells = grid.flat();

  const hourly: HourBucket[] = Array.from({ length: 24 }, (_, hour) => {
    let observationsSum = 0;
    let releasesSum = 0;
    for (let dow = 0; dow < 7; dow++) {
      observationsSum += grid[dow]![hour]!.observations;
      releasesSum += grid[dow]![hour]!.releases;
    }
    return { hour, observations: observationsSum, releases: releasesSum };
  });

  const daily: DayBucket[] = Array.from({ length: 7 }, (_, dow) => {
    let observationsSum = 0;
    let releasesSum = 0;
    for (let hour = 0; hour < 24; hour++) {
      observationsSum += grid[dow]![hour]!.observations;
      releasesSum += grid[dow]![hour]!.releases;
    }
    return { dow, observations: observationsSum, releases: releasesSum };
  });

  // Rank hours by releases (primary) then observations (tie-break), then by
  // earliest hour for full determinism. Only include hours with ≥1 release.
  const bestHours: BestHour[] = hourly
    .filter((h) => h.releases > 0)
    .map((h) => ({
      hour: h.hour,
      releases: h.releases,
      observations: h.observations,
      share: totalReleases > 0 ? h.releases / totalReleases : 0,
    }))
    .sort(
      (a, b) =>
        b.releases - a.releases || b.observations - a.observations || a.hour - b.hour,
    );

  return {
    facilityId,
    cells,
    hourly,
    daily,
    bestHours,
    bestHour: bestHours.length > 0 ? bestHours[0]!.hour : null,
    totalObservations,
    totalReleases,
    distinctSlots: firstSeen.size,
    tzOffsetMinutes,
  };
}
