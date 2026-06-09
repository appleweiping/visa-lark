/**
 * Mock data for the live demo. PURE & deterministic (seeded) — the demo makes
 * ZERO network requests and never touches the visa site. This is UX showcase only.
 *
 * Facility reference data is inlined locally (src/lib/facility-seeds.ts) so the
 * web app is self-contained and deploys as a standalone Next.js project.
 */
import { FACILITY_SEEDS, type FacilitySeed } from "@/lib/facility-seeds";

export type AvailabilityStatus = "plenty" | "scarce" | "none";

export interface ConsulateBoardRow {
  facility: FacilitySeed;
  status: AvailabilityStatus;
  earliestDate: string | null;
  openSlots: number;
  /** Minutes since last update (mock). */
  updatedMinutesAgo: number;
}

/** Tiny seeded PRNG (mulberry32) so the demo is stable across renders/SSR. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** A fixed reference "now" so SSR and client agree (no hydration mismatch). */
export const DEMO_NOW = new Date("2026-06-09T01:00:00Z");

/** Build a deterministic availability board across the seeded consulates. */
export function buildBoard(): ConsulateBoardRow[] {
  const rand = mulberry32(20260609);
  // Show a representative subset: China + HK + Tokyo + Seoul + Singapore.
  const picks = ["95", "96", "97", "98", "94", "120", "122", "123"];
  const facilities = picks
    .map((id) => FACILITY_SEEDS.find((f) => f.id === id))
    .filter((f): f is FacilitySeed => Boolean(f));

  return facilities.map((facility) => {
    const roll = rand();
    let status: AvailabilityStatus;
    let openSlots: number;
    let earliestOffset: number | null;
    if (roll > 0.62) {
      status = "plenty";
      openSlots = 6 + Math.floor(rand() * 30);
      earliestOffset = 3 + Math.floor(rand() * 14);
    } else if (roll > 0.3) {
      status = "scarce";
      openSlots = 1 + Math.floor(rand() * 3);
      earliestOffset = 20 + Math.floor(rand() * 60);
    } else {
      status = "none";
      openSlots = 0;
      earliestOffset = null;
    }
    return {
      facility,
      status,
      openSlots,
      earliestDate: earliestOffset === null ? null : addDays(DEMO_NOW, earliestOffset),
      updatedMinutesAgo: 1 + Math.floor(rand() * 12),
    };
  });
}

/**
 * Build a deterministic 7×24 release heatmap (counts) with a realistic shape:
 * slots tend to release on weekday mornings (the "best time to check" story).
 * Returns counts[dow][hour].
 */
export function buildHeatmap(): { counts: number[][]; max: number; bestHour: number } {
  const rand = mulberry32(424242);
  const counts: number[][] = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  let max = 0;
  const hourTotals = new Array(24).fill(0);

  for (let dow = 0; dow < 7; dow++) {
    const weekday = dow >= 1 && dow <= 5;
    for (let hour = 0; hour < 24; hour++) {
      // Morning weekday peak around 9-11, small afternoon bump, quiet at night.
      const morning = Math.exp(-((hour - 10) ** 2) / 6) * (weekday ? 9 : 3);
      const afternoon = Math.exp(-((hour - 15) ** 2) / 10) * (weekday ? 3 : 2);
      const base = morning + afternoon;
      const noise = rand() * 1.6;
      const v = Math.max(0, Math.round(base + noise - 0.5));
      counts[dow]![hour] = v;
      hourTotals[hour] += v;
      if (v > max) max = v;
    }
  }

  let bestHour = 0;
  for (let h = 1; h < 24; h++) {
    if (hourTotals[h] > hourTotals[bestHour]) bestHour = h;
  }
  return { counts, max, bestHour };
}

export const DOW_LABELS: Record<string, string[]> = {
  zh: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};
