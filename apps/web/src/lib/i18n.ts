/**
 * Multilingual copy (zh primary, plus en/ja/ko). Honest positioning per
 * DESIGN.md §10 — NO "guaranteed grab" / "秒级抢到". We promise odds
 * improvement only.
 *
 * Kept as a typed dictionary so every language stays structurally in sync and
 * the compiler catches a missing translation.
 */

export type Locale = "zh" | "en" | "ja" | "ko";

export const LOCALES: Locale[] = ["zh", "en", "ja", "ko"];

export const LOCALE_LABELS: Record<Locale, string> = {
  zh: "中文",
  en: "EN",
  ja: "日本語",
  ko: "한국어",
};

export const LOCALE_HTML_LANG: Record<Locale, string> = {
  zh: "zh-CN",
  en: "en",
  ja: "ja",
  ko: "ko",
};

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
    diagram: {
      aria: string;
      dataTitle: string;
      dataSub: string;
      dataLine1: string;
      dataLine2: string;
      controlTitle: string;
      controlSub: string;
      controlLine1: string;
      controlLine2: string;
      flowLabel: string;
      notifyLabel: string;
      caption: string;
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
    diagram: {
      aria: "双平面架构示意图：住宅数据面与中转控制面",
      dataTitle: "数据面",
      dataSub: "你的住宅网络",
      dataLine1: "浏览器扩展 / 本地 Agent",
      dataLine2: "真实会话 · 住宅 IP · 零凭据",
      controlTitle: "控制面",
      controlSub: "可选中转 · 零凭据",
      controlLine1: "历史 · 热力图 · 通知中转",
      controlLine2: "永不轮询签证网站",
      flowLabel: "仅可用性历史（可选）",
      notifyLabel: "推送到你的手机",
      caption: "只有数据面接触签证网站——并且它只运行在你自己的住宅网络上。",
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
    diagram: {
      aria: "Two-plane architecture diagram: residential data plane and relay control plane",
      dataTitle: "Data plane",
      dataSub: "your residential network",
      dataLine1: "Browser extension / local agent",
      dataLine2: "real session · residential IP · zero credentials",
      controlTitle: "Control plane",
      controlSub: "optional relay · zero credentials",
      controlLine1: "history · heatmap · notification relay",
      controlLine2: "never polls the visa site",
      flowLabel: "availability history only (optional)",
      notifyLabel: "push to your phone",
      caption: "Only the data plane ever touches the visa site — and it only runs on your own residential network.",
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

const ja: Dict = {
  nav: {
    features: "機能",
    safety: "安全モデル",
    docs: "ドキュメント",
    demo: "ライブデモ",
    github: "GitHub",
  },
  hero: {
    badge: "オープンソース · アカウント安全第一 · 資格情報ゼロ",
    title: "VisaLark 签证云雀",
    subtitle: "オープンソースの米国ビザ予約モニター",
    tagline:
      "見逃していたはずの枠を捕捉し、面接予約のチャンスを高めます —— 「秒速で確保」を約束するものではありません。",
    honestNote:
      "私たちは過酷な住宅用プロキシ IP の軍拡競争には参加しません（アカウント停止やリポジトリ削除を招きます）。安全性・透明性・複数領事館のカバー・枠リリースのパターン分析で勝負します。",
    ctaInstall: "拡張をインストール",
    ctaDemo: "ライブデモを見る",
    ctaDocs: "ドキュメントを読む",
    trustRow: ["住宅用 IP のデータプレーン", "資格情報の保存ゼロ", "回避 / 反検出コードゼロ", "Apache-2.0 オープンソース"],
  },
  what: {
    eyebrow: "何をするか",
    title: "モニター優先の予約支援ツール",
    body:
      "VisaLark は、あなた自身のブラウザまたはローカル端末で、すでにログイン済みのビザサイトのセッションを再利用し、複数領事館の空き枠を監視します。受け入れ可能な枠が出た瞬間、マルチチャネルで通知します —— ワンタップでの予約変更確認も選べます。",
    points: [
      {
        title: "確保ではなく監視",
        body: "デフォルトは通知のみ。予約変更は破壊的操作なので、外科手術のように扱い、既存の予約を盲目的に手放すことは決してありません。",
      },
      {
        title: "本物のセッションを再利用",
        body: "コードはあなたがログインした場所で動作し、ブラウザ自身の指紋と Cookie を使います。偽装せず、パスワードも保存しません。",
      },
      {
        title: "データはあなたのもの",
        body: "任意のセルフホスト型コントロールプレーンが履歴とヒートマップを端末間で同期します —— ビザ資格情報は一切保持しません。",
      },
    ],
  },
  safety: {
    eyebrow: "2 層の安全モデル",
    title: "なぜこの設計があなたのアカウントを守るのか",
    intro:
      "米国ビザシステム（CGI Federal / usvisa-info）は、Cloudflare と reCAPTCHA に加えユーザー単位の行動 ML を実行します。致命的なシグナルはポーリング頻度ではなく、ASN / 不可能な移動の不一致です：住宅用ネットワークからログインしたのに、同じセッションがクラウドのデータセンター IP から空き枠 API を叩くと、教科書的なアカウント乗っ取り / 自動化の兆候となり、あなたの本物のビザアカウントを速やかに停止させます。",
    pillars: [
      {
        title: "住宅用 IP のみのデータプレーン",
        body: "usvisa-info に触れるすべてのコードは、あなた自身の住宅用回線で動作します。",
        why: "ログイン地と一致しないクラウド ASN = 停止リスクだからです。クラウド IP からのポーリングをアーキテクチャ上不可能にしています。",
      },
      {
        title: "資格情報ゼロ",
        body: "デフォルトは Cookie / セッション再利用のみ —— ビザのパスワードは保存しません。コントロールプレーンは資格情報に一切触れません。",
        why: "資格情報のハニーポットがなければ、大量乗っ取りやコンプライアンス上の責任リスクもありません —— それがあなたと私たちを守ります。",
      },
      {
        title: "回避コードゼロ",
        body: "プロキシのローテーションなし、指紋偽装なし、CAPTCHA 解読なし、TLS なりすましなし。",
        why: "これはアカウントの盾であり法的な盾でもあります。CAPTCHA / 401 / 403 / 1015 に遭遇したら停止して通知します —— 決して強行しません。",
      },
    ],
    planes: {
      dataTitle: "データプレーン（あなたの住宅用ネットワーク上）",
      dataBody:
        "ブラウザ拡張（MV3）またはローカル Agent。usvisa-info とセッション Cookie に触れる唯一の部分です。本物のブラウザセッションを再利用し、保守的でジッター付きのポーリングを行います。",
      controlTitle: "コントロールプレーン（任意 · 資格情報ゼロ）",
      controlBody:
        "apps/web（Vercel）+ apps/control-plane（Oracle 無料 VM）。ランディング、ドキュメント、デモ、履歴とヒートマップ、通知中継のみ。ビザサイトをポーリングすることはありません。",
    },
    diagram: {
      aria: "2 層アーキテクチャ図：住宅用データプレーンと中継コントロールプレーン",
      dataTitle: "データプレーン",
      dataSub: "あなたの住宅用ネットワーク",
      dataLine1: "ブラウザ拡張 / ローカル Agent",
      dataLine2: "本物のセッション · 住宅用 IP · 資格情報ゼロ",
      controlTitle: "コントロールプレーン",
      controlSub: "任意の中継 · 資格情報ゼロ",
      controlLine1: "履歴 · ヒートマップ · 通知中継",
      controlLine2: "ビザサイトはポーリングしない",
      flowLabel: "空き枠履歴のみ（任意）",
      notifyLabel: "スマホへプッシュ",
      caption: "ビザサイトに触れるのはデータプレーンだけ —— それもあなた自身の住宅用ネットワーク上だけで動きます。",
    },
  },
  features: {
    eyebrow: "機能",
    title: "必要なものすべて、負うべきでないリスクはゼロ",
    subtitle: "MVP と v1 の差別化機能はすべて「安全に命中率を高める」を軸にしています。",
    items: [
      {
        title: "複数領事館の最早枠",
        body: "「受け入れ可能な都市の中で最も早い枠」—— 複数の領事館を同時に監視し、最早日を自動集約します。",
        icon: "globe",
      },
      {
        title: "ワンタップ確認",
        body: "枠発見 → ワンタップボタン付き通知 → ウォームセッションで高速予約変更を試行（実験的：予約変更フローは実アカウントで未検証。結果が不明確な場合は手動確認を求めます）。常に人間が関与します。",
        icon: "tap",
      },
      {
        title: "マルチチャネル通知",
        body: "Bark（iOS）、Server酱（WeChat）、Telegram、Webhook。中国到達を優先し、高優先度イベントは全チャネルへ冗長送信します。",
        icon: "bell",
      },
      {
        title: "カレンダーヒートマップ",
        body: "あなた自身のポーリング履歴を 7×24 のヒートマップにし、枠がいつ放出されやすいか一目で把握できます。",
        icon: "calendar",
      },
      {
        title: "最適な確認時間帯",
        body: "リリースパターン学習が、どの時間帯に最も枠が出るかを算出 —— 命中率を高めつつ、ポーリングを減らせます。",
        icon: "spark",
      },
      {
        title: "緊急枠 & フィルタ",
        body: "expedite / 緊急カレンダーを監視し、日付範囲・曜日・時間帯の細かいフィルタに対応します。",
        icon: "filter",
      },
    ],
  },
  compare: {
    eyebrow: "正直な比較",
    title: "VisaLark vs 有料「確保代行」サービス",
    subtitle: "私たちは 30 秒の軍拡競争に勝てるふりはしません。正直にトレードオフを示します。",
    columns: { us: "VisaLark", them: "有料プロキシ確保代行（qmq 系など）" },
    rows: [
      { label: "価格", us: "無料 · オープンソース", them: "有料 VIP / サブスク" },
      { label: "アカウント安全性", us: "住宅用 IP + 回避ゼロ、停止リスク最小", them: "クラウドプロキシのローテーション、停止リスク高" },
      { label: "資格情報", us: "ゼロ —— パスワードは端末から出ない", them: "資格情報をホストすることが多い（ハニーポットリスク）" },
      { label: "最人気枠の秒単位「確保」", us: "約束しない（プロキシ戦には参加しない）", them: "住宅用プロキシ IP 群で勝負" },
      { label: "複数領事館", us: "「最早空き」集約をネイティブ対応", them: "サービスによる" },
      { label: "透明性", us: "完全オープンソース、監査可能", them: "クローズドのブラックボックス" },
    ],
    footnote:
      "もし目標が最も人気の数領事館での瞬間的な枠なら、有料プロキシ群の方が確かに速いです —— ただしアカウント停止という実際のリスクを伴います。VisaLark は、安全に、長期的に枠を捕まえたい人向けです。",
  },
  install: {
    eyebrow: "はじめる",
    title: "3 ステップで稼働",
    subtitle: "開始にサーバーは不要。コントロールプレーンは任意のアップグレードです。",
    steps: [
      {
        title: "1 · ブラウザ拡張をインストール",
        body: "Chrome / Edge に VisaLark 拡張（データプレーン）を追加。ログイン中のタブ内でのみ動作します。",
      },
      {
        title: "2 · 自分でビザサイトにログイン",
        body: "いつも通り usvisa-info にサインイン。拡張はログイン済みセッションを再利用し、パスワードを保存することはありません。",
      },
      {
        title: "3 · モニターと通知を設定",
        body: "領事館・ビザ種別・受け入れ可能な日付を選び、Bark / WeChat / Telegram の通知を設定して、あとは任せるだけ。",
      },
    ],
    extensionCta: "ブラウザ拡張をダウンロード",
    agentCta: "ローカル Agent を実行（上級）",
    controlPlaneCta: "コントロールプレーンをセルフホスト（任意）",
  },
  disclaimer: {
    title: "法的・リスクに関する免責事項",
    body: [
      "本プロジェクトは教育および個人利用のみを目的としています。VisaLark は CGI Federal、米国国務省、いかなる政府機関とも提携・認可・推奨関係にありません。",
      "本ツールの使用から生じるすべてのリスク（ビザアカウントの停止、予約の喪失、MRV 手数料の損失を含むがこれに限らない）はあなたが負います。本ソフトウェアは「現状のまま」提供され、明示黙示を問わずいかなる保証もありません。",
      "本リポジトリには検出回避・プロキシローテーション・CAPTCHA 解読のコードは含まれません。対象サイトの利用規約とお住まいの法域の法律を遵守してください。本ページは法的助言ではありません。",
    ],
  },
  footer: {
    tagline: "オープンソースの米国ビザ予約モニター。アカウント安全第一。",
    builtWith: "TypeScript · Next.js · Fastify で構築",
    sections: [
      {
        title: "プロダクト",
        links: [
          { label: "機能", href: "/#features" },
          { label: "安全モデル", href: "/#safety" },
          { label: "ライブデモ", href: "/demo" },
        ],
      },
      {
        title: "ドキュメント",
        links: [
          { label: "クイックスタート", href: "/docs#getting-started" },
          { label: "安全モデル", href: "/docs#safety-model" },
          { label: "コントロールプレーンのセルフホスト", href: "/docs#control-plane" },
          { label: "FAQ", href: "/docs#faq" },
        ],
      },
    ],
    legal: "CGI Federal や米国国務省とは無関係。教育 / 個人利用、自己責任、保証なし。",
  },
  demo: {
    title: "ライブデモ（モックデータ）",
    subtitle: "完全オフラインのインタラクティブデモで、実際のプロダクトの操作感を示します。ネットワーク接続なし、ビザサイトへの接触なし。",
    mockNote: "モックデータ · 実際のネットワークリクエストは一切行いません",
    boardTitle: "領事館別の空き枠ボード",
    heatmapTitle: "枠リリースのヒートマップ",
    heatmapSubtitle: "曜日 × 時間で、過去に見られた枠リリースを表示（濃いほどリリースが多い）",
    bestTime: "最適な確認時間帯",
    monitorTitle: "モニター設定",
    notifyTitle: "通知設定",
    statusLabels: { plenty: "空きあり", scarce: "残りわずか", none: "空きなし" },
    lastUpdated: "更新",
    earliest: "最早",
    readOnly: "読み取り専用デモ",
    fields: {
      cities: "監視する都市",
      visaType: "ビザ種別",
      dateRange: "受け入れ可能な日付範囲",
      dow: "曜日フィルタ",
      mode: "予約モード",
      cadence: "ポーリング頻度",
    },
    modes: { notify: "通知のみ", confirm: "ワンタップ確認", auto: "自動予約変更" },
    channels: { bark: "Bark (iOS)", serverchan: "Server酱 (WeChat)", telegram: "Telegram", webhook: "Webhook" },
    heartbeatNote: "ハートビート有効：枠がなくても定期的に「モニター稼働中」の通知が届きます —— 沈黙 ≠ 枠なし。",
  },
  docs: {
    title: "ドキュメント",
    subtitle: "インストールから安全モデルまですべて。",
    tocTitle: "このページの内容",
  },
};

const ko: Dict = {
  nav: {
    features: "기능",
    safety: "안전 모델",
    docs: "문서",
    demo: "라이브 데모",
    github: "GitHub",
  },
  hero: {
    badge: "오픈소스 · 계정 안전 최우선 · 자격 증명 0",
    title: "VisaLark 签证云雀",
    subtitle: "오픈소스 미국 비자 예약 모니터",
    tagline:
      "놓쳤을 슬롯을 잡아내 면접 예약 확률을 높입니다 —— 대신 「초 단위로 확보」를 약속하지는 않습니다.",
    honestNote:
      "우리는 가혹한 주거용 프록시 IP 군비 경쟁에 참여하지 않습니다(계정 정지와 저장소 삭제를 초래합니다). 안전성, 투명성, 다중 영사관 커버리지, 슬롯 릴리스 패턴 분석으로 승부합니다.",
    ctaInstall: "확장 설치",
    ctaDemo: "라이브 데모 보기",
    ctaDocs: "문서 읽기",
    trustRow: ["주거용 IP 데이터 플레인", "자격 증명 저장 0", "우회 / 탐지 회피 코드 0", "Apache-2.0 오픈소스"],
  },
  what: {
    eyebrow: "무엇을 하는가",
    title: "모니터 우선의 예약 지원 도구",
    body:
      "VisaLark는 당신 자신의 브라우저나 로컬 기기에서 이미 로그인된 비자 사이트 세션을 재사용해 여러 영사관의 빈 슬롯을 감시합니다. 수용 가능한 슬롯이 나오는 순간 멀티채널로 알림을 보냅니다 —— 원탭 예약 변경 확인도 선택할 수 있습니다.",
    points: [
      {
        title: "확보가 아니라 모니터링",
        body: "기본은 알림만. 예약 변경은 파괴적 작업이므로 수술처럼 다루며, 기존 예약을 맹목적으로 포기하지 않습니다.",
      },
      {
        title: "실제 세션 재사용",
        body: "코드는 당신이 로그인한 곳에서 실행되며, 브라우저 자체의 핑거프린트와 쿠키를 사용합니다. 위조하지 않고 비밀번호도 저장하지 않습니다.",
      },
      {
        title: "데이터는 당신의 것",
        body: "선택적 셀프 호스팅 컨트롤 플레인이 이력과 히트맵을 기기 간에 동기화합니다 —— 비자 자격 증명은 하나도 보관하지 않습니다.",
      },
    ],
  },
  safety: {
    eyebrow: "2계층 안전 모델",
    title: "왜 이 설계가 당신의 계정을 보호하는가",
    intro:
      "미국 비자 시스템(CGI Federal / usvisa-info)은 Cloudflare와 reCAPTCHA에 더해 사용자별 행동 ML을 실행합니다. 치명적인 신호는 폴링 빈도가 아니라 ASN / 불가능한 이동의 불일치입니다: 주거용 네트워크에서 로그인했는데 같은 세션이 클라우드 데이터센터 IP에서 가용 API를 호출하면, 이는 교과서적인 계정 탈취 / 자동화 시그니처이며 당신의 실제 비자 계정을 빠르게 정지시킵니다.",
    pillars: [
      {
        title: "주거용 IP 전용 데이터 플레인",
        body: "usvisa-info에 닿는 모든 코드는 당신 자신의 주거용 회선에서 실행됩니다.",
        why: "로그인 위치와 일치하지 않는 클라우드 ASN = 정지 위험이기 때문입니다. 클라우드 IP 폴링을 아키텍처상 불가능하게 만듭니다.",
      },
      {
        title: "자격 증명 0",
        body: "기본은 쿠키 / 세션 재사용만 —— 비자 비밀번호를 저장하지 않습니다. 컨트롤 플레인은 자격 증명에 전혀 닿지 않습니다.",
        why: "자격 증명 허니팟이 없으면 대량 탈취나 컴플라이언스 책임 위험도 없습니다 —— 그것이 당신과 우리를 보호합니다.",
      },
      {
        title: "우회 코드 0",
        body: "프록시 로테이션 없음, 핑거프린트 위조 없음, CAPTCHA 해독 없음, TLS 위장 없음.",
        why: "이것은 계정 방패이자 법적 방패입니다. CAPTCHA / 401 / 403 / 1015를 만나면 중단하고 알립니다 —— 절대 강행하지 않습니다.",
      },
    ],
    planes: {
      dataTitle: "데이터 플레인(당신의 주거용 네트워크 상)",
      dataBody:
        "브라우저 확장(MV3) 또는 로컬 Agent. usvisa-info와 세션 쿠키에 닿는 유일한 부분입니다. 실제 브라우저 세션을 재사용하며 보수적이고 지터가 적용된 폴링을 합니다.",
      controlTitle: "컨트롤 플레인(선택 · 자격 증명 0)",
      controlBody:
        "apps/web(Vercel) + apps/control-plane(Oracle 무료 VM). 랜딩, 문서, 데모, 이력과 히트맵, 알림 중계만 담당합니다. 비자 사이트를 폴링하지 않습니다.",
    },
    diagram: {
      aria: "2계층 아키텍처 다이어그램: 주거용 데이터 플레인과 중계 컨트롤 플레인",
      dataTitle: "데이터 플레인",
      dataSub: "당신의 주거용 네트워크",
      dataLine1: "브라우저 확장 / 로컬 Agent",
      dataLine2: "실제 세션 · 주거용 IP · 자격 증명 0",
      controlTitle: "컨트롤 플레인",
      controlSub: "선택적 중계 · 자격 증명 0",
      controlLine1: "이력 · 히트맵 · 알림 중계",
      controlLine2: "비자 사이트를 폴링하지 않음",
      flowLabel: "가용성 이력만(선택)",
      notifyLabel: "휴대폰으로 푸시",
      caption: "비자 사이트에 닿는 것은 데이터 플레인뿐 —— 그것도 당신 자신의 주거용 네트워크에서만 실행됩니다.",
    },
  },
  features: {
    eyebrow: "기능",
    title: "필요한 모든 것, 감수하면 안 될 위험은 0",
    subtitle: "MVP와 v1의 차별화 기능은 모두 「안전하게 명중률을 높인다」를 축으로 합니다.",
    items: [
      {
        title: "다중 영사관 최단 슬롯",
        body: "「수용 가능한 도시 중 가장 이른 슬롯」 —— 여러 영사관을 동시에 감시하고 최단 날짜를 자동 집계합니다.",
        icon: "globe",
      },
      {
        title: "원탭 확인",
        body: "슬롯 발견 → 원탭 버튼이 있는 알림 → 웜 세션으로 빠른 예약 변경 시도(실험적: 예약 변경 흐름은 실제 계정에서 미검증. 결과가 불명확하면 수동 확인 요청). 항상 사람이 관여합니다.",
        icon: "tap",
      },
      {
        title: "멀티채널 알림",
        body: "Bark(iOS), Server酱(WeChat), Telegram, Webhook. 중국 도달을 우선하며 높은 우선순위 이벤트는 모든 채널로 중복 발송합니다.",
        icon: "bell",
      },
      {
        title: "캘린더 히트맵",
        body: "당신 자신의 폴링 이력을 7×24 히트맵으로 만들어 슬롯이 언제 풀리는지 한눈에 파악할 수 있습니다.",
        icon: "calendar",
      },
      {
        title: "최적 확인 시간대",
        body: "릴리스 패턴 학습이 어느 시간대에 슬롯이 가장 많이 열리는지 계산합니다 —— 명중률을 높이면서 폴링은 줄입니다.",
        icon: "spark",
      },
      {
        title: "긴급 슬롯 & 필터",
        body: "expedite / 긴급 캘린더를 감시하고 날짜 범위·요일·시간대의 세밀한 필터를 지원합니다.",
        icon: "filter",
      },
    ],
  },
  compare: {
    eyebrow: "솔직한 비교",
    title: "VisaLark vs 유료 「확보 대행」 서비스",
    subtitle: "우리는 30초 군비 경쟁에서 이길 수 있는 척하지 않습니다. 트레이드오프를 솔직히 보여줍니다.",
    columns: { us: "VisaLark", them: "유료 프록시 확보 대행(qmq 계열 등)" },
    rows: [
      { label: "가격", us: "무료 · 오픈소스", them: "유료 VIP / 구독" },
      { label: "계정 안전성", us: "주거용 IP + 우회 0, 정지 위험 최소", them: "클라우드 프록시 로테이션, 정지 위험 높음" },
      { label: "자격 증명", us: "0 —— 비밀번호가 기기를 벗어나지 않음", them: "자격 증명을 호스팅하는 경우가 많음(허니팟 위험)" },
      { label: "최인기 슬롯의 초 단위 「확보」", us: "약속하지 않음(프록시 전쟁에 불참)", them: "주거용 프록시 IP 군으로 승부" },
      { label: "다중 영사관", us: "「최단 가용」 집계 네이티브 지원", them: "서비스에 따라 다름" },
      { label: "투명성", us: "완전 오픈소스, 감사 가능", them: "비공개 블랙박스" },
    ],
    footnote:
      "목표가 가장 인기 있는 몇몇 영사관의 순간적인 슬롯이라면, 유료 프록시 군이 확실히 빠릅니다 —— 다만 계정 정지라는 실제 위험을 감수해야 합니다. VisaLark는 안전하게, 장기적으로 슬롯을 잡고 싶은 사람을 위한 것입니다.",
  },
  install: {
    eyebrow: "시작하기",
    title: "3단계로 실행",
    subtitle: "시작에 서버는 필요 없습니다. 컨트롤 플레인은 선택적 업그레이드입니다.",
    steps: [
      {
        title: "1 · 브라우저 확장 설치",
        body: "Chrome / Edge에 VisaLark 확장(데이터 플레인)을 추가하세요. 로그인된 탭 안에서만 동작합니다.",
      },
      {
        title: "2 · 직접 비자 사이트에 로그인",
        body: "평소처럼 usvisa-info에 로그인하세요. 확장은 로그인된 세션을 재사용하며 비밀번호를 저장하지 않습니다.",
      },
      {
        title: "3 · 모니터 & 알림 설정",
        body: "영사관·비자 종류·수용 가능한 날짜를 고르고 Bark / WeChat / Telegram 알림을 설정한 뒤 맡겨두세요.",
      },
    ],
    extensionCta: "브라우저 확장 다운로드",
    agentCta: "로컬 Agent 실행(고급)",
    controlPlaneCta: "컨트롤 플레인 셀프 호스팅(선택)",
  },
  disclaimer: {
    title: "법적 · 위험 고지",
    body: [
      "본 프로젝트는 교육 및 개인 용도로만 사용됩니다. VisaLark는 CGI Federal, 미국 국무부 또는 어떤 정부 기관과도 제휴·승인·보증 관계가 없습니다.",
      "본 도구 사용으로 발생하는 모든 위험(비자 계정 정지, 예약 손실, MRV 수수료 손실을 포함하되 이에 국한되지 않음)은 당신이 부담합니다. 본 소프트웨어는 「있는 그대로」 제공되며 명시적·묵시적 어떤 보증도 하지 않습니다.",
      "본 저장소에는 탐지 회피·프록시 로테이션·CAPTCHA 해독 코드가 포함되지 않습니다. 대상 사이트의 이용 약관과 거주 관할권의 법률을 준수하세요. 본 페이지는 법적 조언이 아닙니다.",
    ],
  },
  footer: {
    tagline: "오픈소스 미국 비자 예약 모니터. 계정 안전 최우선.",
    builtWith: "TypeScript · Next.js · Fastify로 구축",
    sections: [
      {
        title: "제품",
        links: [
          { label: "기능", href: "/#features" },
          { label: "안전 모델", href: "/#safety" },
          { label: "라이브 데모", href: "/demo" },
        ],
      },
      {
        title: "문서",
        links: [
          { label: "빠른 시작", href: "/docs#getting-started" },
          { label: "안전 모델", href: "/docs#safety-model" },
          { label: "컨트롤 플레인 셀프 호스팅", href: "/docs#control-plane" },
          { label: "FAQ", href: "/docs#faq" },
        ],
      },
    ],
    legal: "CGI Federal 또는 미국 국무부와 무관. 교육 / 개인 용도, 본인 책임, 보증 없음.",
  },
  demo: {
    title: "라이브 데모(모의 데이터)",
    subtitle: "완전 오프라인 인터랙티브 데모로 실제 제품의 사용감을 보여줍니다. 네트워크 연결 없음, 비자 사이트 접촉 없음.",
    mockNote: "모의 데이터 · 실제 네트워크 요청을 일절 하지 않음",
    boardTitle: "영사관별 가용 슬롯 보드",
    heatmapTitle: "슬롯 릴리스 히트맵",
    heatmapSubtitle: "요일 × 시간으로 과거에 본 슬롯 릴리스를 표시(진할수록 릴리스 많음)",
    bestTime: "최적 확인 시간대",
    monitorTitle: "모니터 설정",
    notifyTitle: "알림 설정",
    statusLabels: { plenty: "여유", scarce: "부족", none: "없음" },
    lastUpdated: "업데이트",
    earliest: "최단",
    readOnly: "읽기 전용 데모",
    fields: {
      cities: "감시 도시",
      visaType: "비자 종류",
      dateRange: "수용 가능한 날짜 범위",
      dow: "요일 필터",
      mode: "예약 모드",
      cadence: "폴링 주기",
    },
    modes: { notify: "알림만", confirm: "원탭 확인", auto: "자동 예약 변경" },
    channels: { bark: "Bark (iOS)", serverchan: "Server酱 (WeChat)", telegram: "Telegram", webhook: "Webhook" },
    heartbeatNote: "하트비트 켜짐: 슬롯이 없어도 주기적으로 「모니터 작동 중」 알림이 옵니다 —— 침묵 ≠ 슬롯 없음.",
  },
  docs: {
    title: "문서",
    subtitle: "설치부터 안전 모델까지 모든 것.",
    tocTitle: "이 페이지에서",
  },
};

export const DICT: Record<Locale, Dict> = { zh, en, ja, ko };
