# VisaLark (签证云雀) — Design & Threat Model

> An open-source US visa appointment **monitor + assisted booking** tool.
> Honest positioning: improves your odds of catching slots you'd otherwise miss.
> It does **not** promise to win the sub-30-second arms race for the hottest slots —
> that race is won only by paid residential-proxy IP fleets, which get accounts banned
> and repos taken down. We refuse to play it. See [Non-Goals](#non-goals).

Status: **active build**. Date: 2026-06-09.

---

## 1. The one finding that shapes everything

The US visa system (`ais.usvisa-info.com`, CGI Federal) runs **per-customer behavioral ML**
plus **Cloudflare** (Turnstile/challenge + rate-limit `Error 1015`) and **reCAPTCHA** on forms.

The lethal signal is **not** poll cadence — it's **ASN / impossible-travel mismatch**:
if a user logs in from a Chinese residential ISP and then the *same session* starts hitting
`/days/*.json` from an Oracle/AWS datacenter ASN, that is a textbook account-takeover /
automation signature → fast **suspension of the user's real visa account** (slow appeal,
may miss travel window, may waste the MRV fee).

**Therefore: the code that talks to usvisa-info MUST run on the user's own residential
connection and reuse the user's own real browser session. It cannot run on a cloud server.**

This is why qmq.app spends >¥100k/mo on residential proxy fleets and had to go paid VIP.
We do not compete on that axis. We win on **safety, transparency, multi-consulate breadth,
release-pattern intelligence, and zero-credential privacy** instead.

## 2. Two-plane architecture

