# VisaLark browser extension

The browser extension is the recommended way to run VisaLark. It runs inside your own browser,
next to the visa-site session you opened yourself, so its requests come from your network with
your cookies. That keeps the risk to your account lower than a cloud script would, but it does not
remove it: the site can still restrict accounts it considers automated.

It monitors appointment availability on `ais.usvisa-info.com` for the consulates you pick, and
pushes an alert (Bark / ServerChan / Telegram / Webhook / native browser notification) the moment a
slot matches your filters. Optionally, the push includes a **one-tap confirm** deep link that opens
the extension's confirm page so *you* approve the reschedule — human-in-the-loop, on your warm
logged-in session.

It will not "grab" the most contested slots within seconds, and it has no code for proxies,
fingerprint spoofing or CAPTCHA solving. See the [root README](../../README.md) and
[DESIGN.md](../../DESIGN.md) for the trade-off and the threat model.

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
The checks that run before a reschedule or a request (confirm-page check, account-wide daily
request cap, no double booking) are pure functions in `src/lib/guards.ts` with unit tests; the
worker calls them.

## Permissions, and why each one exists

| Permission | Why |
|---|---|
| `host_permissions: https://ais.usvisa-info.com/*` | The visa site, granted at install. |
| `optional_host_permissions: https://*/*, http://*/*` | Nothing is granted at install. When you click **发送测试通知 / send test** (or save a control-plane URL) the options page asks for exactly the hosts you configured: `api.day.app` (or your own Bark server), `sctapi.ftqq.com`, `api.telegram.org`, your webhook's host, your control plane. Without this the worker's requests to those services are cross-origin, and the JSON POSTs (Telegram, webhooks, control plane) would be blocked by CORS. |
| `storage` | Persists monitors, schedule state, backoff and logs across the ephemeral MV3 worker lifecycle. |
| `alarms` | The jittered polling schedule. MV3 workers can't hold timers, so `chrome.alarms` is the scheduler. |
| `notifications` | Native browser notifications as one of the alert channels. |

The test button sends a real test message through every configured channel and shows, per
channel, whether it was delivered, so you can check the setup before relying on it.

No `tabs` content reading, no `cookies` permission, no content scripts injected into the visa site.
The popup only parses the *URL* of the active tab (embassy code + schedule id) when you click
"Sync session".

## How it limits risk to your account

1. **Your IP, your fingerprint, your cookies.** Requests are sent by your own browser from your
   residential connection, with the session cookie the browser already holds. The extension never
   reads or exports the cookie (`cookie: "(browser-managed)"` — the browser attaches it itself),
   never stores your password and never automates login.
2. **No evasion code.** No proxy rotation, no fingerprint spoofing, no CAPTCHA solving, no TLS
   impersonation. On a challenge or 401/403/1015 the worker stops or backs off and tells you.
3. **Budgeted, jittered polling.** Conservative poll profiles with randomized jitter and a global
   account-wide daily request ceiling, enforced even across worker restarts.
4. **Destructive actions are human-gated.** Rescheduling is opt-in, guarded (only-earlier dates,
   confirm-first-N, daily cap, kill switch), and the one-tap confirm flow always shows you what it
   is about to do before it does it.

## Build

From the repository root (pnpm ≥ 9, Node ≥ 20):

```bash
corepack pnpm install
corepack pnpm build:packages                          # the extension imports the built workspace packages
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

1. Build as above, or download `visalark-extension-<version>.zip` from the
   [latest release](https://github.com/appleweiping/visa-lark/releases/latest) and unzip it.
2. Open `chrome://extensions` (Edge: `edge://extensions`).
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select `apps/extension/dist` if you built it, or the unzipped
   folder if you downloaded the release (the folder that contains `manifest.json`).
5. Log into `ais.usvisa-info.com` yourself and open your appointment/reschedule page.
6. Click the VisaLark icon → **Sync current session**, then add a monitor in Settings.
7. Add your notification channels and click **发送测试通知 / send test**; allow the host access
   prompt so the alerts can leave the browser.

The extension then checks in the background and pushes an alert when a matching date appears.

---

## 中文快速上手

1. 构建：仓库根目录执行 `corepack pnpm install && corepack pnpm build:packages && corepack pnpm --filter @visa-lark/extension build`，
   产物在 `apps/extension/dist`；也可以从 [最新 Release](https://github.com/appleweiping/visa-lark/releases/latest) 下载 zip 并解压。
2. 打开 `chrome://extensions`，开启「开发者模式」，点「加载已解压的扩展程序」，选择 `apps/extension/dist`
   （自己构建时）或解压出来的文件夹（下载 Release 时，即包含 `manifest.json` 的那一层）。
3. **自己**登录 `ais.usvisa-info.com`，打开预约/改签页面。
4. 点击扩展图标 →「同步当前会话」（自动从标签页 URL 读取领馆与 schedule id，无需手填）。
5. 在设置页添加监控（领馆、签证类型、日期范围、模式）和通知渠道（Bark / Server酱 / Telegram）。
6. 点「发送测试通知」，浏览器询问是否允许访问这些推送服务的域名时选「允许」，然后看每个渠道是否送达。

安全要点：扩展只在你自己的浏览器里、用你自己的住宅 IP 和已登录会话工作；不存密码、不读 Cookie、
没有代理和破解验证码的代码；遇到验证码 / 401 / 403 / 1015 会停止或退避并通知你。这能降低账号风险，
但不能消除，网站仍可能限制它认为是自动化的账号。改签默认关闭，开启后也有
「只许更早、前 N 次人工确认、每日上限、紧急停止」多重保险。风险自负，详见根目录 README 的免责声明。
