/**
 * Notification channel abstraction. China-first + multi-channel + redundant.
 * See DESIGN.md §7. Ship Bark / ServerChan(WeChat) / Telegram / Email.
 */

export type NotifyPriority = "low" | "normal" | "high";

export interface NotifyMessage {
  title: string;
  body: string;
  priority: NotifyPriority;
  /** Optional deep link / action URL (e.g. one-tap confirm). */
  url?: string;
  /** Logical event kind, for dedupe + analytics. */
  kind: "slot_found" | "booked" | "session_expired" | "challenge" | "heartbeat" | "error";
}

export interface NotifyResult {
  channel: string;
  delivered: boolean;
  error?: string;
}

export interface NotifyChannel {
  readonly id: string;
  readonly displayName: string;
  /** Whether this channel works reliably from mainland China without a proxy. */
  readonly chinaReliable: boolean;
  send(msg: NotifyMessage): Promise<NotifyResult>;
}

/**
 * Dispatch a message to all configured channels. High-priority events fan out to
 * every channel for redundancy; low/normal may be limited by the caller.
 * Never throws — collects per-channel results so one dead channel can't mask a slot.
 */
export async function dispatch(
  channels: NotifyChannel[],
  msg: NotifyMessage,
): Promise<NotifyResult[]> {
  const results = await Promise.allSettled(channels.map((c) => c.send(msg)));
  return results.map((r, i) => {
    const ch = channels[i];
    const id = ch ? ch.id : "unknown";
    if (r.status === "fulfilled") return r.value;
    return { channel: id, delivered: false, error: String(r.reason) };
  });
}
