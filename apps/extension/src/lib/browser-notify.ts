import type { NotifyChannel, NotifyMessage, NotifyResult } from "@visa-lark/shared";

/**
 * A NotifyChannel that fires a native browser notification. Always available
 * (no config), works offline, and serves as the zero-setup default so a brand
 * new user gets alerts before configuring Bark/微信/Telegram.
 */
export class BrowserNotificationChannel implements NotifyChannel {
  readonly id = "browser";
  readonly displayName = "Browser notification";
  readonly chinaReliable = true; // local, no network
  async send(msg: NotifyMessage): Promise<NotifyResult> {
    try {
      const id = `visalark-${Date.now()}`;
      chrome.notifications.create(id, {
        type: "basic",
        iconUrl: chrome.runtime.getURL("icons/icon128.png"),
        title: msg.title,
        message: msg.body,
        priority: msg.priority === "high" ? 2 : 1,
        requireInteraction: msg.priority === "high",
      });
      // Stash the deep link so a click can open it.
      if (msg.url) {
        await chrome.storage.session.set({ [`notif_url_${id}`]: msg.url });
      }
      return { channel: this.id, delivered: true };
    } catch (e) {
      return { channel: this.id, delivered: false, error: String(e) };
    }
  }
}
