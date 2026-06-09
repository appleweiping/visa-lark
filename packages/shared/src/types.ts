import { z } from "zod";

/**
 * Core domain types for VisaLark.
 * These describe the visa appointment domain in an adapter-agnostic way so the
 * scheduler / notifier / dashboard never depend on usvisa-info specifics.
 */

/** Booking behaviour for a monitor. See DESIGN.md §4. */
export const BookingMode = z.enum(["notify", "confirm", "auto"]);
export type BookingMode = z.infer<typeof BookingMode>;

/** Visa categories we surface in the UI (extensible). */
export const VisaType = z.enum([
  "B1/B2",
  "F1",
  "F2",
  "J1",
  "J2",
  "H1B",
  "H4",
  "L1",
  "O1",
  "M1",
  "C1/D",
  "K1",
  "OTHER",
]);
export type VisaType = z.infer<typeof VisaType>;

/** Health of an acquired session. Drives fail-safe behaviour (DESIGN.md §3.4). */
export const SessionHealth = z.enum([
  "healthy",
  "expired", // cookie no longer valid → notify human to re-auth
  "challenge", // Cloudflare/Turnstile/reCAPTCHA wall → STOP, never retry-through
  "rate_limited", // 1015 / 429 → backoff + cooldown
  "banned", // account flagged/suspended → STOP, loud alert
  "unknown",
]);
export type SessionHealth = z.infer<typeof SessionHealth>;

/** Result of a single poll, used for analytics + scheduler backoff state. */
export const PollOutcome = z.enum([
  "ok", // got a valid response (may be empty)
  "empty", // no dates available
  "rate_limited",
  "challenge",
  "banned",
  "session_expired",
  "network_error",
]);
export type PollOutcome = z.infer<typeof PollOutcome>;

/**
 * A session = the credential material needed to talk to the visa portal.
 * Cookie-only by default (DESIGN.md §3.3). We NEVER require a stored password.
 */
export const Session = z.object({
  /**
   * The portal's session cookie (e.g. `_yatri_session`).
   * - Extension data plane: this is NEVER stored — the browser's own cookie jar
   *   holds it and `credentials:"include"` sends it; we pass a placeholder.
   * - Agent data plane: the user pastes it into a local config file, protected
   *   by filesystem permissions (NOT app-level encryption — see DESIGN.md §3.3).
   */
  cookie: z.string().min(1),
  /** Rails CSRF token scraped from the schedule page, needed for POST/reschedule. */
  csrfToken: z.string().optional(),
  /** Embassy/consulate locale code, e.g. "en-ca", "en-cn". */
  embassyCode: z.string().min(1),
  /** The user's schedule id (path segment in usvisa-info URLs). */
  scheduleId: z.string().min(1),
  /** When this session material was acquired (epoch ms). */
  acquiredAt: z.number().int(),
  /** Optional User-Agent of the real browser the cookie came from (fingerprint match). */
  userAgent: z.string().optional(),
});
export type Session = z.infer<typeof Session>;

/** A consulate/facility the user can be seen at. */
export const Facility = z.object({
  id: z.string(), // facility_id used in usvisa-info URLs
  name: z.string(),
  city: z.string(),
  country: z.string(),
  embassyCode: z.string(),
});
export type Facility = z.infer<typeof Facility>;

/** Time-of-day window filter (24h, inclusive). */
export const TimeOfDayFilter = z.object({
  startHour: z.number().int().min(0).max(23).default(0),
  endHour: z.number().int().min(0).max(23).default(23),
});
export type TimeOfDayFilter = z.infer<typeof TimeOfDayFilter>;

/**
 * A monitor = one watch configuration. The user may run several (e.g. one per
 * consulate, or one multi-consulate "earliest across my acceptable cities").
 */
export const Monitor = z.object({
  id: z.string(),
  label: z.string().default(""),
  /** Watch across multiple facilities — "earliest across my acceptable cities". */
  facilityIds: z.array(z.string()).min(1),
  visaType: VisaType.default("B1/B2"),
  /** Only care about dates within [dateMin, dateMax] (ISO yyyy-mm-dd). */
  dateMin: z.string().optional(),
  dateMax: z.string().optional(),
  /** Days of week to accept: 0=Sun .. 6=Sat. Empty = all. */
  dowFilter: z.array(z.number().int().min(0).max(6)).default([]),
  todFilter: TimeOfDayFilter.optional(),
  /** Watch the expedite/emergency calendar (`appointments[expedite]=true`). */
  expedite: z.boolean().default(false),
  mode: BookingMode.default("notify"),
  /** Named polling cadence profile (see safety.ts). */
  pollProfile: z.string().default("balanced"),
  enabled: z.boolean().default(true),
});
export type Monitor = z.infer<typeof Monitor>;

/** One available date returned by the adapter (adapter-agnostic). */
export const AvailableDate = z.object({
  date: z.string(), // yyyy-mm-dd
  facilityId: z.string(),
});
export type AvailableDate = z.infer<typeof AvailableDate>;

export const DayResult = z.object({
  outcome: PollOutcome,
  dates: z.array(AvailableDate).default([]),
  /** earliest acceptable date after filters, if any. */
  earliest: AvailableDate.optional(),
  /** Number of HTTP requests this poll cycle issued (for the daily cap, H2). */
  requestCount: z.number().int().default(1),
  raw: z.unknown().optional(),
});
export type DayResult = z.infer<typeof DayResult>;

export const TimeResult = z.object({
  outcome: PollOutcome,
  date: z.string(),
  facilityId: z.string(),
  times: z.array(z.string()).default([]), // "HH:MM"
});
export type TimeResult = z.infer<typeof TimeResult>;

/** A concrete slot the user (or auto-book) wants to grab. */
export const BookingTarget = z.object({
  facilityId: z.string(),
  date: z.string(),
  time: z.string(),
  monitorId: z.string(),
});
export type BookingTarget = z.infer<typeof BookingTarget>;

export const BookingResult = z.object({
  status: z.enum([
    "confirmed",
    "failed",
    "slot_gone",
    "recaptcha_required",
    "interlock_blocked",
    "dry_run",
  ]),
  message: z.string().optional(),
  bookedDate: z.string().optional(),
  bookedTime: z.string().optional(),
});
export type BookingResult = z.infer<typeof BookingResult>;

/** Current appointment context — required by auto-book interlocks (§6). */
export const CurrentAppointment = z.object({
  date: z.string().optional(), // yyyy-mm-dd, undefined if none yet
  facilityId: z.string().optional(),
});
export type CurrentAppointment = z.infer<typeof CurrentAppointment>;
