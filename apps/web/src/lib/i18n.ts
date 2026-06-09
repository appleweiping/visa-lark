/**
 * Bilingual copy (zh primary, en secondary). Honest positioning per DESIGN.md
 * §10 — NO "guaranteed grab" / "秒级抢到". We promise odds improvement only.
 *
 * Kept as a typed dictionary so both languages stay structurally in sync and the
 * compiler catches a missing translation.
 */

export type Locale = "zh" | "en";

export const LOCALES: Locale[] = ["zh", "en"];

export interface NavCopy {
  features: string;
  safety: string;
  docs: string;
  demo: string;
  github: string;
}

export interface FeatureItem {
  title: string;
  body: string;
  icon: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface Dict {
  nav: NavCopy;
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    tagline: string;
    honestNote: string;
    ctaInstall: string;
    ctaDemo: string;
    ctaDocs: string;
    trustRow: string[];
  };
  what: {
    eyebrow: string;
    title: string;
    body: string;
    points: { title: string; body: string }[];
  };
  safety: {
    eyebrow: string;
    title: string;
    intro: string;
    pillars: { title: string; body: string; why: string }[];
    planes: {
      dataTitle: string;
      dataBody: string;
      controlTitle: string;
      controlBody: string;
    };
  };
  features: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: FeatureItem[];
  };
  compare: {
    eyebrow: string;
    title: string;
    subtitle: string;
    columns: { us: string; them: string };
    rows: { label: string; us: string; them: string }[];
    footnote: string;
  };
  install: {
    eyebrow: string;
    title: string;
    subtitle: string;
    steps: { title: string; body: string }[];
    extensionCta: string;
    agentCta: string;
    controlPlaneCta: string;
  };
  disclaimer: {
    title: string;
    body: string[];
  };
  footer: {
    tagline: string;
    builtWith: string;
    sections: { title: string; links: { label: string; href: string }[] }[];
    legal: string;
  };
  demo: {
    title: string;
    subtitle: string;
    mockNote: string;
    boardTitle: string;
    heatmapTitle: string;
    heatmapSubtitle: string;
    bestTime: string;
    monitorTitle: string;
    notifyTitle: string;
    statusLabels: { plenty: string; scarce: string; none: string };
    lastUpdated: string;
    earliest: string;
    readOnly: string;
    fields: {
      cities: string;
      visaType: string;
      dateRange: string;
      dow: string;
      mode: string;
      cadence: string;
    };
    modes: { notify: string; confirm: string; auto: string };
    channels: { bark: string; serverchan: string; telegram: string; webhook: string };
    heartbeatNote: string;
  };
  docs: {
    title: string;
    subtitle: string;
    tocTitle: string;
  };
}

