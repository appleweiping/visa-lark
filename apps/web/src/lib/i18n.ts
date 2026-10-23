/**
 * Site copy in zh (primary), en, ja and ko. The tool only notifies you sooner;
 * keep the copy from promising that it will win a slot.
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
    badge: "开源 · 个人项目",
    title: "VisaLark 签证云雀",
    subtitle: "开源的美国签证预约监控器",
    tagline:
      "在你已经登录的浏览器里每隔几分钟查一次预约日历，出现更早的日期就推送到你的手机。它不会去抢那些几秒内就消失的名额。",
    ctaInstall: "安装扩展",
    ctaDemo: "查看在线演示",
    ctaDocs: "阅读文档",
    trustRow: ["在你自己的网络上运行", "不保存密码", "不破解验证码、不用代理", "Apache-2.0"],
  },
  what: {
    eyebrow: "它做什么",
    title: "先监控，再帮你预约",
    body:
      "VisaLark 在你自己的浏览器或家里的电脑上，复用你已经登录的会话，同时盯多个领馆的可约日期。出现你能接受的日期时推送到手机；如果你愿意，通知里可以带一个按钮，点一下就帮你改期。",
    points: [
      {
        title: "默认只通知",
        body: "改期会替换你现有的预约，所以默认关闭。自动模式只会预约比现有日期早出你设定天数、并且在你允许的领馆的名额。",
      },
      {
        title: "用你真实的会话",
        body: "代码在你登录的地方运行，用浏览器自己的 Cookie。不伪造任何东西，也不保存密码。",
      },
      {
        title: "可选的历史服务",
        body: "一个自托管的小服务可以保存你见过的日期，以及名额出现时间的热力图。它永远拿不到你的签证账号。",
      },
    ],
  },
  safety: {
    eyebrow: "安全模型",
    title: "为什么要在你自己的网络上运行",
    intro:
      "预约网站前面有 Cloudflare 和 reCAPTCHA。我最担心的信号不是查询频率，而是请求从哪里来：用家里的网络登录，同一会话却从云数据中心去查名额，看起来就像账号被盗，可能导致真实的签证账号被停用。",
    pillars: [
      {
        title: "只在住宅网络上运行",
        body: "所有访问签证网站的代码都跑在你自己家的网络上。",
        why: "云服务器的网络和你的登录地不一致，是常见的盗号信号。本地 Agent 检测到数据中心网络时会拒绝启动，除非你手动覆盖。",
      },
      {
        title: "不保存凭据",
        body: "扩展复用你的会话，看不到你的密码。控制面完全不接收凭据。",
        why: "不存登录信息，控制面上就没有值得偷的东西。",
      },
      {
        title: "没有绕过代码",
        body: "没有代理轮换、没有指纹伪造、没有验证码破解、没有 TLS 伪装。",
        why: "遇到验证码 / 401 / 403 / 1015，监控会停下并通知你，绝不硬闯。",
      },
    ],
    planes: {
      dataTitle: "数据面（在你的住宅网络）",
      dataBody:
        "浏览器扩展（MV3）或本地 Agent。它是唯一会访问签证网站、持有会话 Cookie 的部分。查询很慢，并带随机抖动。",
      controlTitle: "控制面（可选 · 不接触凭据）",
      controlBody:
        "apps/web（本站，部署在 Vercel）和 apps/control-plane（你自己托管的小服务）。只做文档、演示、历史、热力图和通知中转。永不查询签证网站。",
    },
    diagram: {
      aria: "双平面架构示意图：住宅数据面与中转控制面",
      dataTitle: "数据面",
      dataSub: "你的住宅网络",
      dataLine1: "浏览器扩展 / 本地 Agent",
      dataLine2: "真实会话 · 住宅 IP · 不存密码",
      controlTitle: "控制面",
      controlSub: "可选中转 · 不接触凭据",
      controlLine1: "历史 · 热力图 · 通知中转",
      controlLine2: "永不轮询签证网站",
      flowLabel: "仅可用性历史（可选）",
      notifyLabel: "推送到你的手机",
      caption: "只有数据面接触签证网站——并且它只运行在你自己的住宅网络上。",
    },
  },
  features: {
    eyebrow: "功能",
    title: "v0.1 里有什么",
    subtitle: "扩展和本地 Agent 共用同一套核心代码。热力图和最佳时段统计需要可选的控制面。",
    items: [
      {
        title: "多领馆同时监控",
        body: "一个监控里同时盯多个领馆，给出符合你过滤条件的最早日期。",
        icon: "globe",
      },
      {
        title: "在通知里确认改期",
        body: "通知可以带一个按钮，打开确认页，点一下就用你已登录的会话改期。实验性功能：尚未在真实账号上完整验证，结果不确定时会让你手动核对。",
        icon: "tap",
      },
      {
        title: "多渠道通知",
        body: "Bark（iOS）、Server酱（微信）、Telegram、Webhook 和浏览器通知。Bark 和 Server酱在大陆可用。",
        icon: "bell",
      },
      {
        title: "热力图",
        body: "配合控制面，把你自己的查询历史画成 7×24 热力图，看名额都在什么时候出现。",
        icon: "calendar",
      },
      {
        title: "最佳查询时段",
        body: "控制面按你历史里新名额出现的次数，给一天中的各个小时排序。",
        icon: "spark",
      },
      {
        title: "加急日历与过滤",
        body: "也可以监控加急（expedite）日历，并按日期范围、星期和时段过滤。",
        icon: "filter",
      },
    ],
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
    tagline: "在你自己的浏览器里运行的美国签证预约监控器。",
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
    subtitle: "离线演示，数据是编的。不发任何网络请求，也不访问签证网站。",
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
    badge: "Open source · personal project",
    title: "VisaLark",
    subtitle: "Open-source US visa appointment monitor",
    tagline:
      "It checks the appointment calendar every few minutes from the browser you already logged into and pings your phone when an earlier date opens. It does not try to win slots that vanish within seconds.",
    ctaInstall: "Install the extension",
    ctaDemo: "See the live demo",
    ctaDocs: "Read the docs",
    trustRow: ["Runs on your own network", "No stored password", "No CAPTCHA solving, no proxies", "Apache-2.0"],
  },
  what: {
    eyebrow: "What it does",
    title: "A monitor first, a booking helper second",
    body:
      "VisaLark watches appointment availability at several consulates from your own browser or a computer at home, reusing the session you are already logged into. When a date you would accept shows up, it alerts your phone; if you want, the alert can carry a button that reschedules for you.",
    points: [
      {
        title: "Notify by default",
        body: "Rescheduling replaces your current appointment, so it is off unless you turn it on. Auto mode only books a date that is earlier by the margin you set, at a consulate you allowed.",
      },
      {
        title: "Your real session",
        body: "The code runs where you logged in and uses your browser's own cookie. Nothing is faked and no password is stored.",
      },
      {
        title: "Optional history server",
        body: "A small self-hosted service can keep the dates you have seen and a heatmap of when slots appear. It never receives your visa login.",
      },
    ],
  },
  safety: {
    eyebrow: "Safety model",
    title: "Why it runs on your own network",
    intro:
      "The appointment site sits behind Cloudflare and reCAPTCHA. The signal I worry about most is not how often you check but where the requests come from: logging in from a home connection and then querying the same session from a cloud datacenter looks like account takeover, and can get the real visa account suspended.",
    pillars: [
      {
        title: "Residential network only",
        body: "All code that talks to the visa site runs on your own home connection.",
        why: "A cloud network that doesn't match where you logged in is a common takeover signal. The local agent refuses to start on a datacenter network unless you override it.",
      },
      {
        title: "No stored credentials",
        body: "The extension reuses your session and never sees your password. The control plane never receives credentials at all.",
        why: "With no stored logins there is nothing worth stealing from the control plane.",
      },
      {
        title: "No evasion code",
        body: "No proxy rotation, no fingerprint spoofing, no CAPTCHA solving, no TLS impersonation.",
        why: "On a CAPTCHA, 401, 403 or 1015 the monitor stops and tells you. It never retries through a challenge.",
      },
    ],
    planes: {
      dataTitle: "Data plane (on your residential network)",
      dataBody:
        "Browser extension (MV3) or local agent. The only part that ever talks to the visa site or holds a session cookie. It checks slowly, with random jitter.",
      controlTitle: "Control plane (optional, no credentials)",
      controlBody:
        "apps/web (this site, on Vercel) and apps/control-plane (a small server you host yourself). Docs, demo, history, heatmap and notification relay only. Never polls the visa site.",
    },
    diagram: {
      aria: "Two-plane architecture diagram: residential data plane and relay control plane",
      dataTitle: "Data plane",
      dataSub: "your residential network",
      dataLine1: "Browser extension / local agent",
      dataLine2: "real session · residential IP · no stored password",
      controlTitle: "Control plane",
      controlSub: "optional relay · no credentials",
      controlLine1: "history · heatmap · notification relay",
      controlLine2: "never polls the visa site",
      flowLabel: "availability history only (optional)",
      notifyLabel: "push to your phone",
      caption: "Only the data plane ever touches the visa site — and it only runs on your own residential network.",
    },
  },
  features: {
    eyebrow: "Features",
    title: "What is in v0.1",
    subtitle: "The extension and the local agent share the same core. The heatmap and best-hour stats need the optional control plane.",
    items: [
      {
        title: "Several consulates at once",
        body: "Watch several consulates in one monitor and get the earliest date that fits your filters.",
        icon: "globe",
      },
      {
        title: "Confirm from the alert",
        body: "The alert can carry a button that opens a confirmation page; one click reschedules with your logged-in session. Experimental: not verified end to end on real accounts, and unclear results ask you to check manually.",
        icon: "tap",
      },
      {
        title: "Notifications",
        body: "Bark (iOS), ServerChan (WeChat), Telegram, a webhook and browser notifications. Bark and ServerChan work from mainland China.",
        icon: "bell",
      },
      {
        title: "Heatmap",
        body: "With the control plane, your own poll history becomes a 7×24 heatmap of when slots appeared.",
        icon: "calendar",
      },
      {
        title: "Best hour to check",
        body: "The control plane ranks the hours of the day by how often new slots showed up in your history.",
        icon: "spark",
      },
      {
        title: "Expedite calendar and filters",
        body: "Watch the expedite calendar too, and filter by date range, day of week and time of day.",
        icon: "filter",
      },
    ],
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
    tagline: "A US visa appointment monitor that runs in your own browser.",
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
    subtitle: "An offline demo with made-up data. It makes no network requests and never contacts the visa site.",
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
    badge: "オープンソース · 個人プロジェクト",
    title: "VisaLark 签证云雀",
    subtitle: "オープンソースの米国ビザ予約モニター",
    tagline:
      "ログイン済みのブラウザから数分おきに予約カレンダーを確認し、より早い日付が空いたらスマホに通知します。数秒で消える枠を取りに行くことはしません。",
    ctaInstall: "拡張をインストール",
    ctaDemo: "ライブデモを見る",
    ctaDocs: "ドキュメントを読む",
    trustRow: ["自宅のネットワークで動作", "パスワードを保存しない", "CAPTCHA 解読・プロキシなし", "Apache-2.0"],
  },
  what: {
    eyebrow: "何をするか",
    title: "まず監視、予約は補助",
    body:
      "VisaLark は、あなたのブラウザまたは自宅の PC で、ログイン済みのセッションを再利用して複数の領事館の空き枠を監視します。受け入れられる日付が出たらスマホに通知し、希望すれば通知のボタンから予約変更もできます。",
    points: [
      {
        title: "デフォルトは通知のみ",
        body: "予約変更は現在の予約を置き換えるため、既定ではオフです。自動モードは、設定した日数以上早く、許可した領事館の枠だけを予約します。",
      },
      {
        title: "本物のセッションを使う",
        body: "コードはログインした場所で動き、ブラウザ自身の Cookie を使います。何も偽装せず、パスワードも保存しません。",
      },
      {
        title: "任意の履歴サーバー",
        body: "セルフホストの小さなサービスで、見た日付と枠が出た時間帯のヒートマップを保存できます。ビザのログイン情報は受け取りません。",
      },
    ],
  },
  safety: {
    eyebrow: "安全モデル",
    title: "なぜ自分のネットワークで動かすのか",
    intro:
      "予約サイトは Cloudflare と reCAPTCHA の背後にあります。私が一番気にしているのは確認の頻度ではなく、リクエストの出どころです。自宅の回線でログインしたのに、同じセッションがクラウドのデータセンターから空き枠を問い合わせると、アカウント乗っ取りのように見え、本物のビザアカウントが停止される可能性があります。",
    pillars: [
      {
        title: "住宅用ネットワークのみ",
        body: "ビザサイトにアクセスするコードはすべて自宅の回線で動きます。",
        why: "ログイン地と一致しないクラウドのネットワークは、よくある乗っ取りのシグナルです。ローカル Agent はデータセンターのネットワークでは起動を拒否します（手動で上書きできます）。",
      },
      {
        title: "資格情報を保存しない",
        body: "拡張はセッションを再利用するだけで、パスワードは見ません。コントロールプレーンは資格情報を一切受け取りません。",
        why: "ログイン情報を保存しなければ、コントロールプレーンに盗む価値のあるものはありません。",
      },
      {
        title: "回避コードなし",
        body: "プロキシのローテーションなし、指紋偽装なし、CAPTCHA 解読なし、TLS なりすましなし。",
        why: "CAPTCHA / 401 / 403 / 1015 に遭遇したら監視を止めて通知します。チャレンジを突破しようとはしません。",
      },
    ],
    planes: {
      dataTitle: "データプレーン（あなたの住宅用ネットワーク上）",
      dataBody:
        "ブラウザ拡張（MV3）またはローカル Agent。ビザサイトにアクセスし、セッション Cookie を持つ唯一の部分です。確認はゆっくり、ランダムな揺らぎ付きで行います。",
      controlTitle: "コントロールプレーン（任意 · 資格情報なし）",
      controlBody:
        "apps/web（このサイト、Vercel）と apps/control-plane（自分でホストする小さなサーバー）。ドキュメント、デモ、履歴、ヒートマップ、通知の中継のみ。ビザサイトはポーリングしません。",
    },
    diagram: {
      aria: "2 層アーキテクチャ図：住宅用データプレーンと中継コントロールプレーン",
      dataTitle: "データプレーン",
      dataSub: "あなたの住宅用ネットワーク",
      dataLine1: "ブラウザ拡張 / ローカル Agent",
      dataLine2: "本物のセッション · 住宅用 IP · パスワード保存なし",
      controlTitle: "コントロールプレーン",
      controlSub: "任意の中継 · 資格情報なし",
      controlLine1: "履歴 · ヒートマップ · 通知中継",
      controlLine2: "ビザサイトはポーリングしない",
      flowLabel: "空き枠履歴のみ（任意）",
      notifyLabel: "スマホへプッシュ",
      caption: "ビザサイトに触れるのはデータプレーンだけ —— それもあなた自身の住宅用ネットワーク上だけで動きます。",
    },
  },
  features: {
    eyebrow: "機能",
    title: "v0.1 でできること",
    subtitle: "拡張とローカル Agent は同じコアを共有しています。ヒートマップと最適時間帯の集計には任意のコントロールプレーンが必要です。",
    items: [
      {
        title: "複数の領事館を同時に",
        body: "1 つのモニターで複数の領事館を監視し、フィルタに合う最も早い日付を返します。",
        icon: "globe",
      },
      {
        title: "通知から予約変更を確認",
        body: "通知のボタンから確認ページを開き、1 クリックでログイン済みのセッションを使って予約変更します。実験的機能：実アカウントでのエンドツーエンド検証はまだで、結果が不明確な場合は手動確認を求めます。",
        icon: "tap",
      },
      {
        title: "マルチチャネル通知",
        body: "Bark（iOS）、Server酱（WeChat）、Telegram、Webhook、ブラウザ通知。Bark と Server酱は中国本土からも届きます。",
        icon: "bell",
      },
      {
        title: "ヒートマップ",
        body: "コントロールプレーンを使うと、自分のポーリング履歴から枠が出た時間帯を 7×24 のヒートマップにできます。",
        icon: "calendar",
      },
      {
        title: "最適な確認時間帯",
        body: "コントロールプレーンが、履歴の中で新しい枠が出た頻度で 1 日の各時間帯を順位付けします。",
        icon: "spark",
      },
      {
        title: "緊急枠とフィルタ",
        body: "expedite（緊急）カレンダーも監視でき、日付範囲・曜日・時間帯で絞り込めます。",
        icon: "filter",
      },
    ],
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
    tagline: "自分のブラウザで動く米国ビザ予約モニター。",
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
    subtitle: "作り物のデータを使ったオフラインのデモです。ネットワークリクエストは送らず、ビザサイトにもアクセスしません。",
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
    badge: "오픈소스 · 개인 프로젝트",
    title: "VisaLark 签证云雀",
    subtitle: "오픈소스 미국 비자 예약 모니터",
    tagline:
      "이미 로그인한 브라우저에서 몇 분마다 예약 캘린더를 확인하고, 더 이른 날짜가 열리면 휴대폰으로 알려 줍니다. 몇 초 만에 사라지는 슬롯을 잡으려 하지는 않습니다.",
    ctaInstall: "확장 설치",
    ctaDemo: "라이브 데모 보기",
    ctaDocs: "문서 읽기",
    trustRow: ["내 네트워크에서 실행", "비밀번호 저장 안 함", "CAPTCHA 해독·프록시 없음", "Apache-2.0"],
  },
  what: {
    eyebrow: "무엇을 하는가",
    title: "모니터링이 먼저, 예약은 보조",
    body:
      "VisaLark는 내 브라우저나 집에 있는 컴퓨터에서 이미 로그인한 세션을 재사용해 여러 영사관의 빈 슬롯을 감시합니다. 받아들일 수 있는 날짜가 나오면 휴대폰으로 알리고, 원하면 알림의 버튼으로 예약 변경도 할 수 있습니다.",
    points: [
      {
        title: "기본은 알림만",
        body: "예약 변경은 현재 예약을 대체하므로 기본적으로 꺼져 있습니다. 자동 모드는 설정한 일수 이상 이르고, 허용한 영사관의 슬롯만 예약합니다.",
      },
      {
        title: "실제 세션 사용",
        body: "코드는 로그인한 곳에서 실행되며 브라우저 자체의 쿠키를 사용합니다. 아무것도 위조하지 않고 비밀번호도 저장하지 않습니다.",
      },
      {
        title: "선택적 이력 서버",
        body: "직접 호스팅하는 작은 서비스가 본 날짜와 슬롯이 나온 시간대의 히트맵을 보관할 수 있습니다. 비자 로그인 정보는 받지 않습니다.",
      },
    ],
  },
  safety: {
    eyebrow: "안전 모델",
    title: "왜 내 네트워크에서 실행하는가",
    intro:
      "예약 사이트는 Cloudflare와 reCAPTCHA 뒤에 있습니다. 제가 가장 걱정하는 신호는 확인 빈도가 아니라 요청이 어디서 오는가입니다. 집 회선으로 로그인한 세션이 클라우드 데이터센터에서 슬롯을 조회하면 계정 탈취처럼 보이고, 실제 비자 계정이 정지될 수 있습니다.",
    pillars: [
      {
        title: "주거용 네트워크 전용",
        body: "비자 사이트에 접근하는 모든 코드는 집 회선에서 실행됩니다.",
        why: "로그인 위치와 맞지 않는 클라우드 네트워크는 흔한 탈취 신호입니다. 로컬 Agent는 데이터센터 네트워크에서는 시작을 거부합니다(수동으로 무시할 수 있습니다).",
      },
      {
        title: "자격 증명 저장 안 함",
        body: "확장은 세션을 재사용할 뿐 비밀번호를 보지 않습니다. 컨트롤 플레인은 자격 증명을 전혀 받지 않습니다.",
        why: "로그인 정보를 저장하지 않으니 컨트롤 플레인에는 훔칠 만한 것이 없습니다.",
      },
      {
        title: "우회 코드 없음",
        body: "프록시 로테이션 없음, 핑거프린트 위조 없음, CAPTCHA 해독 없음, TLS 위장 없음.",
        why: "CAPTCHA / 401 / 403 / 1015를 만나면 모니터를 멈추고 알립니다. 챌린지를 뚫으려 하지 않습니다.",
      },
    ],
    planes: {
      dataTitle: "데이터 플레인(당신의 주거용 네트워크 상)",
      dataBody:
        "브라우저 확장(MV3) 또는 로컬 Agent. 비자 사이트에 접근하고 세션 쿠키를 가진 유일한 부분입니다. 무작위 지터를 두고 천천히 확인합니다.",
      controlTitle: "컨트롤 플레인(선택 · 자격 증명 없음)",
      controlBody:
        "apps/web(이 사이트, Vercel)과 apps/control-plane(직접 호스팅하는 작은 서버). 문서, 데모, 이력, 히트맵, 알림 중계만 합니다. 비자 사이트를 폴링하지 않습니다.",
    },
    diagram: {
      aria: "2계층 아키텍처 다이어그램: 주거용 데이터 플레인과 중계 컨트롤 플레인",
      dataTitle: "데이터 플레인",
      dataSub: "당신의 주거용 네트워크",
      dataLine1: "브라우저 확장 / 로컬 Agent",
      dataLine2: "실제 세션 · 주거용 IP · 비밀번호 저장 안 함",
      controlTitle: "컨트롤 플레인",
      controlSub: "선택적 중계 · 자격 증명 없음",
      controlLine1: "이력 · 히트맵 · 알림 중계",
      controlLine2: "비자 사이트를 폴링하지 않음",
      flowLabel: "가용성 이력만(선택)",
      notifyLabel: "휴대폰으로 푸시",
      caption: "비자 사이트에 닿는 것은 데이터 플레인뿐 —— 그것도 당신 자신의 주거용 네트워크에서만 실행됩니다.",
    },
  },
  features: {
    eyebrow: "기능",
    title: "v0.1에 들어 있는 것",
    subtitle: "확장과 로컬 Agent는 같은 코어를 공유합니다. 히트맵과 최적 시간대 통계에는 선택적 컨트롤 플레인이 필요합니다.",
    items: [
      {
        title: "여러 영사관 동시 감시",
        body: "하나의 모니터로 여러 영사관을 감시하고 필터에 맞는 가장 이른 날짜를 알려 줍니다.",
        icon: "globe",
      },
      {
        title: "알림에서 예약 변경 확인",
        body: "알림의 버튼으로 확인 페이지를 열고, 한 번 클릭하면 로그인된 세션으로 예약을 변경합니다. 실험적 기능: 실제 계정에서 처음부터 끝까지 검증되지 않았으며, 결과가 불분명하면 수동 확인을 요청합니다.",
        icon: "tap",
      },
      {
        title: "멀티채널 알림",
        body: "Bark(iOS), Server酱(WeChat), Telegram, Webhook, 브라우저 알림. Bark와 Server酱은 중국 본토에서도 도달합니다.",
        icon: "bell",
      },
      {
        title: "히트맵",
        body: "컨트롤 플레인을 쓰면 내 폴링 이력으로 슬롯이 나온 시간대를 7×24 히트맵으로 볼 수 있습니다.",
        icon: "calendar",
      },
      {
        title: "최적 확인 시간대",
        body: "컨트롤 플레인이 이력에서 새 슬롯이 나온 빈도로 하루의 각 시간대에 순위를 매깁니다.",
        icon: "spark",
      },
      {
        title: "긴급 캘린더와 필터",
        body: "expedite(긴급) 캘린더도 감시할 수 있고, 날짜 범위·요일·시간대로 거를 수 있습니다.",
        icon: "filter",
      },
    ],
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
    tagline: "내 브라우저에서 실행되는 미국 비자 예약 모니터.",
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
    subtitle: "만들어 낸 데이터로 동작하는 오프라인 데모입니다. 네트워크 요청을 보내지 않으며 비자 사이트에 접근하지 않습니다.",
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
