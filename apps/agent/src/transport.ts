import type { HttpResponse, HttpTransport, Session } from "@visa-lark/shared";

/**
 * Node transport for the local agent. Carries the user's EXPORTED session cookie
 * and original browser User-Agent (cookie-only, DESIGN.md §3.3 — no password).
 *
 * IMPORTANT: this transport contains ZERO evasion. It does not rotate proxies,
 * spoof TLS, or solve challenges. It is meant to run on the USER'S OWN
 * residential machine (see ip-guard.ts) so requests originate from the same
 * network/IP where the user logged in — avoiding the impossible-travel ban
 * vector. Running this on a cloud VM is explicitly unsafe and guarded against.
 */
export class NodeTransport implements HttpTransport {
  constructor(private session: Session) {}

  async request(input: {
    url: string;
    method?: "GET" | "POST";
    headers?: Record<string, string>;
    body?: string;
    json?: boolean;
  }): Promise<HttpResponse> {
    const headers: Record<string, string> = {
      Cookie: this.session.cookie,
      ...(this.session.userAgent ? { "User-Agent": this.session.userAgent } : {}),
      ...input.headers,
    };
    const res = await fetch(input.url, {
      method: input.method ?? "GET",
      headers,
      body: input.body,
      redirect: "follow",
    });
    const text = await res.text();
    const h: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      h[k.toLowerCase()] = v;
    });
    return { status: res.status, ok: res.ok, text, headers: h, finalUrl: res.url };
  }
}
