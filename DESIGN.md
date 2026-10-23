# VisaLark design notes

Why VisaLark is built the way it is, and where each decision lives in the code. Section numbers
are referenced from comments in the source.

## 1. The risk that shapes everything

The appointment site (`ais.usvisa-info.com`, run by CGI Federal) sits behind Cloudflare (challenge
pages, rate limiting with error 1015) and uses reCAPTCHA on forms. How often you check matters, but
the signal I worry about most is where the requests come from. If you log in from a home ISP and
the same session then starts calling `/days/*.json` from a cloud datacenter, that looks like
account takeover or automation, and the real visa account can be suspended. An appeal is slow and
can cost you the travel window or the visa fee.

So the code that talks to the visa site runs on your own home connection and reuses the session
you logged into yourself. It does not run on a cloud server, and it does not try to be fast at any
cost: no proxy pools, no evasion.

## 2. Two planes

```
 your home network                                   anywhere (optional)
┌──────────────────────────────────────────┐        ┌─────────────────────────────────────┐
│ DATA PLANE: talks to the visa site         │        │ CONTROL PLANE: never talks to it    │
│                                            │        │                                     │
│  apps/extension  (MV3, your own browser)   │  seen  │  apps/control-plane (Fastify+SQLite)│
│        or                                  │ dates  │    history, heatmap, notify relay   │
│  apps/agent      (Node, home PC / Pi)      │ ─────► │  apps/web (Next.js on Vercel)       │
│                                            │        │    landing page, docs, mock demo    │
│  same packages/shared core: scheduler,     │        │                                     │
│  safety limits, auto-book checks           │        │  holds no visa credentials          │
└──────────────────────────────────────────┘        └─────────────────────────────────────┘
```

- The **data plane** is the only part that sees the visa site or a session cookie. The extension and
  the agent share `packages/shared`, `packages/adapter-usvisa-info` and `packages/notify`, so the
  safety logic has one implementation.
- The **control plane** is a convenience. It stores dates you have seen and can relay notifications;
  it never receives a visa credential and never polls the visa site.

## 3. Safety rules in the code

### 3.1 Residential network only

The extension runs in your browser, so its requests already come from where you logged in. The
agent looks up the organisation behind its public IP at startup (`apps/agent/src/ip-guard.ts`,
hints in `packages/shared/src/safety.ts`) and refuses to start on a known cloud/datacenter network
unless `allowDatacenterIp` is set. It re-checks every hour and stops all monitors if the network
changes to a datacenter one (for example a VPN). This is a heuristic based on the org name, not a
guarantee.

### 3.2 No evasion code

No proxy rotation, no fingerprint spoofing, no CAPTCHA solving, no TLS impersonation. The adapter
uses an injected transport: in the extension that is the browser's own `fetch` with its cookies, in
the agent a plain `fetch` with the cookie and User-Agent you pasted.

### 3.3 Cookie-only sessions

No visa password is stored and nothing logs in for you. The extension never reads the cookie; the
browser attaches it (`credentials: "include"`). The agent keeps the `_yatri_session` cookie you
copied in its local config file, protected only by file permissions. When the session expires,
both stop and ask you to sync again.

### 3.4 Stop on challenges

`packages/shared/src/safety.ts` turns each response into an outcome and a backoff state:

| Response | What happens |
|---|---|
| 403 / 503, Cloudflare or Turnstile page, reCAPTCHA, "account restricted" text | 4 h cooldown and the monitor stops at once; you are alerted |
| 401 / redirect to sign-in | "session expired" alert, 1 h pause |
| 429 / Cloudflare 1015 | 1 h pause |
| other errors | retried on the normal schedule |

Three failures in a row of any kind stop the monitor until you resume it from the popup.
The backoff state is persisted (`chrome.storage` in the extension, `stateFile` for the agent), so
restarting the service worker or the process does not reset a cooldown. A reCAPTCHA on the
reschedule POST is treated like a challenge.

### 3.5 Polling limits

| Profile | Interval | Daily request cap per monitor |
|---|---|---|
| `patient` (default) | 300 s ± 40% | 200 |
| `balanced` | 180 s ± 45% | 350 |
| `eager` | 90 s ± 50% | 600 |

