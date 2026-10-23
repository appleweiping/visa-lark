# VisaLark 签证云雀

[English](README.md)

VisaLark 用你自己已经登录的浏览器会话，定时查看 `ais.usvisa-info.com` 上的美签面签日历；你能接受的领馆出现更早的日期时，通过 Bark、Server 酱（微信）、Telegram 或 webhook 推送到手机。

> [!WARNING]
> **使用前请先读这一段。** 对预约网站的自动访问可能违反其服务条款，网站也可能限制它认为是自动化操作的账号，风险由使用者自己承担。VisaLark 只复用你自己登录的会话，不保存密码，不破解验证码，不使用代理轮换，一遇到验证拦截就停下。自动改期**默认关闭**，触发时会替换你现有的预约，而且还没有在真实账号上完整验证过。

| 扩展弹窗 | 自动改期设置（只有选了 auto 模式才会用到） |
|---|---|
| <img src="docs/img/popup.png" width="300" alt="扩展弹窗"> | <img src="docs/img/options-autobook.png" width="520" alt="自动改期设置"> |

截图是构建好的扩展填入虚构数据后渲染的，没有用到任何真实账号。

## 为什么做这个

想把美签面谈往前挪，通常就是连着几天不停刷新预约页面，国内几个领馆尤其如此。我找到的脚本要么跑在云服务器上，要么要你把密码交给它，这两点都让我担心签证账号本身的安全。我想要的只是把枯燥的那部分交给程序：在我已经登录的浏览器里，隔几分钟、带随机抖动地看一眼，有值得要的日期就推到手机上。

放号后几秒内就被抢走的号它抢不到，也不打算去抢，那需要代理池和反检测手段，而这些正是这个项目刻意不做的。

## 功能

- **同时盯多个领馆**，按日期范围、星期几、时段过滤，报告其中最早的可约日期；也可以盯加急日历。
- **推送渠道**：Bark（iOS）、Server 酱（微信）、Telegram、通用 webhook，以及浏览器自带通知。
- **每个监控三种模式**：`notify`（默认）只提醒；`confirm` 在提醒里带一个按钮，点开确认页由你自己点改期；`auto` 自动改期，受下面的限制约束。
- **出问题就退**：会话过期（401、跳转登录页）或遇到验证拦截（403、验证码）时暂停监控并提醒你；被限速（429、Cloudflare 1015）时长时间退避。任何情况下都不会尝试绕过。

### 代码里的安全限制

- 约 5 分钟 / 3 分钟 / 1.5 分钟三档轮询频率，带 ±40–50% 随机抖动，另有整个账号的每日请求上限（`packages/shared/src/safety.ts`）。
- 本地 agent 启动时会查询出口 IP 所属网络，发现是云服务器/机房网络就拒绝启动，除非你手动覆盖（`apps/agent/src/ip-guard.ts`）。在家里登录、却从机房 IP 发请求，是典型的盗号特征，所以和网站打交道的部分应该跑在你登录的地方。
- `auto` 模式只有同时满足这些条件才会改期：新日期至少提前 N 天、领馆在你的白名单里、前 N 次已经人工确认过、没超过每日上限、总开关没关；还有只评估不提交的演练模式（`packages/shared/src/interlocks.ts`）。网站返回结果不明确时记为失败，并提示你手动核对。

## 安装

### 浏览器扩展（推荐）

1. 从 [Releases](https://github.com/appleweiping/visa-lark/releases) 下载 `visalark-extension-<版本>.zip`（由 CI 从打 tag 的提交构建）并解压，或者自己构建：
   ```bash
   pnpm install
   pnpm build:packages
   pnpm --filter @visa-lark/extension build      # 输出在 apps/extension/dist
   ```
2. 打开 `chrome://extensions`（或 `edge://extensions`），开启开发者模式，点“加载已解压的扩展程序”，选中该文件夹。
3. 自己登录 `ais.usvisa-info.com`，打开改期页面。
4. 点 VisaLark 图标 →“同步当前会话”，它会从页面地址读出领区和行程号。
5. 在设置里添加监控（领馆、签证类型、日期范围、模式）和至少一个推送渠道，然后点「发送测试通知」。浏览器会询问是否允许访问你配置的推送服务，选「允许」，否则推送发不出去；页面会显示每个渠道是否送达。

### 本地 agent（不用一直开着浏览器）

适合家里的电脑或树莓派，不要放在云服务器上：

```bash
pnpm install && pnpm build:packages && pnpm --filter @visa-lark/agent build
cp apps/agent/visalark.config.example.json apps/agent/visalark.config.json
# 填入从已登录浏览器导出的 _yatri_session cookie、领区、行程号和推送渠道
node apps/agent/dist/index.js apps/agent/visalark.config.json
```

### 可选的控制面板

`apps/control-plane` 是一个 Fastify + SQLite 的小服务，记录看到过的可约日期（以及放号时段的热力图），也可以转发通知。它从不接触签证账号凭据。见 [apps/control-plane/README.md](apps/control-plane/README.md)。

## 开发

```bash
pnpm install
pnpm build:packages                          # 各 app 依赖 packages 的构建产物
pnpm -r --filter "!@visa-lark/web" test
```

设计思路和威胁模型见 [DESIGN.md](DESIGN.md)（英文）。

## 免责声明

VisaLark 是个人的非商业项目，与 CGI Federal 和美国国务院无关。它不提供托管服务，不保管任何人的凭据，也不能保证你约到号。本文内容不构成法律意见。

Copyright 2026 Weiping Yan。许可证：[Apache-2.0](LICENSE)，另见 [NOTICE](NOTICE)。
