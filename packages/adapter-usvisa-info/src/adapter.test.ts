import { describe, it, expect } from "vitest";
import {
  classifyResponse,
  parseDays,
  parseTimes,
  parseCsrfToken,
  daysUrl,
  timesUrl,
} from "../src/endpoints.js";
import { UsVisaInfoAdapter } from "../src/adapter.js";
import type { HttpResponse, HttpTransport, Monitor, Session } from "@visa-lark/shared";

const session: Session = {
  cookie: "_yatri_session=abc",
  embassyCode: "en-cn",
  scheduleId: "12345",
  acquiredAt: Date.now(),
  csrfToken: "tok",
};

const monitor: Monitor = {
  id: "m1",
  label: "",
  facilityIds: ["95", "98"],
  visaType: "B1/B2",
  dowFilter: [],
  expedite: false,
  mode: "notify",
  pollProfile: "patient",
  enabled: true,
};

function mkRes(over: Partial<HttpResponse>): HttpResponse {
  return {
    status: 200,
    ok: true,
    text: "[]",
    headers: {},
    finalUrl: "https://ais.usvisa-info.com/en-cn/niv/schedule/12345/appointment/days/95.json",
    ...over,
  };
}

/** A scripted transport: returns queued responses in order. */
class MockTransport implements HttpTransport {
  constructor(private queue: HttpResponse[]) {}
  calls: string[] = [];
  async request(input: { url: string }): Promise<HttpResponse> {
    this.calls.push(input.url);
    return this.queue.shift() ?? mkRes({ text: "[]" });
  }
}

describe("URL construction", () => {
  it("builds days url with expedite and url-encoded brackets", () => {
    expect(daysUrl("en-cn", "12345", "95", false)).toContain(
      "/days/95.json?appointments%5Bexpedite%5D=false",
    );
    expect(daysUrl("en-cn", "12345", "95", true)).toContain("expedite%5D=true");
  });
  it("builds times url with date", () => {
    expect(timesUrl("en-cn", "12345", "95", "2026-07-01", false)).toContain(
      "/times/95.json?date=2026-07-01",
    );
  });
});

describe("classifyResponse fail-safe", () => {
  it("detects Cloudflare 1015 rate limit", () => {
    expect(classifyResponse({ status: 200, finalUrl: "x", text: "Error 1015: you are being rate limited", headers: {} })).toBe("rate_limited");
    expect(classifyResponse({ status: 429, finalUrl: "x", text: "", headers: {} })).toBe("rate_limited");
  });
  it("detects challenge walls (Turnstile/recaptcha/403/503)", () => {
    expect(classifyResponse({ status: 403, finalUrl: "x", text: "", headers: {} })).toBe("challenge");
    expect(classifyResponse({ status: 503, finalUrl: "x", text: "Just a moment...", headers: {} })).toBe("challenge");
    expect(classifyResponse({ status: 200, finalUrl: "x", text: "<div class='g-recaptcha'>", headers: {} })).toBe("challenge");
  });
  it("detects session expiry via bounce to sign_in", () => {
    expect(classifyResponse({ status: 200, finalUrl: "https://ais.usvisa-info.com/en-cn/niv/users/sign_in", text: "", headers: {} })).toBe("session_expired");
    expect(classifyResponse({ status: 401, finalUrl: "x", text: "", headers: {} })).toBe("session_expired");
  });
  it("detects ban / prohibited conduct messaging", () => {
    expect(classifyResponse({ status: 200, finalUrl: "x", text: "Your account has been suspended", headers: {} })).toBe("banned");
  });
  it("passes a normal 200 JSON response as ok", () => {
    expect(classifyResponse({ status: 200, finalUrl: "x", text: "[]", headers: {} })).toBe("ok");
  });
});