The cap counts HTTP requests, not cycles: a monitor watching three consulates makes three requests
per cycle, plus one for times and one for a reschedule if it gets that far. On top of that there is
an account-wide budget across all monitors (1.5 × the profile cap), and requests from the
extension's confirm page count against it too.

### 3.6 One user per deployment

The control plane is single-user: one `DASHBOARD_TOKEN` protects every `/api` route except
`/api/health`, and without a token those routes return 503. There is no hosted multi-user service,
on purpose: it would mean holding other people's visa sessions.

## 4. Booking modes

| Mode | What happens | Default |
|---|---|---|
| `notify` | Alert only; you book yourself. | **yes** |
| `confirm` | The alert carries a link to the extension's confirm page; one click reschedules with your logged-in session. Extension only: the agent has no confirm page and treats `confirm` as `notify`. | no |
| `auto` | Reschedules without asking, behind the checks in §6. | no |

Rescheduling replaces your existing appointment, and the flow has not been verified end to end
against real accounts, so both `confirm` and `auto` are experimental.

## 5. Adapter interface

`packages/shared/src/adapter.ts` is the only interface that knows about a specific visa system:

```ts
interface VisaAdapter {
  id: string;
  validateSession(s: Session): Promise<SessionHealth>;
  getAvailableDays(m: Monitor, s: Session): Promise<DayResult>;   // /days/{facility}.json
  getTimes(m: Monitor, date: string, facilityId: string, s: Session): Promise<TimeResult>;
  reschedule(t: BookingTarget, s: Session): Promise<BookingResult>; // replaces the appointment
}
```

The scheduler, notifications and safety code don't depend on usvisa-info details, so if the
appointment system is replaced, only the adapter has to be rewritten.

## 6. Auto-book checks

`packages/shared/src/interlocks.ts` refuses to book unless every check passes:

- the kill switch is off and fewer than `perDayCap` (default 2) bookings were made in the last 24 h;
- the consulate is on your allow-list;
- you have an existing appointment on record and the new date is earlier by at least
  `minImprovementDays` (default 7); it never books a first appointment unattended;
- the first `confirmFirstN` bookings (default 1) still go through you, even in `auto` mode;
- in dry-run mode it only logs what it would have done.

If the site's response to the reschedule POST is unclear, the attempt is marked failed and you are
asked to check by hand. In the extension, an in-flight lock and a short idempotency window stop a
double-clicked alert from submitting the same booking twice.

## 7. Notifications

Channels in `packages/notify`: Bark (iOS), ServerChan (WeChat), Telegram and a generic webhook
(WeCom, Discord, Slack, your own relay); the extension adds browser notifications. Bark and
ServerChan work from mainland China without a proxy; Telegram does not. Every alert goes to all
configured channels, so one dead channel can't swallow it. The extension also sends a daily heartbeat while monitors are running, so silence means
"no slots", not "the extension died".

The extension only has host permission for the visa site at install. The notification services and
the control plane are optional host permissions that the options page asks for when you test or
save them; without that access the worker's JSON POSTs would be blocked by CORS.

## 8. Control plane data

SQLite, single user (`apps/control-plane/src/db.ts`):

- `observation(monitor_id, facility_id, date, observed_at)`: every date a monitor reported. The
  heatmap counts sightings per weekday × hour, and the first time each (consulate, date) pair was
  seen is treated as the moment it was released. Ranking hours by releases gives the "best hour to
  check".
- `event_log(kind, payload_json, created_at)`: relay history, without channel secrets.

There is no table for sessions or passwords.

## 9. Out of scope

- A hosted service that stores other people's visa credentials.
- CAPTCHA solving, proxy rotation, fingerprint spoofing or any other detection evasion.
- Polling the visa site from a cloud IP.
- Filling in the DS-160 (a different system).
- Promising that you will get a slot.

## 10. Stack

TypeScript throughout, pnpm workspace. Extension: Manifest V3, vanilla TypeScript, Vite with
`@crxjs/vite-plugin`. Agent: Node 20+. Control plane: Fastify and `better-sqlite3` (the Dockerfile
installs the build tools for the native addon). Web: Next.js 15 on Vercel. Tests: Vitest.
