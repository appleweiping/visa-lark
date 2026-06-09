/**
 * Fastify app factory. Separated from the process entrypoint (server.ts) so
 * tests can drive it with `app.inject()` against an in-memory DB.
 *
 * Auth: a single bearer token (DASHBOARD_TOKEN) guards every /api route except
 * /api/health. Single-tenant only (DESIGN.md §3.6). This plane holds ZERO visa
 * credentials and NEVER talks to usvisa-info — it only relays notifications and
 * stores availability history the data plane chooses to push.
 */
import cors from "@fastify/cors";
import { createHash, timingSafeEqual as nodeTimingSafeEqual } from "node:crypto";
import { buildChannels, dispatch, type ChannelConfig } from "@visa-lark/notify";
import type { NotifyMessage } from "@visa-lark/shared";
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import type { AppConfig } from "./config.js";
import { VERSION } from "./config.js";
import { Store } from "./db.js";
import { computeHeatmap } from "./heatmap.js";

export interface BuildOptions {
  config: AppConfig;
  store: Store;
  /** Injectable fetch for the notify relay (tests pass a mock). */
  fetchFn?: typeof fetch;
  /** Injectable clock for deterministic tests. */
  now?: () => number;
}

const NOTIFY_KINDS = new Set<NotifyMessage["kind"]>([
  "slot_found",
  "booked",
  "session_expired",
  "challenge",
  "heartbeat",
  "error",
]);

