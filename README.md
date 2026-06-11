<div align="center">

<img src="./assets/banner.gif" alt="VisaLark — open-source US visa appointment monitor" width="100%" />

# VisaLark · 签证云雀

**English** · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [中文](./README.zh.md)

**Open-source, account-safe US visa appointment monitor. Zero stored credentials. Zero evasion. No proxy arms race.**

[![tests](https://img.shields.io/badge/tests-101%20passing-2fae6a)]() [![license](https://img.shields.io/badge/license-Apache--2.0-6b8cff)](./LICENSE) [![made with](https://img.shields.io/badge/TypeScript-strict-3178c6)]()

[Features](#-features) · [How it protects your account](#%EF%B8%8F-how-it-protects-your-account) · [Install](#-install) · [vs. qmq](#-honest-comparison) · [Disclaimer](#%EF%B8%8F-disclaimer)

</div>

---

## What is this

VisaLark monitors <strong>your own</strong> visa-appointment availability on `ais.usvisa-info.com` (CGI Federal). When a slot matches your filters it <strong>pushes instantly</strong> to WeChat / iOS / Telegram, and optionally lets you <strong>reschedule with one tap</strong> or <strong>reschedule automatically</strong> behind strict safety interlocks.

It is <strong>honest</strong> about what it can and can't do:

- ✅ Catches slots you'd otherwise miss — especially less-crowded consulates, any-earlier dates, and expedite/emergency openings.
- ✅ Watches multiple consulates at once and takes the earliest slot among the cities you'll accept.
- ✅ Account-safety first: reuses the session already logged into your browser. Never stores passwords, never spoofs fingerprints, never bypasses CAPTCHAs.
- ❌ Does <strong>not</strong> promise to "grab in seconds" the hottest slots. Those vanish in 30 seconds and can only be won with paid residential-proxy clusters — the arms race that has qmq burning huge sums monthly, forced to charge, and that gets accounts banned and repos taken down. <strong>We don't fight that war.</strong>

> Why is it built this way? See [How it protects your account](#%EF%B8%8F-how-it-protects-your-account). The full threat model is in [DESIGN.md](./DESIGN.md).

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎯 **Earliest slot across consulates** | One monitor watches multiple consulates and auto-picks the earliest date matching your filters |
| 🔔 **One-tap confirm** | The push includes a button — tap it to reschedule in <1s using your warm logged-in session (human-in-the-loop, compliant) |
| 🤖 **Auto-reschedule (optional)** | Off by default. When on, guarded by multiple interlocks: only-earlier slots, allowlisted consulates only, first N need manual confirm, daily cap, kill switch, dry-run mode |
| 📅 **Date / weekday / time-of-day filters** | Alerts only within windows you'll actually accept — no noise |
| 📡 **Multi-channel notifications** | Bark (iOS) · ServerChan (WeChat) · Telegram · Webhook (WeCom/Discord) · native browser. High-priority fires all channels at once |
| 🚑 **Expedite/emergency monitoring** | Watches the expedite calendar for urgent travel |
| 🔑 **Session health checks** | Session expired / challenge hit → stops immediately and asks you to re-sync. Never forces through |
| 📊 **Availability history + heatmap** | An optional control panel records availability history and learns "which time windows release slots most often" |

## 🛡️ How it protects your account

The US visa system runs <strong>per-user behavioral ML</strong> + Cloudflare + reCAPTCHA. The most lethal ban signal is <strong>not</strong> polling frequency — it's an <strong>ASN / impossible-travel mismatch</strong>:

> You log in from a residential network, but the same session then hits `/days/*.json` from a US datacenter IP — that's a textbook "account-takeover / automation" signature and will <strong>get your real visa account banned fast</strong> (slow appeals, missed trips, forfeited visa fees).

So VisaLark uses a <strong>two-plane architecture</strong>:

```
┌─── Your residential network (data plane: the only part touching the visa site) ───┐
│  Browser extension (recommended, beginner-friendly)  or  local Agent (24x7 geek)  │
│  → reuses your real login session, residential IP, real browser fingerprint        │
│  → zero password storage, zero CAPTCHA solving, zero proxies                       │
└──────────────────────────────────────────┬───────────────────────────────────────┘
                                           │ (optional) report availability history / relay notifications
                                           ▼
┌──────── Control panel (never touches the visa site, zero credentials) ────────┐
│  Vercel landing/docs/demo   +   free server (Oracle Free) running              │
│  history / heatmap / notification relay                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

Three <strong>hard rules</strong> (written into the code, guarded by tests):

1. **Data plane runs on residential IP only** — the Agent checks its egress IP and refuses to start by default if it detects a datacenter ASN.
2. **Zero evasion code** — no proxy rotation, no TLS spoofing, no CAPTCHA solving. This is both the <strong>legal shield</strong> and the <strong>account shield</strong>.
3. **Fail-stop** — on a challenge / 401 / 1015, stop immediately and alert a human. Never force through.

## 📦 Install

### Option A: Browser extension (recommended, for most people)

1. Download the extension from [Releases](https://github.com/appleweiping/visa-lark/releases), or build it yourself:
   ```bash
   pnpm install && pnpm --filter @visa-lark/extension build
   # dist is at apps/extension/dist — Chrome/Edge → Extensions → Load unpacked
   ```
2. Log into `ais.usvisa-info.com` <strong>in your own browser</strong> and open the appointment/reschedule page.
3. Click the extension icon → "Sync current session" (auto-reads consulate and schedule id — no manual entry).
4. Add a monitor (consulate, visa type, date range, mode) and notification channels in Settings.
5. Done. The extension checks on a jittered schedule in the background using your session and pushes when a slot appears.

### Option B: Local Agent (for geeks — 24x7 without keeping a browser open)

```bash
pnpm install && pnpm --filter @visa-lark/agent build
cp apps/agent/visalark.config.example.json apps/agent/visalark.config.json
# Edit: paste the _yatri_session cookie exported from your logged-in browser + consulate + schedule id + channels
node apps/agent/dist/index.js apps/agent/visalark.config.json
```

> ⚠️ Run it on <strong>your home network</strong> (home PC / Raspberry Pi). Do <strong>not</strong> run it on a cloud server — see the safety model above. The Agent auto-detects and refuses to start on a datacenter IP.

### Optional: control panel (history / heatmap / notification relay, zero credentials)

Deploy on a free [Oracle Cloud Always Free](https://www.oracle.com/cloud/free/) VM; the landing/docs deploy on Vercel. See [apps/control-plane/README](./apps/control-plane) and [DESIGN.md](./DESIGN.md).

## 🤝 Honest comparison

| | **VisaLark** | qmq.app | OSS visa_rescheduler forks |
|--|--|--|--|
| Open source | ✅ Apache-2.0 | ❌ Closed | ✅ |
| Price | Free | Paid VIP | Free |
| Account safety | ✅ Residential IP + reuse real session | ⚠️ Proxy clusters, may rate-limit / trip risk controls | ⚠️ Often run in datacenters, ban risk |
| Stores your password | ❌ Never | ? | ⚠️ Often plaintext |
| CAPTCHA/proxy evasion | ❌ Zero evasion | ✅ Burns money on the arms race | ⚠️ Partial |
| China-reachable notifications | ✅ WeChat/Bark | ⚠️ Telegram only | ⚠️ Mostly Telegram/email |
| Grabbing the hottest flash slots | ❌ Doesn't promise (honest) | ✅ Headline (via proxy clusters) | ❌ |
| Multi-channel + one-tap confirm + interlocks | ✅ | Partial | ❌ |

<strong>In one line</strong>: if you want "any earlier slot / less-crowded consulates / expedite slots," VisaLark is free, open-source, and won't get you banned. If you insist on the 30-second flash slots, no responsible self-hosted tool can win that war — that's fought by paid operators carrying the ban risk. We won't lie to you about it.

## 🧩 Monorepo

```
packages/shared              # Adapter-agnostic core: types + engine + safety + interlocks + notify interface (36 tests)
packages/adapter-usvisa-info # The only code that touches usvisa-info: endpoints/parsing/reschedule/fail-stop (16 tests)
packages/notify              # Bark / ServerChan / Telegram / Webhook channels (5 tests)
apps/extension               # MV3 browser extension (primary data plane, beginner-friendly; 15 tests)
apps/agent                   # Local Node Agent (geek data plane, residential-IP guarded; 7 tests)
apps/control-plane           # Fastify + better-sqlite3 control panel (zero credentials, 22 tests)
apps/web                     # Next.js landing/docs/demo (deployed on Vercel)
```

## ⚖️ Disclaimer

VisaLark is an open-source tool for <strong>education and personal use</strong>, <strong>not affiliated with CGI Federal or the U.S. Department of State</strong>.

- Using this tool to access the visa system <strong>may violate its Terms of Service</strong>, and automated access <strong>may get your visa account restricted or banned</strong>. <strong>You assume all account and legal risk.</strong>
- This project contains <strong>no CAPTCHA-bypass / anti-bot-evasion / proxy</strong> code, and <strong>explicitly forbids</strong> multi-tenant hosting (it never holds anyone's visa credentials).
- This project provides <strong>no</strong> hosted service and promises <strong>no</strong> appointment will be secured.
- This is not legal advice. Consult a lawyer before any commercial or hosted use.
- `auto` reschedule is a destructive operation (it replaces your existing appointment), off by default — understand all interlocks before enabling it.
- **Reschedule/booking is experimental**: the usvisa-info reschedule form fields and confirmation flow are not fully verified against real accounts; when the result is unclear the tool marks it `failed` and asks you to <strong>verify manually</strong> — it never fakes success. Monitoring/notifications are the core, most reliable parts; validate auto/one-tap reschedule with <strong>dry-run mode</strong> first.

Licensed under [Apache-2.0](./LICENSE). No warranty.

---

<div align="center">
<sub>Built with 🐦 by the VisaLark contributors · account safety > grabbing speed</sub>
</div>
