# VisaLark Browser Extension (data plane)

The browser extension is the **primary data plane** of VisaLark — the recommended way for most
people to run the monitor. It lives inside *your own* browser, next to the visa-site session you
opened yourself, and that is precisely what makes it account-safe.

It monitors appointment availability on `ais.usvisa-info.com` for the consulates you pick, and
pushes an alert (Bark / ServerChan / Telegram / Webhook / native browser notification) the moment a
slot matches your filters. Optionally, the push includes a **one-tap confirm** deep link that opens
the extension's confirm page so *you* approve the reschedule — human-in-the-loop, on your warm
logged-in session.

It does **not** promise to "grab" the hottest slots in seconds, and it contains **zero** evasion
code. See the [root README](../../README.md) and [DESIGN.md](../../DESIGN.md) for the honest
trade-off and the full threat model.

## MV3 architecture

```
┌──────────────────────────── Chrome / Edge (your browser) ────────────────────────────┐
│                                                                                       │
│  background service worker (src/background/index.ts)                                  │
│    · drives the monitor engine on a jittered chrome.alarms schedule                   │
│    · MV3 workers are ephemeral → ALL state (backoff, schedule, budget, logs)          │
│      persists in chrome.storage and is reloaded on every wake, so a worker            │
│      eviction can never reset a cooldown                                              │
│    · fail-stop: CAPTCHA / 401 / 403 / 1015 → stop and notify, never retry-through     │
│                                                                                       │
│  popup (popup.html · src/ui/popup.ts)                                                 │
│    · quick status, session health badge, recent activity                              │
│    · "Sync session": reads embassy code + schedule id from the active                 │
│      usvisa-info tab's URL — nothing to type, nothing to paste                        │
│                                                                                       │
│  options (options.html · src/ui/options.ts)                                           │
│    · monitors (consulates, visa type, date range, weekday filter, mode)               │
│    · notification channels, poll profile, kill switch                                 │
│                                                                                       │
│  confirm (confirm.html · src/ui/confirm.ts)                                           │
│    · one-tap confirm page opened from a slot-found notification                       │
│    · books via the background worker on your warm session — the control               │
│      plane never sees a credential and cannot book                                    │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

Shared logic (poll profiles, backoff, monitor engine, notification fan-out) comes from the
workspace packages `@visa-lark/shared`, `@visa-lark/adapter-usvisa-info` and `@visa-lark/notify`.
The money-path guards (confirm guard, global daily budget, booking idempotency) are pure functions
in `src/lib/guards.ts` with unit tests — the worker is a thin wrapper over them.

## Permissions, and why each one exists

| Permission | Why |
|---|---|
| `host_permissions: https://ais.usvisa-info.com/*` | The **only** host the extension can talk to. Least privilege: no `<all_urls>`, no analytics endpoints, nothing else. |
| `storage` | Persists monitors, schedule state, backoff and logs across the ephemeral MV3 worker lifecycle. |
| `alarms` | The jittered polling schedule. MV3 workers can't hold timers, so `chrome.alarms` is the scheduler. |
| `notifications` | Native browser notifications as one of the alert channels. |

No `tabs` content reading, no `cookies` permission, no content scripts injected into the visa site.
The popup only parses the *URL* of the active tab (embassy code + schedule id) when you click
"Sync session".

## How it stays account-safe

1. **Your IP, your fingerprint, your cookies.** Requests are sent by your own browser from your
   residential connection, with the session cookie the browser already holds. We never read or
   export the cookie (`cookie: "(browser-managed)"` — the browser attaches it itself), never store
   your password, never automate login.
2. **No evasion, ever.** No proxy rotation, no fingerprint spoofing, no CAPTCHA solving, no TLS
   impersonation. On a challenge or 401/403/1015 the worker stops and tells you.
3. **Budgeted, jittered polling.** Conservative poll profiles with randomized jitter and a global
   account-wide daily request ceiling, enforced even across worker restarts.
4. **Destructive actions are human-gated.** Rescheduling is opt-in, guarded (only-earlier dates,
   confirm-first-N, daily cap, kill switch), and the one-tap confirm flow always shows you what it
   is about to do before it does it.

## Build

From the repository root (pnpm ≥ 9, Node ≥ 20):

```bash
corepack pnpm install
corepack pnpm --filter @visa-lark/extension build   # vite + @crxjs/vite-plugin
# output: apps/extension/dist
```

For development with hot reload:

```bash
corepack pnpm --filter @visa-lark/extension dev
```

Tests and types:

```bash
corepack pnpm --filter @visa-lark/extension test       # vitest (guards, URL parsing, manifest)
corepack pnpm --filter @visa-lark/extension typecheck
```

## Load unpacked (Chrome / Edge)

1. Build as above (or download a packaged build from
   [Releases](https://github.com/appleweiping/visa-lark/releases)).
2. Open `chrome://extensions` (Edge: `edge://extensions`).
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `apps/extension/dist` folder.
5. Log into `ais.usvisa-info.com` yourself and open your appointment/reschedule page.
6. Click the VisaLark icon → **Sync current session**, then add a monitor in Settings.

That's it — the extension polls quietly in the background and pushes when a slot appears.

---

## 中文快速上手

1. 构建：仓库根目录执行 `corepack pnpm install && corepack pnpm --filter @visa-lark/extension build`，
   产物在 `apps/extension/dist`（也可直接从 Releases 下载）。
2. 打开 `chrome://extensions`，开启「开发者模式」，点「加载已解压的扩展程序」，选择 `dist` 目录。
3. **自己**登录 `ais.usvisa-info.com`，打开预约/改签页面。
4. 点击扩展图标 →「同步当前会话」（自动从标签页 URL 读取领馆与 schedule id，无需手填）。
5. 在设置页添加监控（领馆、签证类型、日期范围、模式）和通知渠道（Bark / Server酱 / Telegram）。

安全要点：扩展只在你自己的浏览器里、用你自己的住宅 IP 和已登录会话工作；不存密码、不读 Cookie、
零绕过代码；遇到验证码 / 401 / 403 / 1015 一律停止并通知你。改签默认关闭，开启后也有
「只许更早、前 N 次人工确认、每日上限、紧急停止」多重保险。风险自负，详见根目录 README 的免责声明。
