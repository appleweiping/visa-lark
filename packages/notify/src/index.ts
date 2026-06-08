import type { NotifyChannel } from "@visa-lark/shared";
import {
  BarkChannel,
  ServerChanChannel,
  TelegramChannel,
  WebhookChannel,
  type FetchLike,
} from "./channels.js";

export * from "./channels.js";

/** Serializable channel configuration (stored in settings, never logged raw). */
export type ChannelConfig =
  | { type: "bark"; key: string; server?: string }
  | { type: "serverchan"; sendKey: string }
  | { type: "telegram"; botToken: string; chatId: string }
  | { type: "webhook"; url: string };

/** Build live channel instances from stored configs. */
export function buildChannels(
  configs: ChannelConfig[],
  fetchFn?: FetchLike,
): NotifyChannel[] {
  return configs.map((c) => {
    switch (c.type) {
      case "bark":
        return new BarkChannel({ key: c.key, server: c.server }, fetchFn);
      case "serverchan":
        return new ServerChanChannel({ sendKey: c.sendKey }, fetchFn);
      case "telegram":
        return new TelegramChannel({ botToken: c.botToken, chatId: c.chatId }, fetchFn);
      case "webhook":
        return new WebhookChannel({ url: c.url }, fetchFn);
    }
  });
}

export { dispatch } from "@visa-lark/shared";