describe("parsers", () => {
  it("parses days array (object and string forms)", () => {
    expect(parseDays('[{"date":"2026-07-01","business_day":true},{"date":"2026-07-05"}]')).toEqual(["2026-07-01", "2026-07-05"]);
    expect(parseDays('["2026-08-01"]')).toEqual(["2026-08-01"]);
    expect(parseDays("not json")).toEqual([]);
    expect(parseDays("{}")).toEqual([]);
  });
  it("parses times from available_times", () => {
    expect(parseTimes('{"available_times":["09:00","09:30"]}')).toEqual(["09:00", "09:30"]);
    expect(parseTimes('{"business_times":["10:00"]}')).toEqual(["10:00"]);
    expect(parseTimes("garbage")).toEqual([]);
  });
  it("extracts csrf token from meta or input", () => {
    expect(parseCsrfToken('<meta name="csrf-token" content="abc123"/>')).toBe("abc123");
    expect(parseCsrfToken('<input name="authenticity_token" value="xyz789">')).toBe("xyz789");
    expect(parseCsrfToken("<html></html>")).toBeUndefined();
  });
});

describe("UsVisaInfoAdapter.getAvailableDays", () => {
  it("aggregates dates across facilities and picks the earliest", async () => {
    const t = new MockTransport([
      mkRes({ text: '[{"date":"2026-09-01"}]' }),
      mkRes({ text: '[{"date":"2026-08-15"}]' }),
    ]);
    const adapter = new UsVisaInfoAdapter(t);
    const r = await adapter.getAvailableDays(monitor, session);
    expect(r.outcome).toBe("ok");
    expect(r.dates).toHaveLength(2);
    expect(r.earliest?.date).toBe("2026-08-15");
    expect(t.calls).toHaveLength(2);
  });

  it("STOPS immediately on a challenge (does not poll remaining facilities)", async () => {
    const t = new MockTransport([
      mkRes({ status: 403, text: "Just a moment" }),
      mkRes({ text: '[{"date":"2026-08-15"}]' }),
    ]);
    const adapter = new UsVisaInfoAdapter(t);
    const r = await adapter.getAvailableDays(monitor, session);
    expect(r.outcome).toBe("challenge");
    expect(t.calls).toHaveLength(1); // did NOT continue to facility 98
  });

  it("returns empty when no dates", async () => {
    const t = new MockTransport([mkRes({ text: "[]" }), mkRes({ text: "[]" })]);
    const adapter = new UsVisaInfoAdapter(t);
    const r = await adapter.getAvailableDays(monitor, session);
    expect(r.outcome).toBe("empty");
  });
});

describe("UsVisaInfoAdapter.reschedule", () => {
  it("refuses to claim success on an ambiguous response", async () => {
    const t = new MockTransport([
      mkRes({ text: '<meta name="csrf-token" content="fresh">' }), // schedule page
      mkRes({ text: "something unexpected" }), // POST result
    ]);
    const adapter = new UsVisaInfoAdapter(t);
    const r = await adapter.reschedule(
      { facilityId: "95", date: "2026-07-01", time: "09:00", monitorId: "m1" },
      session,
    );
    expect(r.status).toBe("failed");
  });

  it("reports slot_gone when the slot was taken", async () => {
    const t = new MockTransport([
      mkRes({ text: '<meta name="csrf-token" content="fresh">' }),
      mkRes({ text: "That time is no longer available" }),
    ]);
    const adapter = new UsVisaInfoAdapter(t);
    const r = await adapter.reschedule(
      { facilityId: "95", date: "2026-07-01", time: "09:00", monitorId: "m1" },
      session,
    );
    expect(r.status).toBe("slot_gone");
  });

  it("confirms on success message", async () => {
    const t = new MockTransport([
      mkRes({ text: '<meta name="csrf-token" content="fresh">' }),
      mkRes({ text: "You have successfully scheduled your appointment" }),
    ]);
    const adapter = new UsVisaInfoAdapter(t);
    const r = await adapter.reschedule(
      { facilityId: "95", date: "2026-07-01", time: "09:00", monitorId: "m1" },
      session,
    );
    expect(r.status).toBe("confirmed");
    expect(r.bookedDate).toBe("2026-07-01");
  });
});
