import type { Metadata, Viewport } from "next";
import { LocaleProvider } from "@/lib/locale-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { SITE_URL } from "@/lib/site";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const DESCRIPTION =
  "Checks the US visa appointment calendar from your own logged-in browser and notifies you (Bark, WeChat, Telegram) when an earlier date opens.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "VisaLark 签证云雀 — US visa appointment monitor",
    template: "%s · VisaLark",
  },
  description: DESCRIPTION,
  keywords: [
    "US visa appointment",
    "visa monitor",
    "签证 监控",
    "usvisa-info",
    "美国签证 预约",
    "open source",
  ],
  authors: [{ name: "Weiping Yan", url: "https://github.com/appleweiping" }],
  icons: { icon: "/mascot.png" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "VisaLark 签证云雀",
    locale: "zh_CN",
    alternateLocale: ["en_US", "ja_JP", "ko_KR"],
    title: "VisaLark 签证云雀 — US visa appointment monitor",
    description: DESCRIPTION,
    images: [
      {
        url: "/popup.png",
        width: 768,
        height: 1422,
        alt: "The VisaLark extension popup with session status, monitors and recent checks",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "VisaLark 签证云雀 — US visa appointment monitor",
    description: DESCRIPTION,
    images: ["/popup.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

// Applied before paint to avoid a dark-mode flash.
const themeScript = `
(function(){try{
  var s = localStorage.getItem('visalark.theme');
  var d = s ? s === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (d) document.documentElement.classList.add('dark');
}catch(e){}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <LocaleProvider>
          <TooltipProvider delayDuration={150}>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </TooltipProvider>
        </LocaleProvider>
        <Toaster />
      </body>
    </html>
  );
}
