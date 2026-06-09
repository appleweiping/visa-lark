import type {
  BookingResult,
  BookingTarget,
  DayResult,
  HttpResponse,
  HttpTransport,
  Monitor,
  Session,
  SessionHealth,
  TimeResult,
  VisaAdapter,
  AvailableDate,
} from "@visa-lark/shared";
import {
  classifyResponse,
  daysUrl,
  parseCsrfToken,
  parseDays,
  parseTimes,
  scheduleUrl,
  timesUrl,
  type ClassifiedOutcome,
} from "./endpoints.js";

/**
 * usvisa-info adapter. Contains ZERO evasion code (DESIGN.md §3.2):
 *  - no proxy logic, no CAPTCHA solving, no TLS impersonation, no stealth
 *  - it reuses an injected transport that carries the user's REAL session
 *    (browser context in the extension, or the user's exported cookie in the agent)
 *  - it fails safe: classifies challenge/ban/expiry and surfaces them up
 *
 * The transport is injected so the SAME logic runs in both data planes.
 */
export class UsVisaInfoAdapter implements VisaAdapter {
  readonly id = "usvisa-info";
  readonly displayName = "US Visa Info (CGI Federal)";

  constructor(private readonly transport: HttpTransport) {}

  private headers(session: Session, json: boolean): Record<string, string> {
    const h: Record<string, string> = {
      // Identify as an XHR like the real calendar UI does.
      "X-Requested-With": "XMLHttpRequest",
      Referer: scheduleUrl(session.embassyCode, session.scheduleId),
    };
    if (json) h["Accept"] = "application/json, text/javascript, */*; q=0.01";
    // Match the real browser's UA when the cookie came from the agent path.
    if (session.userAgent) h["User-Agent"] = session.userAgent;
    return h;
  }

  private outcomeToHealth(o: ClassifiedOutcome): SessionHealth {
    switch (o) {
      case "ok":
        return "healthy";
      case "rate_limited":
        return "rate_limited";
      case "challenge":
        return "challenge";
      case "banned":
        return "banned";
      case "session_expired":
        return "expired";
      default:
        return "unknown";
    }
  }

  async validateSession(session: Session): Promise<SessionHealth> {
    const res = await this.transport.request({
      url: scheduleUrl(session.embassyCode, session.scheduleId),
      method: "GET",
      headers: this.headers(session, false),
    });
    const outcome = classifyResponse(this.toClassify(res));
    return this.outcomeToHealth(outcome);
  }

  async getAvailableDays(monitor: Monitor, session: Session): Promise<DayResult> {
    const all: AvailableDate[] = [];
    // Multi-consulate watch: "earliest across my acceptable cities" (DESIGN.md §9).
    // Poll each facility sequentially — never burst — caller controls cadence.
    let requestCount = 0;
    for (const facilityId of monitor.facilityIds) {
      const res = await this.transport.request({
        url: daysUrl(session.embassyCode, session.scheduleId, facilityId, monitor.expedite),
        method: "GET",
        headers: this.headers(session, true),
        json: true,
      });
      requestCount += 1;
      const outcome = classifyResponse(this.toClassify(res));
      // FAIL-SAFE: on any non-ok outcome, stop immediately and report it.
      // We report the dates found so far so a real slot from an earlier facility
      // isn't silently lost when a later facility hits a wall (L8).
      if (outcome !== "ok") {
        const earliestSoFar = all.length
          ? [...all].sort((a, b) => a.date.localeCompare(b.date))[0]
          : undefined;
        return { outcome, dates: all, earliest: earliestSoFar, requestCount };
      }
      for (const date of parseDays(res.text)) {
        all.push({ date, facilityId });
      }
    }
    if (all.length === 0) return { outcome: "empty", dates: [], requestCount };
    const earliest = [...all].sort((a, b) => a.date.localeCompare(b.date))[0];
    return { outcome: "ok", dates: all, earliest, requestCount };
  }

  async getTimes(
    _monitor: Monitor,
    date: string,
    facilityId: string,
    session: Session,
  ): Promise<TimeResult> {
    const res = await this.transport.request({
      url: timesUrl(
        session.embassyCode,
        session.scheduleId,
        facilityId,
        date,
        _monitor.expedite,
      ),
      method: "GET",
      headers: this.headers(session, true),
      json: true,
    });
    const outcome = classifyResponse(this.toClassify(res));
    if (outcome !== "ok") return { outcome, date, facilityId, times: [] };
    return { outcome: "ok", date, facilityId, times: parseTimes(res.text) };
  }

  /**
   * Destructive reschedule. Guarded by interlocks BEFORE this is ever called.
   * Re-reads the CSRF token from a fresh schedule page (Rails tokens rotate).
   */
  async reschedule(target: BookingTarget, session: Session): Promise<BookingResult> {
    // 1) Load schedule page to obtain a fresh authenticity_token.
    const pageRes = await this.transport.request({
      url: scheduleUrl(session.embassyCode, session.scheduleId),
      method: "GET",
      headers: this.headers(session, false),
    });
    const pageOutcome = classifyResponse(this.toClassify(pageRes));
    if (pageOutcome === "challenge") {
      return { status: "recaptcha_required", message: "A security challenge blocked booking. Please complete it in your browser." };
    }
    if (pageOutcome !== "ok") {
      return { status: "failed", message: `Could not load schedule page (${pageOutcome}).` };
    }
    const csrf = parseCsrfToken(pageRes.text) ?? session.csrfToken;
    if (!csrf) {
      return { status: "failed", message: "Missing CSRF token; cannot submit." };
    }

    // 2) POST the reschedule. Rails-style nested params.
    const body = new URLSearchParams({
      authenticity_token: csrf,
      "appointments[consulate_appointment][facility_id]": target.facilityId,
      "appointments[consulate_appointment][date]": target.date,
      "appointments[consulate_appointment][time]": target.time,
      utf8: "✓",
    }).toString();

    const res = await this.transport.request({
      url: scheduleUrl(session.embassyCode, session.scheduleId),
      method: "POST",
      headers: {
        ...this.headers(session, false),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const outcome = classifyResponse(this.toClassify(res));
    if (outcome === "challenge") {
      return { status: "recaptcha_required", message: "reCAPTCHA required to confirm." };
    }
    if (outcome !== "ok") {
      return { status: "failed", message: `Booking failed (${outcome}).` };
    }
    // Heuristic success/slot-gone detection from the response body.
    if (/successfully scheduled|appointment.*confirmed|已成功/i.test(res.text)) {
      return {
        status: "confirmed",
        bookedDate: target.date,
        bookedTime: target.time,
        message: "Appointment rescheduled.",
      };
    }
    if (/no longer available|not available|已被预约|slot.*taken/i.test(res.text)) {
      return { status: "slot_gone", message: "Slot was taken before we could book it." };
    }
    // Ambiguous — report as failed so the human verifies rather than assuming success.
    return {
      status: "failed",
      message: "Booking response was ambiguous; please verify your appointment manually.",
    };
  }

  private toClassify(res: HttpResponse) {
    return {
      status: res.status,
      finalUrl: res.finalUrl,
      text: res.text,
      headers: res.headers,
    };
  }
}
