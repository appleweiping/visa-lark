# @visa-lark/control-plane

The **optional** self-hosted control plane for [VisaLark](../../DESIGN.md). Run it on a
free VM (Oracle Cloud Always Free works great) to get a cross-device availability
history, a calendar heatmap with "best time to check" intelligence, and a
notification relay so your channel secrets live on your server instead of in a
browser page.

> **It holds ZERO visa credentials and never talks to `usvisa-info`.** It does not
> poll the visa site. All visa-touching code lives in the data plane (the browser
> extension / local agent). This plane is pure convenience. See
> [DESIGN.md §2](../../DESIGN.md) for the two-plane architecture and why it matters.

## What it does

| Route | Auth | Purpose |
|-------|------|---------|
| `GET  /api/health` | public | `{ ok, version, uptime }` liveness probe |
| `POST /api/notify` | bearer | Fan out a message to `@visa-lark/notify` channels (Bark / Server酱 / Telegram / Webhook). Channel secrets stay server-side. |
| `POST /api/observations` | bearer | Store slot observations `{ monitorId, dates:[{date,facilityId}], at }` pushed by the data plane. |
| `GET  /api/observations?monitorId=&facilityId=` | bearer | Availability history (newest first). |
| `GET  /api/heatmap?facilityId=&tz=` | bearer | Aggregated 7×24 calendar heatmap + **"best time to check"** ranking (release-pattern learning). `tz` = minutes offset from UTC for local bucketing (e.g. `480` for Beijing). |

### The "best time to check" feature

`GET /api/heatmap` runs a **pure** aggregation (`src/heatmap.ts`,
`computeHeatmap`) over your own observation history. It separates two signals:

- **observations** — how often the monitor *saw* anything in each (day-of-week ×
  hour) bucket.
- **releases** — the *first* time each distinct `(facilityId, appointment-date)`
  slot was ever seen ≈ the moment a slot opened up.

Ranking hours by **releases** tells you which hour-of-day historically sees the
most new slots. Checking then both raises your hit-rate **and** lets you poll
less the rest of the day — which is exactly aligned with the account-safety laws
in DESIGN.md §3 (fewer, smarter polls).

## Auth & safety

- **Single-tenant.** One `DASHBOARD_TOKEN` (bearer) guards every `/api` route
  except `/api/health`. Wrong/missing token → `401`.
- **Fail-closed.** If `DASHBOARD_TOKEN` is unset, protected routes return `503`
  (an unconfigured relay must never be an open relay).
- **No secrets in logs.** The `event_log` audit table records channel *types*
  and delivery counts only — never keys, tokens, or cookies.
- Constant-time token comparison to avoid timing leaks.

## Configuration (`.env`)

Copy `.env.example` → `.env`:

| Var | Default | Notes |
|-----|---------|-------|
| `PORT` | `8787` | Listen port. |
| `DASHBOARD_TOKEN` | — | **Required.** `openssl rand -hex 32`. |
| `DB_PATH` | `./data/visalark.db` | SQLite file; dir auto-created. |
| `FRONTEND_ORIGIN` | `*` | Your Vercel web origin for CORS (comma-separated allowed). |

## Run it

### One-line install (recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/your-org/visa-lark/main/apps/control-plane/install.sh | bash
```

It installs Docker if missing, prompts for / generates a `DASHBOARD_TOKEN`, runs
`docker compose up -d --build`, waits for health, and prints the URL.

### Docker Compose (manual)

```bash
cp .env.example .env   # set DASHBOARD_TOKEN
docker compose up -d
curl http://127.0.0.1:8787/api/health
```

### Recommended ingress: Cloudflare Tunnel

Don't open port 8787 to the internet. Use a [Cloudflare
Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
— no inbound ports, free TLS, hides the VM IP. A `cloudflared` service template
is included (commented) in `docker-compose.yml`; point your hostname at
`http://control-plane:8787`.

### Local development

```bash
pnpm --filter @visa-lark/control-plane dev      # tsx watch
pnpm --filter @visa-lark/control-plane build     # tsc → dist/
pnpm --filter @visa-lark/control-plane start     # node dist/server.js
pnpm --filter @visa-lark/control-plane test      # vitest
```

## Data model

```
observation(id, monitor_id, facility_id, date, observed_at)   -- heatmap source
event_log(id, kind, payload_json, created_at)                 -- audit, no secrets
```

No `account` / `session` / `password` tables exist here by design — visa
credentials never reach this plane.
