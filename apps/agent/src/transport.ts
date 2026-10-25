import type { HttpResponse, HttpTransport, Session } from "@visa-lark/shared";

/**
 * Node transport for the local agent. Carries the user's EXPORTED session cookie
 * and original browser User-Agent (cookie-only, DESIGN.md §3.3 — no password).
 *
 * It does not rotate proxies, spoof TLS or solve challenges. It is meant to run
 * on the user's own home machine (see ip-guard.ts) so requests come from the
 * network where the user logged in. On a cloud VM the IP guard refuses to start.
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