const zh: Dict = {
  nav: {
    features: "功能",
    safety: "安全模型",
    docs: "文档",
    demo: "在线演示",
    github: "GitHub",
  },
  hero: {
    badge: "开源 · 账号安全优先 · 零凭据",
    title: "VisaLark 签证云雀",
    subtitle: "开源的美国签证预约监控器",
    tagline:
      "提升你抢到面签位的几率，捕捉那些你本会错过的释放名额——而不是承诺替你“秒抢”。",
    honestNote:
      "我们不参与残酷的住宅代理 IP 军备竞赛（那会让账号被封、项目被下架）。我们靠安全、透明、多领馆覆盖和释放规律智能取胜。",
    ctaInstall: "安装扩展",
    ctaDemo: "查看在线演示",
    ctaDocs: "阅读文档",
    trustRow: ["住宅 IP 数据面", "零凭据存储", "零绕过 / 反检测代码", "Apache-2.0 开源"],
  },
  what: {
    eyebrow: "它做什么",
    title: "一个监控为先的助约工具",
    body:
      "VisaLark 在你自己的浏览器或本地设备上，复用你已经登录的签证网站会话，监控多个领馆的可约日期。一旦出现你能接受的名额，立刻通过多渠道把消息推给你——你也可以选择一键确认改签。",
    points: [
      {
        title: "监控，而非抢占",
        body: "默认只通知。改签是破坏性操作，我们把它当作外科手术对待，绝不盲目放弃你现有的预约。",
      },
      {
        title: "复用你的真实会话",
        body: "代码运行在你登录的地方，用你浏览器自己的指纹与 Cookie，不伪造、不存密码。",
      },
      {
        title: "你的数据属于你",
        body: "可选的自托管控制面让历史与热力图跨设备同步，但永远不持有任何签证凭据。",
      },
    ],
  },
  safety: {
    eyebrow: "双平面安全模型",
    title: "为什么这样设计能保护你的账号",
    intro:
      "美国签证系统（CGI Federal / usvisa-info）运行着按用户的行为 ML，叠加 Cloudflare 与 reCAPTCHA。最致命的信号不是轮询频率，而是 ASN / 不可能旅行 不匹配：如果你从中国住宅网络登录，同一会话却从云数据中心 IP 去拉取名额接口，这就是教科书式的账号盗用 / 自动化特征，会导致你真实的签证账号被快速停用。",
    pillars: [
      {
        title: "仅住宅 IP 的数据面",
        body: "所有触碰 usvisa-info 的代码都跑在你自己的住宅网络上。",
        why: "因为云 ASN 与你的登录地不匹配 = 账号停用风险。我们从架构上杜绝云 IP 轮询。",
      },
      {
        title: "零凭据",
        body: "默认只用 Cookie / 会话复用，不存签证密码。控制面完全不接触凭据。",
        why: "没有凭据蜜罐，就没有被批量盗用或合规追责的风险——这也保护我们维护者。",
      },
      {
        title: "零绕过代码",
        body: "没有代理轮换、没有指纹伪造、没有验证码破解、没有 TLS 伪装。",
        why: "这同时是账号护盾和法律护盾。遇到验证码 / 401 / 403 / 1015 一律停止并通知你，绝不硬闯。",
      },
    ],
    planes: {
      dataTitle: "数据面（在你的住宅网络）",
      dataBody:
        "浏览器扩展（MV3）或本地 Agent。是唯一会看到 usvisa-info 与会话 Cookie 的地方。复用你的真实浏览器会话，保守且带抖动的轮询。",
      controlTitle: "控制面（可选 · 零凭据）",
      controlBody:
        "apps/web（Vercel）+ apps/control-plane（Oracle 免费 VM）。只做落地页、文档、演示、历史与热力图、通知中转。永不轮询签证网站。",
    },
  },
  features: {
    eyebrow: "功能",
    title: "你需要的一切，没有你不该有的风险",
    subtitle: "MVP 与 v1 的差异化能力，全部围绕“安全地提高命中率”。",
    items: [
      {
        title: "多领馆最早可约",
        body: "“在我能接受的城市里找最早的那一个”——跨多个领馆同时监控，自动汇总最早日期。",
        icon: "globe",
      },
      {
        title: "一键确认改签",
        body: "发现名额 → 推送带一键按钮 → 尝试用热会话快速改签（实验性：改签流程尚未在真实账号完整验证，结果不确定时会要求你手动核对）。人始终在环内。",
        icon: "tap",
      },
      {
        title: "多渠道通知",
        body: "Bark（iOS）、Server酱（微信）、Telegram、Webhook。大陆可达优先，高优先级事件全渠道冗余。",
        icon: "bell",
      },
      {
        title: "日历热力图",
        body: "把你自己的轮询历史画成 7×24 热力图，一眼看清名额都在什么时候释放。",
        icon: "calendar",
      },
      {
        title: "最佳查询时段",
        body: "释放规律学习：从历史里算出名额最常在哪个小时释放——既提高命中率，又让你少轮询。",
        icon: "spark",
      },
      {
        title: "加急 / 紧急监控",
        body: "监控 expedite 加急日历，并支持日期区间、星期、时段的精细过滤。",
        icon: "filter",
      },
    ],
  },
  compare: {
    eyebrow: "诚实对比",
    title: "VisaLark vs 付费“抢号”服务",
    subtitle: "我们不假装能赢下 30 秒军备竞赛。我们诚实说明取舍。",
    columns: { us: "VisaLark", them: "付费代理抢号 (如 qmq 类)" },
    rows: [
      { label: "价格", us: "免费 · 开源", them: "付费 VIP / 订阅" },
      { label: "账号安全", us: "住宅 IP + 零绕过，账号风险最低", them: "云端代理轮换，账号易被封" },
      { label: "凭据", us: "零凭据，密码不出本机", them: "常需托管凭据（蜜罐风险）" },
      { label: "最热名额的“秒抢”", us: "不承诺（不打代理军备战）", them: "靠住宅代理 IP 舰队硬拼" },
      { label: "多领馆覆盖", us: "原生支持“最早可约”聚合", them: "视服务而定" },
      { label: "透明度", us: "全部代码开源、可审计", them: "闭源黑盒" },
    ],
    footnote:
      "如果你的目标是几个最火爆领馆的瞬时名额，付费代理舰队确实更快——但代价是账号被封的真实风险。VisaLark 适合想长期、安全地捕捉名额的人。",
  },
  install: {
    eyebrow: "开始使用",
    title: "三步上手",
    subtitle: "无需服务器即可开始；控制面是可选的进阶项。",
    steps: [
      {
        title: "1 · 安装浏览器扩展",
        body: "在 Chrome / Edge 安装 VisaLark 扩展（数据面）。它只在你登录的标签页里工作。",
      },
      {
        title: "2 · 自己登录签证网站",
        body: "像平时一样登录 usvisa-info。扩展复用你已登录的会话，绝不替你保存密码。",
      },
      {
        title: "3 · 配置监控与通知",
        body: "选择领馆、签证类型、可接受的日期范围，设置 Bark / 微信 / Telegram 通知，然后交给它。",
      },
    ],
    extensionCta: "下载浏览器扩展",
    agentCta: "运行本地 Agent（进阶）",
    controlPlaneCta: "自托管控制面（可选）",
  },
  disclaimer: {
    title: "法律与风险声明",
    body: [
      "本项目仅供教育与个人使用。VisaLark 与 CGI Federal、美国国务院或任何政府机构均无任何隶属、授权或背书关系。",
      "你需自行承担使用本工具可能带来的全部风险，包括但不限于签证账号被停用、预约丢失或 MRV 费用损失。本软件按“原样”提供，不含任何明示或默示的担保。",
      "本仓库不包含任何检测绕过、代理轮换或验证码破解代码。请遵守目标网站的服务条款与你所在司法辖区的法律。本页不构成法律意见。",
    ],
  },
  footer: {
    tagline: "开源的美国签证预约监控器。账号安全优先。",
    builtWith: "用 TypeScript · Next.js · Fastify 构建",
    sections: [
      {
        title: "产品",
        links: [
          { label: "功能", href: "/#features" },
          { label: "安全模型", href: "/#safety" },
          { label: "在线演示", href: "/demo" },
        ],
      },
      {
        title: "文档",
        links: [
          { label: "快速开始", href: "/docs#getting-started" },
          { label: "安全模型", href: "/docs#safety-model" },
          { label: "自托管控制面", href: "/docs#control-plane" },
          { label: "FAQ", href: "/docs#faq" },
        ],
      },
    ],
    legal: "未隶属于 CGI Federal 或美国国务院。仅供教育 / 个人使用，风险自负，无任何担保。",
  },
  demo: {
    title: "在线演示（模拟数据）",
    subtitle: "这是一个完全离线的交互演示，用来展示真实产品的体验。不连接任何网络、不触碰签证网站。",
    mockNote: "演示数据 · 不发起任何真实网络请求",
    boardTitle: "各领馆名额看板",
    heatmapTitle: "名额释放热力图",
    heatmapSubtitle: "按 星期 × 小时 统计你历史看到的名额释放（颜色越深 = 释放越多）",
    bestTime: "最佳查询时段",
    monitorTitle: "监控配置",
    notifyTitle: "通知设置",
    statusLabels: { plenty: "有位", scarce: "紧缺", none: "无位" },
    lastUpdated: "更新于",
    earliest: "最早",
    readOnly: "只读演示",
    fields: {
      cities: "监控城市",
      visaType: "签证类型",
      dateRange: "可接受日期范围",
      dow: "星期过滤",
      mode: "预约模式",
      cadence: "轮询节奏",
    },
    modes: { notify: "仅通知", confirm: "一键确认", auto: "自动改签" },
    channels: { bark: "Bark (iOS)", serverchan: "Server酱 (微信)", telegram: "Telegram", webhook: "Webhook" },
    heartbeatNote: "心跳已开启：即使没有名额，你也会定期收到“监控存活”提示——沉默 ≠ 没位。",
  },
  docs: {
    title: "文档",
    subtitle: "从安装到安全模型的一切。",
    tocTitle: "目录",
  },
};

