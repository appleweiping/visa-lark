import type { ChannelConfig } from "@visa-lark/notify";

/**
 * Hosts the background worker has to reach besides the visa site.
 *
 * Without host permission, a fetch from the service worker is a normal
 * cross-origin request. The JSON POSTs (Telegram, webhooks, the control plane)
 * then need a CORS preflight that most of these servers do not answer, so the
 * alert is never sent. The manifest lists http(s) hosts as optional, and the
 * options page asks for exactly the origins below when you test or save, so the
 * extension only ever holds access to the services you configured.
 */

/** Match pattern for the host of `url` (any port), or null if it is not http(s). */
export function originPattern(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  return `${u.protocol}//${u.hostname}/*`;
}

/** Origins one notification channel sends to. Mirrors packages/notify/src/channels.ts. */
export function channelOrigins(c: ChannelConfig): string[] {
  switch (c.type) {
    case "bark": {
      const p = originPattern(c.server || "https://api.day.app");
      return p ? [p] : [];
    }
    case "serverchan":
      // "sctp..." keys post to <n>.push.ft07.com, everything else to sctapi.ftqq.com.
      return [c.sendKey.startsWith("sctp") ? "https://*.push.ft07.com/*" : "https://sctapi.ftqq.com/*"];
    case "telegram":
      return ["https://api.telegram.org/*"];
    case "webhook": {
      const p = originPattern(c.url);
      return p ? [p] : [];
    }
  }
}

/** All origins needed for the configured channels and the optional control plane. */
export function requiredOrigins(channels: ChannelConfig[], controlPlaneUrl?: string): string[] {
  const out = new Set<string>();
  for (const c of channels) for (const o of channelOrigins(c)) out.add(o);
  if (controlPlaneUrl) {
    const p = originPattern(controlPlaneUrl);
    if (p) out.add(p);
  }
  return [...out];
}
