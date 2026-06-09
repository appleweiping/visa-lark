import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { Store } from "../src/db.js";
import type { AppConfig } from "../src/config.js";

const TOKEN = "test-secret-token";

function makeConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    port: 0,
    host: "127.0.0.1",
    dashboardToken: TOKEN,
    dbPath: ":memory:",
    frontendOrigin: "*",
    ...overrides,
  };
}

function auth(token = TOKEN) {
  return { authorization: `Bearer ${token}` };
}

describe("control-plane API", () => {
  let app: FastifyInstance;
  let store: Store;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    store = new Store(":memory:");
    fetchMock = vi.fn(async () => ({ ok: true, status: 200, text: async () => "" }));
    app = buildApp({
      config: makeConfig(),
      store,
      fetchFn: fetchMock as unknown as typeof fetch,
      now: () => 1_700_000_000_000,
    });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    store.close();
  });

  describe("auth guard", () => {
    it("allows /api/health without a token", async () => {
      const res = await app.inject({ method: "GET", url: "/api/health" });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.ok).toBe(true);
      expect(body.version).toBeTypeOf("string");
      expect(body.uptime).toBeTypeOf("number");
    });

    it("rejects a protected route with no Authorization header (401)", async () => {
      const res = await app.inject({ method: "GET", url: "/api/observations" });
      expect(res.statusCode).toBe(401);
      expect(res.json().error).toBe("unauthorized");
    });

    it("rejects a wrong token (401)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/observations",
        headers: auth("nope"),
      });
      expect(res.statusCode).toBe(401);
    });

    it("rejects a correct-length but wrong token (401)", async () => {
      const wrong = "x".repeat(TOKEN.length);
      const res = await app.inject({
        method: "GET",
        url: "/api/observations",
        headers: auth(wrong),
      });
      expect(res.statusCode).toBe(401);
    });

    it("accepts the correct bearer token", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/observations",
        headers: auth(),
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe("fail-closed when no token configured", () => {
    it("returns 503 for protected routes and 200 for health", async () => {
      const s2 = new Store(":memory:");
      const noTokenApp = buildApp({
        config: makeConfig({ dashboardToken: undefined }),
        store: s2,
      });
      await noTokenApp.ready();
      const health = await noTokenApp.inject({ method: "GET", url: "/api/health" });
      expect(health.statusCode).toBe(200);
      const protectedRes = await noTokenApp.inject({
        method: "GET",
        url: "/api/observations",
        headers: auth(),
      });
      expect(protectedRes.statusCode).toBe(503);
      expect(protectedRes.json().error).toBe("unconfigured");
      await noTokenApp.close();
      s2.close();
    });
  });

  describe("observations + heatmap round-trip", () => {
    it("stores observations and returns history + heatmap", async () => {
      const post = await app.inject({
        method: "POST",
        url: "/api/observations",
        headers: auth(),
        payload: {
          monitorId: "m1",
          at: Date.UTC(2026, 6, 1, 9, 0, 0),
          dates: [
            { date: "2026-07-01", facilityId: "95" },
            { date: "2026-07-02", facilityId: "95" },
          ],
        },
      });
      expect(post.statusCode).toBe(200);
      expect(post.json()).toMatchObject({ ok: true, written: 2 });

      const hist = await app.inject({
        method: "GET",
        url: "/api/observations?monitorId=m1&facilityId=95",
        headers: auth(),
      });
      expect(hist.statusCode).toBe(200);
      expect(hist.json().count).toBe(2);

      const heat = await app.inject({
        method: "GET",
        url: "/api/heatmap?facilityId=95",
        headers: auth(),
      });
      expect(heat.statusCode).toBe(200);
      const hm = heat.json().heatmap;
      expect(hm.totalObservations).toBe(2);
      expect(hm.totalReleases).toBe(2);
      expect(hm.bestHour).toBe(9);
      expect(hm.cells).toHaveLength(168);
    });

    it("rejects observations with no monitorId (400)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/observations",
        headers: auth(),
        payload: { dates: [] },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toBe("monitorId_required");
    });
  });

  describe("notify relay", () => {
    it("fans out to channels and never echoes secrets", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/notify",
        headers: auth(),
        payload: {
          channels: [{ type: "bark", key: "SECRETKEY" }],
          message: { title: "Slot", body: "2026-07-01 @ Beijing", priority: "high", kind: "slot_found" },
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.ok).toBe(true);
      expect(body.delivered).toBe(1);
      expect(fetchMock).toHaveBeenCalledOnce();
      // event log must NOT contain the secret key
      const events = store.recentEvents();
      const notifyEvent = events.find((e) => e.kind === "notify");
      expect(notifyEvent).toBeDefined();
      expect(notifyEvent!.payloadJson).not.toContain("SECRETKEY");
      expect(notifyEvent!.payloadJson).toContain("bark");
    });

    it("rejects an empty channel list (400)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/notify",
        headers: auth(),
        payload: { channels: [], message: { title: "x", body: "y" } },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toBe("no_channels");
    });

    it("blocks SSRF: webhook pointing at the cloud metadata endpoint (M6)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/notify",
        headers: auth(),
        payload: {
          channels: [{ type: "webhook", url: "http://169.254.169.254/latest/meta-data/" }],
          message: { title: "x", body: "y" },
        },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toBe("blocked_webhook_target");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("blocks SSRF: webhook to a private 192.168 / localhost target (M6)", async () => {
      for (const url of ["http://192.168.1.10/x", "http://localhost:9200/", "http://10.0.0.5/"]) {
        const res = await app.inject({
          method: "POST",
          url: "/api/notify",
          headers: auth(),
          payload: { channels: [{ type: "webhook", url }], message: { title: "x", body: "y" } },
        });
        expect(res.statusCode).toBe(400);
      }
    });

    it("blocks SSRF: IPv4-mapped IPv6 to metadata endpoint (MEDIUM-4)", async () => {
      for (const url of [
        "http://[::ffff:169.254.169.254]/latest/meta-data/",
        "http://[::ffff:a9fe:a9fe]/",
        "http://[::1]/",
      ]) {
        const res = await app.inject({
          method: "POST",
          url: "/api/notify",
          headers: auth(),
          payload: { channels: [{ type: "webhook", url }], message: { title: "x", body: "y" } },
        });
        expect(res.statusCode).toBe(400);
      }
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("allows a public webhook host", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/notify",
        headers: auth(),
        payload: {
          channels: [{ type: "webhook", url: "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=abc" }],
          message: { title: "x", body: "y" },
        },
      });
      expect(res.statusCode).toBe(200);
    });

    it("rejects a message missing title/body (400)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/notify",
        headers: auth(),
        payload: { channels: [{ type: "bark", key: "k" }], message: { title: "only title" } },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toBe("invalid_message");
    });
  });
});