const en: Dict = {
  nav: {
    features: "Features",
    safety: "Safety",
    docs: "Docs",
    demo: "Live Demo",
    github: "GitHub",
  },
  hero: {
    badge: "Open-source · Account-safety first · Zero-credential",
    title: "VisaLark",
    subtitle: "Open-source US visa appointment monitor",
    tagline:
      "Improve your odds and catch slots you'd otherwise miss — without pretending to 'grab' them in seconds for you.",
    honestNote:
      "We refuse the brutal residential-proxy IP arms race (it gets accounts banned and repos taken down). We win on safety, transparency, multi-consulate breadth, and release-pattern intelligence instead.",
    ctaInstall: "Install the extension",
    ctaDemo: "See the live demo",
    ctaDocs: "Read the docs",
    trustRow: ["Residential-IP data plane", "Zero stored credentials", "Zero evasion code", "Apache-2.0 open source"],
  },
  what: {
    eyebrow: "What it does",
    title: "A monitor-first assisted-booking tool",
    body:
      "VisaLark watches appointment availability across multiple consulates from your own browser or device, reusing the session you're already logged into. The moment an acceptable slot appears, it pushes you a multi-channel alert — and optionally lets you one-tap confirm a reschedule.",
    points: [
      {
        title: "Monitor, don't grab",
        body: "Notify-only by default. Reschedule is destructive, so we treat it like surgery and never relinquish your existing appointment blindly.",
      },
      {
        title: "Reuse your real session",
        body: "Code runs where you logged in, using your browser's own fingerprint and cookie. No faking, no stored password.",
      },
      {
        title: "Your data is yours",
        body: "The optional self-host control plane syncs history and heatmaps across devices — and never holds a single visa credential.",
      },
    ],
  },
  safety: {
    eyebrow: "Two-plane safety model",
    title: "Why this design protects your account",
    intro:
      "The US visa system (CGI Federal / usvisa-info) runs per-customer behavioral ML on top of Cloudflare and reCAPTCHA. The lethal signal is not poll cadence — it's ASN / impossible-travel mismatch: if you log in from a Chinese residential ISP and the same session then hits the availability API from a cloud datacenter IP, that's a textbook account-takeover / automation signature and gets your real visa account suspended fast.",
    pillars: [
      {
        title: "Residential-IP data plane only",
        body: "All code that touches usvisa-info runs on your own residential connection.",
        why: "Because a cloud ASN that doesn't match your login location = suspension risk. We make cloud-IP polling architecturally impossible.",
      },
      {
        title: "Zero credentials",
        body: "Cookie / session reuse by default — no stored visa password. The control plane never touches credentials at all.",
        why: "No credential honeypot means no mass-takeover or compliance-liability risk — that protects you and us.",
      },
      {
        title: "Zero evasion code",
        body: "No proxy rotation, no fingerprint spoofing, no CAPTCHA solving, no TLS impersonation.",
        why: "This is both the account shield and the legal shield. On any CAPTCHA / 401 / 403 / 1015 we STOP and notify you — never retry-through.",
      },
    ],
    planes: {
      dataTitle: "Data plane (on your residential network)",
      dataBody:
        "Browser extension (MV3) or local agent. The only thing that ever sees usvisa-info or a session cookie. Reuses your real browser session with conservative, jittered polling.",
      controlTitle: "Control plane (optional · zero-credential)",
      controlBody:
        "apps/web (Vercel) + apps/control-plane (Oracle free VM). Landing, docs, demo, history + heatmap, notification relay only. Never polls the visa site.",
    },
  },
  features: {
    eyebrow: "Features",
    title: "Everything you need, none of the risk you shouldn't take",
    subtitle: "The MVP and v1 differentiators, all built around 'raise hit-rate, safely'.",
    items: [
      {
        title: "Multi-consulate earliest",
        body: "'Earliest across my acceptable cities' — watch several consulates at once and auto-surface the soonest date.",
        icon: "globe",
      },
      {
        title: "One-tap confirm",
        body: "Slot found → push with a one-tap button → attempt a fast reschedule on a warm session (experimental: the reschedule flow is not yet fully verified against a live account; ambiguous results ask you to verify manually). Human always in the loop.",
        icon: "tap",
      },
      {
        title: "Multi-channel notify",
        body: "Bark (iOS), Server酱 (WeChat), Telegram, Webhook. China-reliable first; high-priority events fan out to every channel.",
        icon: "bell",
      },
      {
        title: "Calendar heatmap",
        body: "Turn your own poll history into a 7×24 heatmap so you can see exactly when slots tend to be released.",
        icon: "calendar",
      },
      {
        title: "Best time to check",
        body: "Release-pattern learning computes which hour-of-day most slots open up — raising hit-rate while letting you poll less.",
        icon: "spark",
      },
      {
        title: "Expedite & filters",
        body: "Watch the expedite/emergency calendar, with fine-grained date-range, day-of-week and time-of-day filters.",
        icon: "filter",
      },
    ],
  },
  compare: {
    eyebrow: "Honest comparison",
    title: "VisaLark vs paid 'grabber' services",
    subtitle: "We don't pretend to win the 30-second arms race. Here's the honest trade-off.",
    columns: { us: "VisaLark", them: "Paid proxy grabbers (e.g. qmq-style)" },
    rows: [
      { label: "Price", us: "Free · open source", them: "Paid VIP / subscription" },
      { label: "Account safety", us: "Residential-IP + zero evasion, lowest ban risk", them: "Cloud proxy rotation, higher ban risk" },
      { label: "Credentials", us: "Zero — password never leaves your machine", them: "Often hosted credentials (honeypot risk)" },
      { label: "Sub-30s 'grab' of hottest slots", us: "Not promised (we don't run the proxy war)", them: "Residential proxy IP fleets" },
      { label: "Multi-consulate", us: "Native 'earliest available' aggregation", them: "Varies by service" },
      { label: "Transparency", us: "Fully open-source, auditable", them: "Closed-source black box" },
    ],
    footnote:
      "If your goal is the instantaneous slot at a couple of the hottest consulates, a paid proxy fleet is genuinely faster — at a real risk of an account ban. VisaLark is for people who want to catch slots safely, over time.",
  },
  install: {
    eyebrow: "Get started",
    title: "Up and running in three steps",
    subtitle: "No server required to start; the control plane is an optional upgrade.",
    steps: [
      {
        title: "1 · Install the browser extension",
        body: "Add the VisaLark extension (the data plane) to Chrome / Edge. It only works inside the tab you're logged into.",
      },
      {
        title: "2 · Log into the visa site yourself",
        body: "Sign into usvisa-info as you normally would. The extension reuses your logged-in session and never stores a password for you.",
      },
      {
        title: "3 · Configure monitor & notifications",
        body: "Pick consulates, visa type and acceptable dates, set up Bark / WeChat / Telegram alerts, and let it run.",
      },
    ],
    extensionCta: "Download the browser extension",
    agentCta: "Run the local agent (advanced)",
    controlPlaneCta: "Self-host the control plane (optional)",
  },
  disclaimer: {
    title: "Legal & risk disclaimer",
    body: [
      "This project is for educational and personal use only. VisaLark is not affiliated with, authorized by, or endorsed by CGI Federal, the US Department of State, or any government agency.",
      "You accept all risk arising from use of this tool, including but not limited to visa-account suspension, lost appointments, or forfeited MRV fees. The software is provided 'as is', without warranty of any kind, express or implied.",
      "This repository contains no detection-evasion, proxy-rotation, or CAPTCHA-solving code. Comply with the target site's Terms of Service and the laws of your jurisdiction. This page is not legal advice.",
    ],
  },
  footer: {
    tagline: "Open-source US visa appointment monitor. Account-safety first.",
    builtWith: "Built with TypeScript · Next.js · Fastify",
    sections: [
      {
        title: "Product",
        links: [
          { label: "Features", href: "/#features" },
          { label: "Safety model", href: "/#safety" },
          { label: "Live demo", href: "/demo" },
        ],
      },
      {
        title: "Docs",
        links: [
          { label: "Getting started", href: "/docs#getting-started" },
          { label: "Safety model", href: "/docs#safety-model" },
          { label: "Self-host control plane", href: "/docs#control-plane" },
          { label: "FAQ", href: "/docs#faq" },
        ],
      },
    ],
    legal: "Not affiliated with CGI Federal or the US Dept of State. Educational / personal use, at your own risk, no warranty.",
  },
  demo: {
    title: "Live demo (mock data)",
    subtitle: "A fully offline, interactive demo to show what the real product feels like. No network, no contact with the visa site.",
    mockNote: "Mock data · makes zero real network requests",
    boardTitle: "Availability board by consulate",
    heatmapTitle: "Slot-release heatmap",
    heatmapSubtitle: "Releases you've historically seen by day-of-week × hour (darker = more releases)",
    bestTime: "Best time to check",
    monitorTitle: "Monitor configuration",
    notifyTitle: "Notification settings",
    statusLabels: { plenty: "Open", scarce: "Scarce", none: "None" },
    lastUpdated: "updated",
    earliest: "earliest",
    readOnly: "read-only demo",
    fields: {
      cities: "Watched cities",
      visaType: "Visa type",
      dateRange: "Acceptable date range",
      dow: "Day-of-week filter",
      mode: "Booking mode",
      cadence: "Poll cadence",
    },
    modes: { notify: "Notify only", confirm: "One-tap confirm", auto: "Auto reschedule" },
    channels: { bark: "Bark (iOS)", serverchan: "Server酱 (WeChat)", telegram: "Telegram", webhook: "Webhook" },
    heartbeatNote: "Heartbeat on: you get a periodic 'monitor alive' ping even with no slots — silence ≠ no slots.",
  },
  docs: {
    title: "Documentation",
    subtitle: "Everything from install to the safety model.",
    tocTitle: "On this page",
  },
};

export const DICT: Record<Locale, Dict> = { zh, en };
