/**
 * Environment-driven configuration. Single-tenant: ONE bearer token guards the
 * whole API. Holds no visa credentials. See DESIGN.md §3.6 (single-tenant only).
 */
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface AppConfig {
  port: number;
  host: string;
  /** Bearer token guarding all /api routes except /api/health. */
  dashboardToken: string | undefined;
  /** SQLite database file path (absolute). */
  dbPath: string;
  /** Allowed CORS origin for the web frontend. "*" allows any. */
  frontendOrigin: string;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
// dist/ is one level under the app root; data/ lives at the app root by default.
const APP_ROOT = resolve(__dirname, "..");

function resolveDbPath(raw: string | undefined): string {
  const p = raw && raw.trim().length > 0 ? raw : "./data/visalark.db";
  // Special SQLite targets are passed through untouched.
  if (p === ":memory:" || p.startsWith("file:")) return p;
  return isAbsolute(p) ? p : resolve(APP_ROOT, p);
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const port = Number.parseInt(env.PORT ?? "8787", 10);
  return {
    port: Number.isFinite(port) ? port : 8787,
    // Bind all interfaces by default so it works inside Docker / behind a tunnel.
    host: env.HOST ?? "0.0.0.0",
    dashboardToken: env.DASHBOARD_TOKEN && env.DASHBOARD_TOKEN.length > 0
      ? env.DASHBOARD_TOKEN
      : undefined,
    dbPath: resolveDbPath(env.DB_PATH),
    frontendOrigin: env.FRONTEND_ORIGIN ?? "*",
  };
}

export const VERSION = "0.1.0";
