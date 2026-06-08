/**
 * Process entrypoint. Wires config + SQLite store into the Fastify app and
 * listens. The control plane is OPTIONAL infrastructure (self-host on an Oracle
 * Cloud Always Free VM). It holds ZERO visa credentials and never polls the
 * visa site — it only relays notifications and stores availability history.
 *
 * Recommended ingress: Cloudflare Tunnel (no inbound ports, free TLS) — see
 * docker-compose.yml + README. Do NOT expose this directly without auth.
 */
import { loadConfig, VERSION } from "./config.js";
import { Store } from "./db.js";
import { buildApp } from "./app.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const store = new Store(config.dbPath);
  const app = buildApp({ config, store });

  if (!config.dashboardToken) {
    // Loud warning: protected routes fail-closed (503) until a token is set.
    console.warn(
      "[visalark] WARNING: DASHBOARD_TOKEN is not set. /api/notify, /api/observations " +
        "and /api/heatmap are DISABLED (503) until you set it. Only /api/health is public.",
    );
  }

  const shutdown = async (signal: string) => {
    console.log(`[visalark] ${signal} received, shutting down...`);
    try {
      await app.close();
      store.close();
    } finally {
      process.exit(0);
    }
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  try {
    await app.listen({ port: config.port, host: config.host });
    console.log(
      `[visalark] control-plane v${VERSION} listening on http://${config.host}:${config.port}\n` +
        `[visalark] db=${config.dbPath} cors-origin=${config.frontendOrigin}`,
    );
  } catch (err) {
    console.error("[visalark] failed to start:", err);
    store.close();
    process.exit(1);
  }
}

void main();
