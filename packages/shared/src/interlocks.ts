import type {
  AvailableDate,
  BookingTarget,
  CurrentAppointment,
  Monitor,
} from "./types.js";

/**
 * Date / day-of-week / time-of-day filtering. Used to decide which observed
 * slots actually matter to the user (kills notification spam) and to gate
 * auto-book. Pure functions.
 */

export function dateInRange(date: string, min?: string, max?: string): boolean {
  if (min && date < min) return false;
  if (max && date > max) return false;
  return true;
}

export function dowAllowed(date: string, dowFilter: number[]): boolean {
  if (dowFilter.length === 0) return true;
  const d = new Date(`${date}T00:00:00Z`);
  return dowFilter.includes(d.getUTCDay());
}

export function timeAllowed(
  time: string,
  tod?: { startHour: number; endHour: number },
): boolean {
  if (!tod) return true;
  const hour = Number.parseInt(time.split(":")[0] ?? "0", 10);
  return hour >= tod.startHour && hour <= tod.endHour;
}

/** Does a date pass the monitor's date-range + DoW filters? */
export function dateMatchesMonitor(date: string, m: Monitor): boolean {
  return dateInRange(date, m.dateMin, m.dateMax) && dowAllowed(date, m.dowFilter);
}

/** Pick the earliest acceptable date from observations for a monitor. */
export function earliestAcceptable(
  dates: AvailableDate[],
  m: Monitor,
): AvailableDate | undefined {
  const acceptable = dates
    .filter((d) => m.facilityIds.includes(d.facilityId))
    .filter((d) => dateMatchesMonitor(d.date, m))
    .sort((a, b) => a.date.localeCompare(b.date));
  return acceptable[0];
}

/**
 * Auto-book interlocks. See DESIGN.md §6. Reschedule on usvisa-info is
 * DESTRUCTIVE — it replaces the existing appointment — so we treat it as surgery.
 * This returns a decision; the caller must not book unless `allowed`.
 */
export interface AutoBookConfig {
  /** Minimum improvement in days for the new date to be "strictly better". */
  minImprovementDays: number;
  /** Facilities the user explicitly allows auto-book to move them to. */
  allowedFacilityIds: string[];
  /** Require explicit human confirmation for the first N auto-bookings. */
  confirmFirstN: number;
  /** Max auto-bookings allowed per rolling 24h. */
  perDayCap: number;
  /** Global kill switch. */
  killSwitch: boolean;
  /** Dry-run: evaluate + log but never actually POST. */
  dryRun: boolean;
}

export const DEFAULT_AUTOBOOK_CONFIG: AutoBookConfig = {
  minImprovementDays: 7,
  allowedFacilityIds: [],
  confirmFirstN: 1,
  perDayCap: 2,
  killSwitch: false,
  dryRun: false,
};

export interface AutoBookContext {
  current: CurrentAppointment;
  /** Count of auto-bookings already made (ever) — drives confirmFirstN. */
  bookingsMade: number;
  /** Count of auto-bookings in the last 24h — drives perDayCap. */
  bookingsToday: number;
}

export type AutoBookDecision =
  | { allowed: true; dryRun: boolean }
  | { allowed: false; reason: string; requiresHumanConfirm?: boolean };

function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00Z`).getTime();
  const db = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((da - db) / 86_400_000);
}

/**
 * The interlock gate. Returns `allowed:false` unless EVERY guard passes:
 *  - kill switch off
 *  - per-day cap not exceeded
 *  - target facility is in the allowlist
 *  - new date is strictly better by at least minImprovementDays
 *  - first-N bookings require human confirm (returns requiresHumanConfirm)
 */
export function evaluateAutoBook(
  target: BookingTarget,
  cfg: AutoBookConfig,
  ctx: AutoBookContext,
): AutoBookDecision {
  if (cfg.killSwitch) {
    return { allowed: false, reason: "Auto-book kill switch is engaged." };
  }
  if (ctx.bookingsToday >= cfg.perDayCap) {
    return {
      allowed: false,
      reason: `Per-day auto-book cap (${cfg.perDayCap}) reached.`,
    };
  }
  if (!cfg.allowedFacilityIds.includes(target.facilityId)) {
    return {
      allowed: false,
      reason: `Facility ${target.facilityId} is not in your auto-book allowlist. Refusing to move you to a consulate you didn't approve.`,
    };
  }
  // Strictly-better-only. If there's a current appointment, the new date must be
  // earlier by at least minImprovementDays. If there's NO current appointment,
  // auto-book is refused — booking a first appointment unattended is too risky.
  if (!ctx.current.date) {
    return {
      allowed: false,
      reason: "No existing appointment on record. Refusing to auto-book your first appointment unattended — use one-tap confirm instead.",
    };
  }
  const improvement = daysBetween(ctx.current.date, target.date);
  if (improvement < cfg.minImprovementDays) {
    return {
      allowed: false,
      reason: `New date ${target.date} is only ${improvement} day(s) earlier than your current ${ctx.current.date}; need ≥${cfg.minImprovementDays}. Refusing — won't risk your slot for a marginal gain.`,
    };
  }
  // First-N safety: even in auto mode, require a human to confirm early bookings.
  if (ctx.bookingsMade < cfg.confirmFirstN) {
    return {
      allowed: false,
      reason: `First ${cfg.confirmFirstN} booking(s) require human confirmation even in auto mode.`,
      requiresHumanConfirm: true,
    };
  }
  return { allowed: true, dryRun: cfg.dryRun };
}
