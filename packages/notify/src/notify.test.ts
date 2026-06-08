import { describe, it, expect, vi } from "vitest";
import { buildChannels, dispatch } from "../src/index.js";
import type { NotifyMessage } from "@visa-lark/shared";

const msg: NotifyMessage = {
  title: "Slot found",
  body: "2026-07-01 09:00 @ Beijing",
  priority: "high",
  url: "https://example.com/confirm/abc",
  kind: "slot_found",
};

function mockFetch(ok = true) {
  return vi.fn(async () => ({ ok, status: ok ? 200 : 500, text: async () => "" }));
}

describe("channels", () => {
  it("Bark builds a time-sensitive alarm URL for high priority", async () => {
    const f = mockFetch();
    const [bark] = buildChannels([{ type: "bark", key: "MYKEY" }], f);
    const r = await bark!.send(msg);
    expect(r.delivered).toBe(true);
    const calledUrl = f.mock.calls[0]![0] as string;
    expect(calledUrl).toContain("api.day.app/MYKEY");
    expect(calledUrl).toContain("level=timeSensitive");
    expect(calledUrl).toContain("sound=alarm");
    expect(calledUrl).toContain("url=https"); // deep link included
  });

  it("ServerChan posts to sctapi for SCT keys", async () => {
    const f = mockFetch();
    const [sc] = buildChannels([{ type: "serverchan", sendKey: "SCT12345abc" }], f);
    await sc!.send(msg);
    expect(f.mock.calls[0]![0]).toContain("sctapi.ftqq.com/SCT12345abc.send");
    // body is form-urlencoded, so decode before asserting the deep-link text
    const decoded = decodeURIComponent((f.mock.calls[0]![1] as any).body);
    expect(decoded).toContain("点击处理"); // deep link in body
  });

  it("Telegram posts to bot API with chat id", async () => {
    const f = mockFetch();
    const [tg] = buildChannels(
      [{ type: "telegram", botToken: "123:abc", chatId: "999" }],
      f,
    );
    await tg!.send(msg);
    expect(f.mock.calls[0]![0]).toContain("api.telegram.org/bot123:abc/sendMessage");
  });

  it("marks china reliability correctly", () => {
    const chans = buildChannels([
      { type: "bark", key: "k" },
      { type: "serverchan", sendKey: "SCTk" },
      { type: "telegram", botToken: "t", chatId: "c" },
    ]);
    expect(chans[0]!.chinaReliable).toBe(true);
    expect(chans[1]!.chinaReliable).toBe(true);
    expect(chans[2]!.chinaReliable).toBe(false);
  });
});

describe("dispatch redundancy", () => {
  it("a dead channel does not mask delivery on others", async () => {
    const good = mockFetch(true);
    const bad = vi.fn(async () => {
      throw new Error("network down");
    });
    const chans = buildChannels([{ type: "bark", key: "g" }], good as any);
    const badChans = buildChannels([{ type: "telegram", botToken: "t", chatId: "c" }], bad as any);
    const results = await dispatch([...chans, ...badChans], msg);
    expect(results).toHaveLength(2);
    expect(results.find((r) => r.channel === "bark")?.delivered).toBe(true);
    expect(results.find((r) => r.channel === "telegram")?.delivered).toBe(false);
  });
});