export function buildApp(opts: BuildOptions): FastifyInstance {
  const { config, store } = opts;
  const fetchFn = opts.fetchFn ?? (globalThis.fetch as typeof fetch);
  const now = opts.now ?? Date.now;
  const startedAt = now();

  const app = Fastify({
    logger: false,
    // Don't leak internals; keep body limit modest for a single-tenant relay.
    bodyLimit: 1_000_000,
  });

  app.register(cors, {
    origin: config.frontendOrigin === "*" ? true : config.frontendOrigin.split(","),
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // --- Auth guard: bearer token on everything under /api except /api/health ---
  app.addHook("onRequest", async (req: FastifyRequest, reply: FastifyReply) => {
    const url = req.url.split("?")[0] ?? "";
    if (!url.startsWith("/api/")) return; // non-api (e.g. nothing) — allow
    if (url === "/api/health") return; // health is public

    // If no token is configured, refuse to serve protected routes at all
    // (fail-closed: an unconfigured relay must not be an open relay).
    if (!config.dashboardToken) {
      return reply.code(503).send({
        error: "unconfigured",
        message: "DASHBOARD_TOKEN is not set; protected API is disabled.",
      });
    }

    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
    if (!token || !timingSafeEqual(token, config.dashboardToken)) {
      return reply.code(401).send({ error: "unauthorized" });
    }
  });

  // ---------------------------- Health ----------------------------
  app.get("/api/health", async () => ({
    ok: true,
    version: VERSION,
    uptime: Math.round((now() - startedAt) / 1000),
  }));

  // ----------------------- Notification relay ----------------------
  // Channel secrets live HERE (server env / request from the trusted data
  // plane), never in the web page. Fan out via the shared notify core.
  app.post<{ Body: { channels?: ChannelConfig[]; message?: Partial<NotifyMessage> } }>(
    "/api/notify",
    async (req, reply) => {
      const body = req.body ?? {};
      const channels = Array.isArray(body.channels) ? body.channels : [];
      const m = body.message ?? {};
      if (channels.length === 0) {
        return reply.code(400).send({ error: "no_channels" });
      }
      // SSRF guard (M6): webhook channels POST to a caller-supplied URL. On a
      // cloud VM that could hit the metadata endpoint or internal services.
      // Reject webhook targets pointing at private / link-local / loopback hosts.
      for (const c of channels) {
        if (c.type === "webhook" && !isSafePublicUrl(c.url)) {
          return reply.code(400).send({
            error: "blocked_webhook_target",
            message: "Webhook URL must be a public http(s) host (no private/link-local/loopback addresses).",
          });
        }
      }
      if (!m.title || !m.body) {
        return reply.code(400).send({ error: "invalid_message", message: "title and body required" });
      }
      const message: NotifyMessage = {
        title: String(m.title),
        body: String(m.body),
        priority: m.priority === "high" || m.priority === "low" ? m.priority : "normal",
        url: m.url ? String(m.url) : undefined,
        kind: m.kind && NOTIFY_KINDS.has(m.kind) ? m.kind : "slot_found",
      };
      const built = buildChannels(channels, fetchFn as never);
      const results = await dispatch(built, message);
      const delivered = results.filter((r) => r.delivered).length;
      // Audit WITHOUT secrets: only channel types + delivery outcome.
      store.logEvent(
        "notify",
        {
          channelTypes: channels.map((c) => c.type),
          kind: message.kind,
          priority: message.priority,
          delivered,
          total: results.length,
        },
        now(),
      );
      return reply.send({ ok: delivered > 0, delivered, total: results.length, results });
    },
  );

  // --------------------- Availability history ----------------------
  app.post<{
    Body: {
      monitorId?: string;
      dates?: { date?: string; facilityId?: string }[];
      at?: number;
    };
  }>("/api/observations", async (req, reply) => {
    const body = req.body ?? {};
    const monitorId = typeof body.monitorId === "string" ? body.monitorId : "";
    if (!monitorId) return reply.code(400).send({ error: "monitorId_required" });
    const at = typeof body.at === "number" && Number.isFinite(body.at) ? body.at : now();
    const rawDates = Array.isArray(body.dates) ? body.dates : [];
    const dates = rawDates
      .filter((d): d is { date: string; facilityId: string } =>
        !!d && typeof d.date === "string" && typeof d.facilityId === "string",
      )
      .map((d) => ({ date: d.date, facilityId: d.facilityId }));
    const written = store.insertObservations(monitorId, dates, at);
    store.logEvent("observations", { monitorId, count: written, at }, now());
    return reply.send({ ok: true, written });
  });

  app.get<{ Querystring: { monitorId?: string; facilityId?: string; limit?: string } }>(
    "/api/observations",
    async (req, reply) => {
      const { monitorId, facilityId, limit } = req.query;
      const rows = store.queryObservations({
        monitorId: monitorId || undefined,
        facilityId: facilityId || undefined,
        limit: limit ? Number.parseInt(limit, 10) : undefined,
      });
      return reply.send({ ok: true, count: rows.length, observations: rows });
    },
  );

  // ------------------------- Heatmap --------------------------------
  app.get<{ Querystring: { facilityId?: string; tz?: string } }>(
    "/api/heatmap",
    async (req, reply) => {
      const { facilityId, tz } = req.query;
      const tzOffsetMinutes = tz ? Number.parseInt(tz, 10) : 0;
      const records = store.loadForHeatmap(facilityId || undefined);
      const result = computeHeatmap(records, {
        facilityId: facilityId || null,
        tzOffsetMinutes: Number.isFinite(tzOffsetMinutes) ? tzOffsetMinutes : 0,
      });
      return reply.send({ ok: true, heatmap: result });
    },
  );

  return app;
}

/** Constant-time string comparison to avoid token-length/timing leaks. */
function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  // Hash both to a fixed length so the compare itself never leaks length (L6).
  const ah = createHash("sha256").update(ab).digest();
  const bh = createHash("sha256").update(bb).digest();
  return nodeTimingSafeEqual(ah, bh) && a.length === b.length;
}

/**
 * SSRF guard for caller-supplied webhook URLs (M6). Allows only http(s) to a
 * host that is not an obvious private / link-local / loopback / metadata target.
 * This is a hostname/literal-IP heuristic; it does not resolve DNS (a determined
 * attacker could use a rebinding domain — documented as a residual risk).
 */
function isSafePublicUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return false;
  if (host === "169.254.169.254" || host === "metadata.google.internal") return false;
  // IPv4 literal private/loopback/link-local ranges.
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 10 || a === 127 || a === 0) return false;
    if (a === 169 && b === 254) return false; // link-local incl. metadata
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
  }
  // IPv6 loopback / link-local / unique-local.
  if (host === "::1" || host.startsWith("fe80") || host.startsWith("fc") || host.startsWith("fd")) {
    return false;
  }
  return true;
}
