"use client";

import { useLocale } from "@/lib/locale-context";
import type { Locale } from "@/lib/i18n";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DocSection {
  id: string;
  title: string;
  blocks: DocBlock[];
}
type DocBlock =
  | { type: "p"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; text: string }
  | { type: "note"; text: string };

// Long-form docs are authored in zh + en. ja/ko fall back to en until
// full doc translations land (the marketing site is fully localized).
const DOCS: Partial<Record<Locale, DocSection[]>> = {
  zh: [
    {
      id: "getting-started",
      title: "快速开始",
      blocks: [
        { type: "p", text: "VisaLark 的数据面（浏览器扩展或本地 Agent）跑在你自己的住宅网络上，复用你已登录的签证网站会话。四步即可运行：" },
        { type: "ol", items: [
          "在 Chrome / Edge 安装 VisaLark 扩展（从 Releases 下载 .zip 并加载，或等待商店上架）。",
          "在同一个浏览器里像平时一样登录 usvisa-info——VisaLark 不会替你保存密码。",
          "打开扩展面板，新建一个监控：选择领馆（可多选）、签证类型、可接受日期范围、星期与时段过滤。",
          "配置通知渠道（Bark / Server酱 / Telegram / Webhook），选择预约模式（默认“仅通知”），保存即开始监控。",
        ]},
        { type: "note", text: "默认轮询节奏为 patient（90–300 秒带抖动）。这不是一个“秒抢”工具——它在安全的前提下提高你的命中率。" },
      ],
    },
    {
      id: "safety-model",
      title: "安全模型",
      blocks: [
        { type: "p", text: "美国签证系统运行按用户行为 ML，叠加 Cloudflare 与 reCAPTCHA。最致命的封号信号不是轮询频率，而是 ASN / 不可能旅行 不匹配。" },
        { type: "h3", text: "为什么数据面必须跑在你的住宅网络" },
        { type: "p", text: "如果你从中国住宅 IP 登录，同一会话却从云数据中心 IP 拉取名额接口，这就是教科书式的账号盗用特征，会导致真实签证账号被快速停用。因此所有触碰 usvisa-info 的代码都只在你登录的地方运行——绝不在云服务器上轮询。" },
        { type: "h3", text: "零凭据与零绕过" },
        { type: "ul", items: [
          "默认只用 Cookie / 会话复用，不存签证密码；控制面完全不接触凭据。",
          "仓库内没有代理轮换、指纹伪造、验证码破解、TLS 伪装等任何绕过代码——这既是账号护盾也是法律护盾。",
          "遇到 Turnstile / 401 / 403 / 1015 / 验证码，一律停止并通知你，绝不硬闯。",
        ]},
      ],
    },
    {
      id: "booking-modes",
      title: "预约模式与自动改签联锁",
      blocks: [
        { type: "p", text: "每个监控可独立选择三种模式之一：" },
        { type: "ul", items: [
          "仅通知（notify）：发现名额只推送，由你手动预约。风险最低。",
          "一键确认（confirm，默认头牌）：推送带一键按钮，点击后用热会话在 1 秒内完成改签。人始终在环内。",
          "自动改签（auto）：默认关闭，满足联锁条件时无人值守自动改签。风险高。",
        ]},
        { type: "h3", text: "auto 模式的联锁（开启时强制生效）" },
        { type: "ul", items: [
          "严格更优：仅当新日期早于当前日期（可配置最小提前量，如 ≥7 天）且领馆在白名单内、且匹配日期/星期/时段过滤时才改签。",
          "绝不盲目放弃：usvisa-info 改签会替换现有预约，前 N 次（confirmFirstN，默认 1）即使在 auto 模式也需人工确认。",
          "幂等锁：防止重复提交 / 重复预约。",
          "每日预约上限 + 全局急停开关 + 试运行（dry-run）模式。",
        ]},
      ],
    },
    {
      id: "notifications",
      title: "通知渠道",
      blocks: [
        { type: "p", text: "VisaLark 大陆优先、多渠道、冗余推送。高优先级名额事件会同时扇出到所有已配置渠道，单个渠道挂掉不会吞掉名额提醒。" },
        { type: "ul", items: [
          "Bark（iOS）：大陆可达，高优先级使用 time-sensitive 中断级别 + 警报声。",
          "Server酱 / 微信：大陆可达，自动适配 SCT / SCTP key。",
          "Telegram：海外 / 技术选项，大陆需代理。",
          "Webhook：覆盖企业微信机器人 / Discord / Slack / 自定义中转。",
        ]},
        { type: "note", text: "心跳提醒确保“沉默 ≠ 没位”——即使没有名额，你也会定期收到监控存活的提示。" },
      ],
    },
    {
      id: "control-plane",
      title: "自托管控制面（可选）",
      blocks: [
        { type: "p", text: "控制面是可选的便利组件，持有零签证凭据、永不触碰 usvisa-info。它提供跨设备的可约历史、日历热力图与“最佳查询时段”，以及一个通知中转（让渠道密钥留在你的服务器而非页面里）。推荐部署在 Oracle Cloud 永久免费 VM。" },
        { type: "h3", text: "一行安装" },
        { type: "code", text: "curl -fsSL https://raw.githubusercontent.com/appleweiping/visa-lark/main/apps/control-plane/install.sh | bash" },
        { type: "p", text: "脚本会在缺失时安装 Docker，提示你输入（或自动生成）DASHBOARD_TOKEN，运行 docker compose，等待健康检查并打印 URL。" },
        { type: "h3", text: "推荐入口：Cloudflare Tunnel" },
        { type: "p", text: "不要直接对公网开放 8787 端口。使用 Cloudflare Tunnel——无需开放入站端口、免费 TLS、隐藏 VM 真实 IP。docker-compose.yml 中已附带 cloudflared 服务模板。" },
        { type: "note", text: "单租户：一个 DASHBOARD_TOKEN（Bearer）保护除 /api/health 外的所有 /api 路由。未配置 token 时，受保护路由直接返回 503（绝不做开放中转）。" },
      ],
    },
    {
      id: "faq",
      title: "常见问题 FAQ",
      blocks: [
        { type: "h3", text: "它能保证我抢到最热门领馆的名额吗？" },
        { type: "p", text: "不能，我们也不会这么承诺。30 秒内抢到最火爆名额只能靠付费住宅代理 IP 舰队，而那会让账号被封。VisaLark 提高你的整体命中率、捕捉你本会错过的释放，且不拿账号冒险。" },
        { type: "h3", text: "需要我提供签证账号密码吗？" },
        { type: "p", text: "不需要。默认只复用你浏览器里已登录的会话。我们绝不要求、也不存储签证密码。" },
        { type: "h3", text: "可以跑在云服务器上 24 小时监控吗？" },
        { type: "p", text: "数据面不行——云 IP 轮询是最危险的封号信号。本地 Agent 适合跑在你家里的电脑或树莓派上（住宅网络）。只有零凭据的控制面可以上云。" },
        { type: "h3", text: "支持哪些领馆？" },
        { type: "p", text: "内置覆盖中国（北京/成都/广州/上海/沈阳/武汉）、香港、东京、大阪、首尔、新加坡等常见领馆，你也可以在 UI 里自行添加 facility id。" },
      ],
    },
  ],
  en: [
    {
      id: "getting-started",
      title: "Getting started",
      blocks: [
        { type: "p", text: "VisaLark's data plane (browser extension or local agent) runs on your own residential network and reuses the visa-site session you're already logged into. Four steps:" },
        { type: "ol", items: [
          "Install the VisaLark extension in Chrome / Edge (load the .zip from Releases, or wait for the store listing).",
          "Log into usvisa-info in that same browser as you normally would — VisaLark never stores a password for you.",
          "Open the extension panel and create a monitor: pick consulates (multiple allowed), visa type, acceptable date range, day-of-week and time-of-day filters.",
          "Configure notification channels (Bark / Server酱 / Telegram / Webhook), choose a booking mode (default 'notify only'), and save to start monitoring.",
        ]},
        { type: "note", text: "Default poll cadence is 'patient' (90–300s jittered). This is not a 'grab in seconds' tool — it raises your hit-rate, safely." },
      ],
    },
    {
      id: "safety-model",
      title: "The safety model",
      blocks: [
        { type: "p", text: "The US visa system runs per-customer behavioral ML on top of Cloudflare and reCAPTCHA. The lethal ban signal is not poll cadence — it's ASN / impossible-travel mismatch." },
        { type: "h3", text: "Why the data plane must run on your residential network" },
        { type: "p", text: "If you log in from a Chinese residential IP and the same session then hits the availability API from a cloud datacenter IP, that's a textbook account-takeover signature and gets your real visa account suspended fast. So all code that touches usvisa-info runs only where you logged in — never polling from a cloud server." },
        { type: "h3", text: "Zero credentials, zero evasion" },
        { type: "ul", items: [
          "Cookie / session reuse by default — no stored visa password; the control plane never touches credentials.",
          "No proxy rotation, fingerprint spoofing, CAPTCHA solving, or TLS impersonation anywhere in the repo — this is both the account shield and the legal shield.",
          "On any Turnstile / 401 / 403 / 1015 / challenge, STOP and notify you — never retry-through.",
        ]},
      ],
    },
    {
      id: "booking-modes",
      title: "Booking modes & auto-book interlocks",
      blocks: [
        { type: "p", text: "Each monitor independently picks one of three modes:" },
        { type: "ul", items: [
          "notify: slot found → push only, you book manually. Lowest risk.",
          "confirm (the headline default): push with a one-tap button → reschedule in under a second on a warm session. Human always in the loop.",
          "auto: OFF by default; unattended auto-reschedule when interlocks pass. High risk.",
        ]},
        { type: "h3", text: "Auto-mode interlocks (enforced when enabled)" },
        { type: "ul", items: [
          "Strictly-better-only: book only if the new date is earlier than the current one (configurable min-improvement, e.g. ≥7 days) AND the facility is allowlisted AND it matches date/DoW/time filters.",
          "Never relinquish blind: usvisa-info reschedule replaces your existing appointment, so the first N bookings (confirmFirstN, default 1) require explicit confirmation even in auto.",
          "Idempotency lock prevents double-submit / double-booking.",
          "Per-day booking cap + global kill-switch + dry-run mode.",
        ]},
      ],
    },
    {
      id: "notifications",
      title: "Notifications",
      blocks: [
        { type: "p", text: "VisaLark is China-first, multi-channel and redundant. High-priority slot events fan out to every configured channel so one dead channel can't swallow a slot alert." },
        { type: "ul", items: [
          "Bark (iOS): reaches mainland China; high-priority uses a time-sensitive interruption level + alarm sound.",
          "Server酱 / WeChat: reaches mainland China; auto-adapts to SCT / SCTP keys.",
          "Telegram: the overseas / technical option; needs a proxy in mainland China.",
          "Webhook: covers 企业微信 bots / Discord / Slack / custom relays.",
        ]},
        { type: "note", text: "A heartbeat ensures 'silence ≠ no slots' — you get a periodic monitor-alive ping even when there's nothing available." },
      ],
    },
    {
      id: "control-plane",
      title: "Self-hosting the control plane (optional)",
      blocks: [
        { type: "p", text: "The control plane is an optional convenience that holds ZERO visa credentials and never touches usvisa-info. It gives you cross-device availability history, a calendar heatmap with 'best time to check', and a notification relay (so channel secrets live on your server, not in a page). It's a great fit for an Oracle Cloud Always Free VM." },
        { type: "h3", text: "One-line install" },
        { type: "code", text: "curl -fsSL https://raw.githubusercontent.com/appleweiping/visa-lark/main/apps/control-plane/install.sh | bash" },
        { type: "p", text: "The script installs Docker if missing, prompts for (or generates) a DASHBOARD_TOKEN, runs docker compose, waits for health, and prints the URL." },
        { type: "h3", text: "Recommended ingress: Cloudflare Tunnel" },
        { type: "p", text: "Don't expose port 8787 to the internet. Use a Cloudflare Tunnel — no inbound ports, free TLS, hides the VM IP. A cloudflared service template is included in docker-compose.yml." },
        { type: "note", text: "Single-tenant: one DASHBOARD_TOKEN (bearer) guards every /api route except /api/health. With no token set, protected routes fail-closed with 503 (never an open relay)." },
      ],
    },
    {
      id: "faq",
      title: "FAQ",
      blocks: [
        { type: "h3", text: "Will it guarantee I grab a slot at the hottest consulates?" },
        { type: "p", text: "No, and we won't pretend otherwise. Winning the sub-30-second race for the hottest slots requires paid residential-proxy IP fleets that get accounts banned. VisaLark raises your overall hit-rate and catches releases you'd otherwise miss, without gambling your account." },
        { type: "h3", text: "Do I need to hand over my visa password?" },
        { type: "p", text: "No. By default it only reuses the session already logged into your browser. We never require or store a visa password." },
        { type: "h3", text: "Can I run a 24/7 monitor on a cloud server?" },
        { type: "p", text: "Not the data plane — cloud-IP polling is the most dangerous ban signal. The local agent is meant for a home PC or Raspberry Pi (residential network). Only the zero-credential control plane belongs in the cloud." },
        { type: "h3", text: "Which consulates are supported?" },
        { type: "p", text: "Built-in coverage includes China (Beijing/Chengdu/Guangzhou/Shanghai/Shenyang/Wuhan), Hong Kong, Tokyo, Osaka, Seoul, Singapore, and you can add your own facility id in the UI." },
      ],
    },
  ],
};

