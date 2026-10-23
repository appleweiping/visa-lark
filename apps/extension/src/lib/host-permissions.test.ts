import { describe, it, expect } from "vitest";
import { channelOrigins, originPattern, requiredOrigins } from "./host-permissions.js";

describe("originPattern", () => {
  it("drops the path and port", () => {
    expect(originPattern("https://hooks.example.com:8443/a/b?c=1")).toBe("https://hooks.example.com/*");
    expect(originPattern("http://192.168.1.5:8787")).toBe("http://192.168.1.5/*");
  });

  it("rejects non-http URLs and garbage", () => {
    expect(originPattern("ftp://example.com")).toBeNull();
    expect(originPattern("not a url")).toBeNull();
    expect(originPattern("")).toBeNull();
  });
});

describe("channelOrigins", () => {
  it("uses the default Bark server unless a custom one is set", () => {
    expect(channelOrigins({ type: "bark", key: "k" })).toEqual(["https://api.day.app/*"]);
    expect(channelOrigins({ type: "bark", key: "k", server: "https://bark.my.home/" })).toEqual([
      "https://bark.my.home/*",
    ]);
  });

  it("picks the ServerChan host from the key type", () => {
    expect(channelOrigins({ type: "serverchan", sendKey: "SCT123abc" })).toEqual(["https://sctapi.ftqq.com/*"]);
    expect(channelOrigins({ type: "serverchan", sendKey: "sctp42tXYZ" })).toEqual(["https://*.push.ft07.com/*"]);
  });

  it("covers Telegram and webhooks", () => {
    expect(channelOrigins({ type: "telegram", botToken: "t", chatId: "c" })).toEqual(["https://api.telegram.org/*"]);
    expect(channelOrigins({ type: "webhook", url: "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=x" })).toEqual([
      "https://qyapi.weixin.qq.com/*",
    ]);
    expect(channelOrigins({ type: "webhook", url: "" })).toEqual([]);
  });
});

describe("requiredOrigins", () => {
  it("dedupes and includes the control plane", () => {
    const origins = requiredOrigins(
      [
        { type: "bark", key: "a" },
        { type: "bark", key: "b" },
        { type: "telegram", botToken: "t", chatId: "c" },
      ],
      "https://cp.example.com/",
    );
    expect(origins).toEqual(["https://api.day.app/*", "https://api.telegram.org/*", "https://cp.example.com/*"]);
  });

  it("is empty when nothing is configured", () => {
    expect(requiredOrigins([], undefined)).toEqual([]);
  });
});
