# VisaLark Local Agent (data plane, 24×7)

The local agent is the **power-user data plane**: the same monitor engine as the browser extension,
packaged as a headless Node process you run 24×7 on **your own residential machine** (home PC,
NAS, Raspberry Pi). Use it when you don't want to keep a browser open.

Same safety laws as the extension: cookie-only session reuse, zero stored passwords, zero evasion
code, fail-stop on any challenge. Plus one extra interlock the extension doesn't need: a
**residential-IP guard** that refuses to start on cloud infrastructure (see below).

> ⚠️ Run it on your **home network**. Never on a cloud VM. Polling `ais.usvisa-info.com` from a
> datacenter ASN while you logged in from home is the textbook impossible-travel signature that
> gets real visa accounts suspended. The whole point of this tool is to not do that.

## Quick start

```bash
# from the repository root (pnpm ≥ 9, Node ≥ 20)
corepack pnpm install
corepack pnpm --filter @visa-lark/agent build

cp apps/agent/visalark.config.example.json apps/agent/visalark.config.json
# edit the config (see below), then:
node apps/agent/dist/index.js apps/agent/visalark.config.json
# or: VISALARK_CONFIG=./visalark.config.json node apps/agent/dist/index.js
```

The session cookie comes from your own logged-in browser: log into `ais.usvisa-info.com`, open
DevTools → Application → Cookies, and copy the `_yatri_session` value into the config. When the
session expires the agent **stops and notifies you** to re-sync — it never logs in for you, because
it never has your password.

## visalark.config.json

```jsonc
{
  "session": {
    "cookie": "_yatri_session=PASTE_FROM_YOUR_LOGGED_IN_BROWSER",
    "embassyCode": "en-cn",          // locale path segment, e.g. en-cn / en-hk / en-jp
    "scheduleId": "0000000",         // from your appointment URL
    "userAgent": "Mozilla/5.0 ..."   // match your real browser's UA
  },
  "currentAppointment": { "date": "2026-12-01", "facilityId": "95" },
  "monitors": [
    {
      "id": "beijing-b1b2",
      "label": "北京 B1/B2 早于12月",
      "facilityIds": ["95", "98"],   // Beijing + Shanghai — earliest across both
      "visaType": "B1/B2",
      "dateMax": "2026-12-01",       // only alert for dates earlier than this
      "dowFilter": [],               // e.g. [1,2,3,4,5] = weekdays only
      "expedite": false,
      "mode": "notify",              // notify | auto  (confirm is extension-only,
                                     // the agent downgrades it to notify)
      "pollProfile": "patient",      // conservative, jittered cadence
      "enabled": true
    }
  ],
  "channels": [
    { "type": "bark", "key": "YOUR_BARK_KEY" },
    { "type": "serverchan", "sendKey": "YOUR_SERVERCHAN_SENDKEY" }
  ],
  "autoBook": {                      // only used when mode = "auto"
    "minImprovementDays": 7,         // must be ≥ 7 days earlier to act
    "allowedFacilityIds": ["95"],    // allowlist — auto-book nowhere else
    "confirmFirstN": 1,              // first N bookings still need a human
    "perDayCap": 2,                  // hard daily booking cap
    "killSwitch": false,             // flip true to freeze all booking instantly
    "dryRun": false                  // true = log what it WOULD do, touch nothing
  },
  "allowDatacenterIp": false,        // leave false. Really.
  "stateFile": "./visalark.state.json"
}
```

## The IP guard

On startup the agent checks its egress IP's organization/ASN (via ipinfo.io with a fallback
provider, best-effort). If it looks like **datacenter / cloud infrastructure, the agent refuses to
start** (exit code 2) unless you explicitly set `allowDatacenterIp: true` — which is documented as
a bad idea, because a cloud ASN that doesn't match your login location is the #1 account-ban
vector. If the lookup fails entirely the agent proceeds with a warning; the guard is an honest
heuristic, not a guarantee, so keep yourself on a residential connection regardless.

## Safety interlocks (summary)

- **Residential-IP guard** — refuses to start on detected cloud ASNs by default.
- **Cookie-only, zero credentials** — no password ever touches disk or the network.
- **Fail-stop** — CAPTCHA / 401 / 403 / 1015 → stop the monitor, alert a human, never force through.
- **Conservative polling** — jittered profiles with daily request budgets, persisted across restarts
  in `stateFile` so a restart can't reset a cooldown.
- **Auto-book is opt-in and fenced** — strictly-earlier-only (`minImprovementDays`), facility
  allowlist, confirm-first-N, per-day cap, kill switch, dry-run mode.
- **No proxy support at all** — there is nothing to configure; the arms race is out of scope.

## Docker (optional)

A `Dockerfile` is provided for tidy 24×7 runs **on a home box** (the same residential-IP rule
applies — a container on a cloud VM is still a cloud VM, and the IP guard will refuse it):

```bash
docker build -f apps/agent/Dockerfile -t visalark-agent .
docker run -v $PWD/apps/agent/visalark.config.json:/app/apps/agent/visalark.config.json visalark-agent
```

Mount the state file too if you want budgets/cooldowns to survive container recreation.

## Development

```bash
corepack pnpm --filter @visa-lark/agent dev        # tsx watch
corepack pnpm --filter @visa-lark/agent test       # vitest (config validation etc.)
corepack pnpm --filter @visa-lark/agent typecheck
```

---

## 中文快速上手

1. 仓库根目录：`corepack pnpm install && corepack pnpm --filter @visa-lark/agent build`。
2. `cp apps/agent/visalark.config.example.json apps/agent/visalark.config.json`，然后编辑：
   从你**自己登录**的浏览器里复制 `_yatri_session` Cookie，填入领馆代码（如 `en-cn`）、
   schedule id、现有预约信息和通知渠道（Bark / Server酱）。
3. 启动：`node apps/agent/dist/index.js apps/agent/visalark.config.json`。

务必跑在**自己家的网络**上（家用电脑 / 树莓派），不要放云服务器——Agent 启动时会检测出口 IP，
发现是数据中心 ASN 会直接拒绝启动（这是在保护你的签证账号，不要用 `allowDatacenterIp` 强行绕过）。
会话过期时 Agent 会停下来通知你重新同步 Cookie，绝不替你登录。自动改签默认关闭，开启后受
「至少提前 N 天、领馆白名单、前 N 次人工确认、每日上限、紧急停止、试运行」多重保险约束。
风险自负，详见根目录 README 的免责声明。
