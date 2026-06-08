import type { NotifyChannel, NotifyMessage, NotifyResult } from "@visa-lark/shared";

/**
 * Notification channels. China-first. Each channel is a thin, dependency-free
 * wrapper over an injected `fetch` so it runs identically in the browser
 * extension (MV3 service worker) and the Node local agent.
 *
 * Reliability note (DESIGN.md §7): Bark + ServerChan reach mainland China
 * without a proxy; Telegram does not. The dispatcher fans high-priority events
 * to ALL channels so a single dead channel can't swallow a slot alert.
 */

export type FetchLike = (
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

const defaultFetch: FetchLike = (url, init) =>
  fetch(url, init as RequestInit) as unknown as ReturnType<FetchLike>;

function priorityEmoji(p: NotifyMessage["priority"]): string {
  return p === "high" ? "🔴" : p === "normal" ? "🟡" : "⚪";
}

/** Bark (iOS push). config: { key, server? } — server defaults to api.day.app. */
export class BarkChannel implements NotifyChannel {
  readonly id = "bark";
  readonly displayName = "Bark (iOS)";
  readonly chinaReliable = true;
  constructor(
    private cfg: { key: string; server?: string },
    private fetchFn: FetchLike = defaultFetch,
  ) {}
  async send(msg: NotifyMessage): Promise<NotifyResult> {
    const server = (this.cfg.server || "https://api.day.app").replace(/\/$/, "");
    const params = new URLSearchParams({
      title: msg.title,
      body: msg.body,
      // high-priority slot alerts use a time-sensitive interruption level + sound
      level: msg.priority === "high" ? "timeSensitive" : "active",
      group: "VisaLark",
    });
    if (msg.url) params.set("url", msg.url);
    if (msg.priority === "high") params.set("sound", "alarm");
    const url = `${server}/${encodeURIComponent(this.cfg.key)}?${params.toString()}`;
    try {
      const res = await this.fetchFn(url, { method: "GET" });
      return { channel: this.id, delivered: res.ok };
    } catch (e) {
      return { channel: this.id, delivered: false, error: String(e) };
    }
  }
}

/** ServerChan / Server酱 (WeChat push). config: { sendKey }. */
export class ServerChanChannel implements NotifyChannel {
  readonly id = "serverchan";
  readonly displayName = "Server酱 (微信)";
  readonly chinaReliable = true;
  constructor(
    private cfg: { sendKey: string },
    private fetchFn: FetchLike = defaultFetch,
  ) {}
  async send(msg: NotifyMessage): Promise<NotifyResult> {
    // sctapi.ftqq.com for sct keys (SCT...), older sc.ftqq.com for SCU keys.
    const base = this.cfg.sendKey.startsWith("sctp")
      ? `https://${this.cfg.sendKey.match(/^sctp(\d+)t/)?.[1] ?? ""}.push.ft07.com`
      : "https://sctapi.ftqq.com";
    const url = `${base}/${this.cfg.sendKey}.send`;
    const desp = msg.url ? `${msg.body}\n\n[点击处理](${msg.url})` : msg.body;
    const body = new URLSearchParams({
      title: `${priorityEmoji(msg.priority)} ${msg.title}`,
      desp,
    }).toString();
    try {
      const res = await this.fetchFn(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      return { channel: this.id, delivered: res.ok };
    } catch (e) {
      return { channel: this.id, delivered: false, error: String(e) };
    }
  }
}

/** Telegram bot. config: { botToken, chatId }. Not China-reliable. */
export class TelegramChannel implements NotifyChannel {
  readonly id = "telegram";
  readonly displayName = "Telegram";
  readonly chinaReliable = false;
  constructor(
    private cfg: { botToken: string; chatId: string },
    private fetchFn: FetchLike = defaultFetch,
  ) {}
  async send(msg: NotifyMessage): Promise<NotifyResult> {
    const text =
      `${priorityEmoji(msg.priority)} *${escapeMd(msg.title)}*\n${escapeMd(msg.body)}` +
      (msg.url ? `\n[👉 处理 / Open](${msg.url})` : "");
    const url = `https://api.telegram.org/bot${this.cfg.botToken}/sendMessage`;
    const body = JSON.stringify({
      chat_id: this.cfg.chatId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    });
    try {
      const res = await this.fetchFn(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      return { channel: this.id, delivered: res.ok };
    } catch (e) {
      return { channel: this.id, delivered: false, error: String(e) };
    }
  }
}

/**
 * Webhook channel (generic POST JSON) — covers 企业微信机器人 / Discord / Slack /
 * custom relays. config: { url, template? }.
 */
export class WebhookChannel implements NotifyChannel {
  readonly id = "webhook";
  readonly displayName = "Webhook";
  readonly chinaReliable = true; // depends on target; 企业微信 is reliable in CN
  constructor(
    private cfg: { url: string },
    private fetchFn: FetchLike = defaultFetch,
  ) {}
  async send(msg: NotifyMessage): Promise<NotifyResult> {
    try {
      const res = await this.fetchFn(this.cfg.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          msgtype: "text",
          text: { content: `${priorityEmoji(msg.priority)} ${msg.title}\n${msg.body}${msg.url ? `\n${msg.url}` : ""}` },
          // also include raw fields for non-企业微信 consumers
          title: msg.title,
          body: msg.body,
          url: msg.url,
          priority: msg.priority,
          kind: msg.kind,
        }),
      });
      return { channel: this.id, delivered: res.ok };
    } catch (e) {
      return { channel: this.id, delivered: false, error: String(e) };
    }
  }
}

function escapeMd(s: string): string {
  return s.replace(/([_*`\[\]])/g, "\\$1");
}