export function DocsContent() {
  const { t, locale } = useLocale();
  const sections = DOCS[locale] ?? DOCS.en ?? [];

  return (
    <div className="container-page py-12">
      <div className="lg:grid lg:grid-cols-[1fr_220px] lg:gap-12">
        <div>
          <header className="border-b pb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{t.docs.title}</h1>
            <p className="mt-2 text-muted-foreground">{t.docs.subtitle}</p>
          </header>

          <div className="prose-doc max-w-none">
            {sections.map((section) => (
              <section key={section.id} id={section.id}>
                <h2>{section.title}</h2>
                {section.blocks.map((block, i) => (
                  <DocBlockView key={i} block={block} />
                ))}
              </section>
            ))}
          </div>
        </div>

        {/* TOC */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.docs.tocTitle}</p>
            <nav className="mt-3 flex flex-col gap-2">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block text-sm text-muted-foreground transition hover:text-primary"
                >
                  {s.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DocBlockView({ block }: { block: DocBlock }) {
  switch (block.type) {
    case "p":
      return <p>{block.text}</p>;
    case "h3":
      return <h3>{block.text}</h3>;
    case "ul":
      return (
        <ul>
          {block.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol>
          {block.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ol>
      );
    case "code":
      return (
        <pre>
          <code>{block.text}</code>
        </pre>
      );
    case "note":
      return (
        <Alert className="!mt-4 border-lark-200 bg-lark-50 dark:border-lark-800 dark:bg-lark-950/40">
          <AlertDescription className="text-sm text-lark-800 dark:text-lark-200">
            {block.text}
          </AlertDescription>
        </Alert>
      );
  }
}
