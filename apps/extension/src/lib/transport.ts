import type { HttpResponse, HttpTransport } from "@visa-lark/shared";

/**
 * Browser-context transport. THE safety-critical choice (DESIGN.md §1, §3.2):
 *
 * We call `fetch` from the extension's background service worker with
 * `credentials: "include"`. Because the user is logged into usvisa-info in this
 * same browser profile, the browser automatically attaches the real
 * `_yatri_session` cookie, sends from the user's residential IP, and presents
 * the genuine browser TLS/JA3 fingerprint. There is NOTHING to fake and NOTHING
 * to store — we are simply reusing the session the human already established.
 *
 * This is why the extension is account-safe where a cloud poller is not: no
 * ASN/impossible-travel mismatch, no synthetic fingerprint, no stored password.
 */
export class BrowserTransport implements HttpTransport {
  async request(input: {
    url: string;
    method?: "GET" | "POST";
    headers?: Record<string, string>;
    body?: string;
    json?: boolean;
  }): Promise<HttpResponse> {
    const res = await fetch(input.url, {
      method: input.method ?? "GET",
      headers: input.headers,
      body: input.body,
      // Ride the user's real session. No manual cookie handling.
      credentials: "include",
      redirect: "follow",
    });
    const text = await res.text();
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      headers[k.toLowerCase()] = v;
    });
    return {
      status: res.status,
      ok: res.ok,
      text,
      headers,
      finalUrl: res.url,
    };
  }
}
