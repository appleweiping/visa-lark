/**
 * usvisa-info (CGI Federal) endpoint construction + response classification.
 * Pure, dependency-free, fully testable without network.
 *
 * Endpoints (from research, DESIGN.md §1):
 *   login    /{embassy}/niv/users/sign_in
 *   schedule /{embassy}/niv/schedule/{scheduleId}/appointment
 *   days     /{embassy}/niv/schedule/{scheduleId}/appointment/days/{facilityId}.json?appointments[expedite]=...
 *   times    /{embassy}/niv/schedule/{scheduleId}/appointment/times/{facilityId}.json?date=...&appointments[expedite]=...
 *   signout  /{embassy}/niv/users/sign_out
 */

export const USVISA_BASE = "https://ais.usvisa-info.com";

export function scheduleUrl(embassy: string, scheduleId: string): string {
  return `${USVISA_BASE}/${embassy}/niv/schedule/${scheduleId}/appointment`;
}

export function daysUrl(
  embassy: string,
  scheduleId: string,
  facilityId: string,
  expedite: boolean,
): string {
  const exp = expedite ? "true" : "false";
  return `${USVISA_BASE}/${embassy}/niv/schedule/${scheduleId}/appointment/days/${facilityId}.json?appointments%5Bexpedite%5D=${exp}`;
}

export function timesUrl(
  embassy: string,
  scheduleId: string,
  facilityId: string,
  date: string,
  expedite: boolean,
): string {
  const exp = expedite ? "true" : "false";
  return `${USVISA_BASE}/${embassy}/niv/schedule/${scheduleId}/appointment/times/${facilityId}.json?date=${encodeURIComponent(
    date,
  )}&appointments%5Bexpedite%5D=${exp}`;
}

export function signInUrl(embassy: string): string {
  return `${USVISA_BASE}/${embassy}/niv/users/sign_in`;
}

/**
 * Classify an HTTP response into one of our outcomes. This is the FAIL-SAFE core:
 * any sign of a challenge / ban / re-login bounce is surfaced honestly rather than
 * retried-through. (DESIGN.md §3.4)
 */
export interface ClassifyInput {
  status: number;
  finalUrl: string;
  text: string;
  headers: Record<string, string>;
}

export type ClassifiedOutcome =
  | "ok"
  | "rate_limited"
  | "challenge"
  | "banned"
  | "session_expired"
  | "network_error";

export function classifyResponse(r: ClassifyInput): ClassifiedOutcome {
  // Cloudflare rate-limit (Error 1015) / generic throttle.
  if (r.status === 429) return "rate_limited";
  if (r.status === 1015 || /error 1015|you are being rate limited/i.test(r.text)) {
    return "rate_limited";
  }

  // Cloudflare / Turnstile / reCAPTCHA challenge wall. STOP — never solve.
  const cfRay = r.headers["cf-mitigated"] || r.headers["cf-chl-bypass"];
  if (
    r.status === 403 ||
    r.status === 503 ||
    cfRay ||
    /just a moment|cf-challenge|turnstile|cdn-cgi\/challenge|g-recaptcha|recaptcha\/api/i.test(
      r.text,
    )
  ) {
    return "challenge";
  }

  // Bounced back to the sign-in page → session expired (cookie no longer valid).
  if (/\/users\/sign_in/.test(r.finalUrl) || r.status === 401) {
    return "session_expired";
  }

  // Account suspended / access restricted messaging.
  if (/account.*(suspend|restrict|block)|access.*restrict|prohibited conduct/i.test(r.text)) {
    return "banned";
  }

  if (r.status >= 200 && r.status < 300) return "ok";
  if (r.status >= 500) return "network_error";
  return "network_error";
}

/**
 * Parse the /days/*.json payload. usvisa-info returns an array like
 * `[{"date":"2026-07-01","business_day":true}, ...]`. We tolerate shape drift.
 */
export function parseDays(text: string): string[] {
  try {
    const data = JSON.parse(text);
    if (!Array.isArray(data)) return [];
    return data
      .map((d) => (typeof d === "string" ? d : d?.date))
      .filter((d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d));
  } catch {
    return [];
  }
}

/**
 * Parse the /times/*.json payload, typically
 * `{"available_times":["09:00","09:30"], "business_times":[...]}`.
 */
export function parseTimes(text: string): string[] {
  try {
    const data = JSON.parse(text);
    const arr: unknown =
      data?.available_times ?? data?.business_times ?? (Array.isArray(data) ? data : []);
    if (!Array.isArray(arr)) return [];
    return arr.filter((t): t is string => typeof t === "string" && /^\d{1,2}:\d{2}$/.test(t));
  } catch {
    return [];
  }
}

/** Extract the Rails CSRF token from a schedule page's HTML. */
export function parseCsrfToken(html: string): string | undefined {
  const meta = html.match(
    /<meta[^>]+name=["']csrf-token["'][^>]+content=["']([^"']+)["']/i,
  );
  if (meta?.[1]) return meta[1];
  const input = html.match(
    /<input[^>]+name=["']authenticity_token["'][^>]+value=["']([^"']+)["']/i,
  );
  return input?.[1];
}
