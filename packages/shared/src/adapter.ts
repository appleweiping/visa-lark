import type {
  BookingResult,
  BookingTarget,
  DayResult,
  Monitor,
  Session,
  SessionHealth,
  TimeResult,
} from "./types.js";

/**
 * VisaAdapter — the ONLY interface that touches a specific visa system.
 * Everything else (scheduler, notifier, dashboard, safety, interlocks) is
 * adapter-agnostic. See DESIGN.md §5. usvisa-info is treated as already
 * deprecating toward mytravel.state.gov, so keep this generic.
 *
 * An adapter implementation MUST:
 *  - contain ZERO evasion code (no proxies, no CAPTCHA solving, no stealth)
 *  - reuse the real session the user acquired (cookie), never automate login
 *  - fail safe: surface `challenge`/`banned`/`expired` rather than retrying through
 */
export interface VisaAdapter {
  /** Stable id, e.g. "usvisa-info". */
  readonly id: string;
  /** Human-readable name. */
  readonly displayName: string;

  /** Cheap liveness check of a session (does the schedule page still load as us?). */
  validateSession(session: Session): Promise<SessionHealth>;

  /** Poll available days for a monitor. The hot path. */
  getAvailableDays(monitor: Monitor, session: Session): Promise<DayResult>;

  /** Get bookable times for a specific date+facility (only when a day is found). */
  getTimes(
    monitor: Monitor,
    date: string,
    facilityId: string,
    session: Session,
  ): Promise<TimeResult>;

  /** Destructive: reschedule to a concrete slot. Guarded by interlocks upstream. */
  reschedule(target: BookingTarget, session: Session): Promise<BookingResult>;
}

/**
 * A transport abstraction so the SAME adapter logic runs in two data planes:
 *  - in the browser extension: fetch with the page's own cookies/fingerprint
 *  - in the local agent: a fetch carrying the user's exported cookie + UA
 * The adapter never constructs its own evasive transport — it's injected.
 */
export interface HttpTransport {
  request(input: {
    url: string;
    method?: "GET" | "POST";
    headers?: Record<string, string>;
    body?: string;
    /** Hint: this request expects JSON. */
    json?: boolean;
  }): Promise<HttpResponse>;
}

export interface HttpResponse {
  status: number;
  ok: boolean;
  text: string;
  headers: Record<string, string>;
  /** Final URL after redirects — used to detect bounce-to-login. */
  finalUrl: string;
}
