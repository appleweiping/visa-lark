# VisaLark local agent

The local agent runs the same monitor code as the browser extension, as a Node process with no
browser. It is meant for a machine on your home network (a PC, NAS or Raspberry Pi) that stays on,
so you don't have to keep a browser open.

It follows the same rules as the extension: it reuses a session cookie you copied from your own
browser, never asks for or stores your password, has no proxy or CAPTCHA code, and stops a
monitor when the site challenges it. It also checks that it is not running on a cloud server
(see "The IP guard" below), which the extension doesn't need because it runs in your browser.

> [!WARNING]
> Run it on your home network, not on a cloud VM. If you log in from home and the same session
> then makes requests from a datacenter IP, the site can treat that as account takeover or
> automation and restrict the account ([DESIGN.md §1](../../DESIGN.md)). I have not tested how
> the site reacts; I just don't want to find out with a real visa account.

## Quick start

```bash
# from the repository root (pnpm ≥ 9, Node ≥ 20)
corepack pnpm install
corepack pnpm build:packages                      # the agent imports the built workspace packages
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
  "allowDatacenterIp": false,        // true skips the cloud-IP check; keep it false
  "stateFile": "./visalark.state.json"
}
```

## The IP guard

On startup the agent looks up the organization behind its public IP (ipinfo.io, with a fallback
provider). If the name matches a known cloud or hosting provider, the agent refuses to start
(exit code 2) unless you set `allowDatacenterIp: true`. I would not set it: requests from a cloud
network that doesn't match where you logged in are the main thing this project tries to avoid
(see DESIGN.md §1). The check repeats every hour and stops all monitors if the network changes,
for example when a VPN comes on. If the lookup fails the agent starts anyway and prints a
warning. It only compares organization names against a list, so it can miss providers; stay on
your home connection regardless.

## Safety interlocks (summary)

- **Cloud-IP check**: refuses to start on a recognized cloud network unless overridden.
- **Cookie only**: the config holds the session cookie, never a password. The cookie sits in a
  plain JSON file, so keep that file private.
- **Stops on challenges**: a CAPTCHA or 403 challenge stops the monitor and alerts you, an
  expired session (401) alerts you and pauses it for an hour, and rate limiting (429,
  Cloudflare 1015) pauses it for an hour. Three failures in a row stop it. It never retries
  through a challenge.
- **Slow polling**: jittered intervals and a daily request cap, saved in `stateFile` so a restart
  does not reset a cooldown.
- **Auto-book is off unless you turn it on**: when on, it only books dates at least
  `minImprovementDays` earlier, at allow-listed consulates, after the first N bookings were
  confirmed by hand, within a daily cap, with a kill switch and a dry-run mode.
- **No proxy support**: there is nothing to configure.

## Docker (optional)

There is a `Dockerfile` for running it on a home server. The same rule applies: a container on a
cloud VM is still on a cloud network, and the IP check will refuse to start.

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

1. 仓库根目录：`corepack pnpm install && corepack pnpm build:packages && corepack pnpm --filter @visa-lark/agent build`
   （先构建 `packages/*`，Agent 依赖它们的 `dist/`）。
2. `cp apps/agent/visalark.config.example.json apps/agent/visalark.config.json`，然后编辑：
   从你**自己登录**的浏览器里复制 `_yatri_session` Cookie，填入领馆代码（如 `en-cn`）、
   schedule id、现有预约信息和通知渠道（Bark / Server酱）。
3. 启动：`node apps/agent/dist/index.js apps/agent/visalark.config.json`。

请跑在**自己家的网络**上（家用电脑 / 树莓派），不要放云服务器。Agent 启动时会查询出口 IP 所属的网络，
看起来是云服务商就拒绝启动；`allowDatacenterIp` 可以跳过这个检查，但我不建议打开。
会话过期时 Agent 会停下来通知你重新同步 Cookie，绝不替你登录。自动改签默认关闭，开启后受
「至少提前 N 天、领馆白名单、前 N 次人工确认、每日上限、紧急停止、试运行」多重保险约束。
风险自负，详见根目录 README 的免责声明。