```
┌───────────────────────── USER'S RESIDENTIAL NETWORK ──────────────────────────┐
│  DATA PLANE  (touches usvisa-info, holds NO stored password, residential IP)   │
│                                                                                │
│   ┌────────────────────────┐         ┌────────────────────────────────────┐   │
│   │ Browser Extension (MV3) │  OR     │ Local Agent (Node/Docker)          │   │
│   │ — primary, non-tech     │         │ — power users, 24x7, headless box  │   │
│   │ reuses the logged-in    │         │ cookie-only (user pastes/exports)  │   │
│   │ session in the user's   │         │ runs on home PC / Raspberry Pi     │   │
│   │ own Chrome/Edge tab      │         │                                    │   │
│   └───────────┬────────────┘         └──────────────┬─────────────────────┘   │
│               │  same Adapter + Notify + Scheduler + Safety core              │
└───────────────┼─────────────────────────────────────┼─────────────────────────┘
                │ (optional, opt-in) push availability history / events
                ▼                                       ▼
┌───────────────────────────── CONTROL PLANE ────────────────────────────────────┐
│  Holds ZERO visa credentials. Never touches usvisa-info.                        │
│                                                                                 │
│   apps/web  (Next.js → Vercel)        apps/control-plane (Fastify + SQLite)     │
│   landing / docs / live mock demo /   optional cross-device dashboard,          │
│   dashboard SPA                       availability history + heatmap,           │
│                                       notification relay (Oracle Free VM)       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

- **Data plane** is the only thing that ever sees usvisa-info or a session cookie. It runs
  where the user logged in. Default = **no stored password** (cookie/session reuse only).
- **Control plane** is pure convenience: a place to see history across devices and relay
  notifications. It is optional, it holds no visa credentials, and it never polls the visa site.
  This is where the "free server (Oracle Cloud Always Free)" + Vercel legitimately live.

## 3. Hard design laws (non-negotiable, enforced in code + review)

1. **Residential-IP only for the data plane.** No polling from cloud ASNs. The agent refuses
   to run if it detects a known datacenter ASN, with a loud warning (best-effort heuristic).
2. **Zero evasion code.** No proxy rotation, no stealth-patching, no CAPTCHA solvers, no
   TLS-impersonation to defeat Cloudflare. This is simultaneously the **legal shield** and the
   **account shield**. Reuse the real browser's own session/fingerprint instead of faking one.
3. **Cookie-only by default.** No stored visa password. If auto-relogin is offered, it's an
   advanced opt-in: key derived from a user passphrase via Argon2id, held **in memory only**,
   never persisted; logs scrubbed of all credential/cookie material; telemetry OFF.
4. **Fail-safe, never fail-through.** Any Turnstile / 401 / 403 / 1015 / challenge →
   **STOP and notify the human**. Never retry-through a challenge. Never hammer a dead session.
5. **Auto-book is OFF by default**, behind strict interlocks (§6). One-tap-confirm is the
   headline. Reschedule is destructive — treat it like surgery.
6. **Single-tenant only. Multi-tenant hosted credential storage is FORBIDDEN** (see Non-Goals).
7. **Conservative, jittered polling** with backoff + daily cap. Cadence is *secondary* safety
   (IP is primary), but still: randomized 90–300 s, exponential backoff, hours-long cooldown
   on any challenge, global daily request cap.

## 4. Booking modes (user picks per-monitor)

| Mode | What happens | Default | Risk |
|------|--------------|---------|------|
| `notify` | Slot found → push only. Human books manually. | — | Lowest |
| `confirm` | Slot found → push w/ one-tap button → backend books in <1s using warm session. **Human-in-loop.** | **Yes (headline)** | Low |
| `auto` | Unattended auto-reschedule when interlocks pass. | **OFF** | High |

## 5. Adapter interface (pluggable — usvisa-info is already deprecating toward mytravel.state.gov)

```ts
interface VisaAdapter {
  id: string;                                   // 'usvisa-info'
  validateSession(s: Session): Promise<SessionHealth>;
  getAvailableDays(m: Monitor, s: Session): Promise<DayResult>;   // /days/{facility}.json
  getTimes(m: Monitor, date: string, s: Session): Promise<TimeResult>;
  reschedule(b: BookingTarget, s: Session): Promise<BookingResult>; // destructive
}
```
The scheduler, notifier, dashboard, and safety layer are **adapter-agnostic**. usvisa-info is
treated as already-deprecating; budget for a `mytravel.state.gov` port. Invest minimally in
usvisa-info DOM specifics.

## 6. Auto-book interlocks (when `auto` is enabled)

- **Strictly-better-only**: book iff `newDate < currentDate` (configurable min-improvement, e.g.
  ≥7 days earlier) **AND** facility ∈ user allowlist **AND** matches date/DoW/time filters.
- **Never relinquish blind**: usvisa-info reschedule replaces the existing appointment; require
  explicit confirmation for the first N bookings even in auto mode (`confirmFirstN`, default 1).
- **Idempotency lock**: prevent double-submit / double-booking.
- **Per-day booking cap** + **global kill-switch** + **dry-run mode**.

## 7. Notification channels (大陆-first, multi-channel, redundant)

Pluggable `NotifyChannel`. Ship: **Bark (iOS)**, **ServerChan/WeChat (Server酱)**, **Telegram**,
**Email (SMTP)**. China-reliable path (Bark/ServerChan) is required, Telegram is the
海外/技术 option. High-priority slot events fan out to all configured channels. Heartbeat so
**silence ≠ "no slots"** (the user knows the monitor is alive).

## 8. Data model (SQLite, single-tenant)

`account` (email, embassy_code, schedule_id, current_appt_date, current_facility_id — **password
NOT stored by default**) · `session` (yatri_session_cookie_enc, authenticity_token, acquired_at,
status) · `facility` (seed) · `monitor` (facility_ids[], visa_type, date_min/max, dow_filter,
tod_filter, expedite, mode, poll_profile, enabled) · `slot_observation` (time-series → heatmap /
release-pattern model — the moat) · `poll_log` (status, latency, next_backoff — ban-safety
analytics + scheduler state) · `booking_attempt` (status, interlock results) · `notification` ·
`settings` (channel configs, dashboard token, poll_global_min_interval).

## 9. 顶级 differentiators (vs qmq + OSS forks), ranked

MVP: one-tap-confirm · **multi-consulate "earliest across my acceptable cities"** · notify breadth
(Bark/ServerChan/TG/email) · date-range + DoW + time-of-day filters · session-health + re-login alert.
v1: **release-pattern learning** ("best time to check" from your own poll history — raises hit-rate
AND lowers total polls = aligns safety with effectiveness) · calendar heatmap + earliest-available
trend · expedite/emergency watch (`expedite=true`) · interview-waiver/dropbox detection.
Later: multi-account · group/family same-day · FIFA-2026 surge preset.

## 10. Non-Goals (explicit, in README too)

- ❌ No hosted multi-tenant service holding users' visa credentials (credential honeypot,
  mass-automation CFAA/ToS target, PIPL/GDPR controller liability).
- ❌ No CAPTCHA solving, no proxy rotation, no anti-fingerprinting / stealth, no detection evasion.
- ❌ No "guaranteed grab" / "秒级抢到" marketing. We say what's true: odds improvement.
- ❌ No cloud-IP polling of usvisa-info.
- ❌ No DS-160 form filling (different system, scope creep).

## 11. Stack

TypeScript everywhere. pnpm monorepo. Extension = MV3 (vanilla TS + Vite). Local agent = Node.
Control plane = Fastify + `node:sqlite` (Node's built-in DatabaseSync; no native build). Web = Next.js (Vercel). Shared core (`packages/*`) is
reused by both extension and agent so the safety/adapter/notify logic has **one** implementation.

## 12. Legal posture (protects the maintainer)

Monitor-first headline · educational/personal-use · "not affiliated with CGI Federal or the US
Dept of State" · accept-all-account-ban-and-legal-risk · no warranty · permissive license w/
liability disclaimer · **no evasion code in the repo** (the single strongest legal shield) ·
no hosted service · no monetization framing as a "grabber". This is not legal advice; consult a
lawyer before any monetization or hosted offering.
