# @visa-lark/control-plane

An optional server for [VisaLark](../../README.md) that you host yourself, on any Linux machine
or small VM with Docker. It keeps a history of the appointment dates your monitors have seen,
builds a day-of-week × hour heatmap of when new dates first showed up, and can relay
notifications so your Bark/Telegram/webhook secrets sit on your server instead of in a browser
page.

It holds no visa credentials and never contacts `usvisa-info`. Only the browser extension and the
local agent talk to the visa site; this service just receives the dates they saw. See
[DESIGN.md §2](../../DESIGN.md).

## What it does

| Route | Auth | Purpose |
|-------|------|---------|
| `GET  /api/health` | public | `{ ok, version, uptime }` liveness probe |
| `POST /api/notify` | bearer | Fan out a message to `@visa-lark/notify` channels (Bark / Server酱 / Telegram / Webhook). Channel secrets stay server-side. |
| `POST /api/observations` | bearer | Store slot observations `{ monitorId, dates:[{date,facilityId}], at }` pushed by the data plane. |
| `GET  /api/observations?monitorId=&facilityId=` | bearer | Availability history (newest first). |
| `GET  /api/heatmap?facilityId=&tz=` | bearer | 7×24 heatmap of observations and first sightings, plus the hours ranked by first sightings. `tz` = minutes offset from UTC for local bucketing (e.g. `480` for Beijing). |

### The heatmap

`GET /api/heatmap` aggregates your own observation history (`computeHeatmap` in
`src/heatmap.ts`) into two counts per (day-of-week × hour) bucket:

- **observations**: how often a monitor saw any available date in that bucket.
- **releases**: the first time each distinct `(facilityId, appointment-date)` pair was seen,
  which is roughly when that slot opened up.

`bestHours` lists the hours of the day by release count, so you can see when new dates have
tended to appear for you. It only reflects what your own monitors happened to see while they
were running, so with a few days of data it is a rough hint, not a prediction.

## Auth & safety

- **One user.** One `DASHBOARD_TOKEN` (bearer) guards every `/api` route
  except `/api/health`. Wrong/missing token → `401`.
- **Returns 503 until `DASHBOARD_TOKEN` is set**, so a freshly started server
  is never an open notification relay.
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
curl -fsSL https://raw.githubusercontent.com/appleweiping/visa-lark/master/apps/control-plane/install.sh | bash
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
