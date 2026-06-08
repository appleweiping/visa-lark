import type { Metadata, Viewport } from "next";
import { LocaleProvider } from "@/lib/locale-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://visalark.example.com"),
  title: {
    default: "VisaLark 签证云雀 — open-source US visa appointment monitor",
    template: "%s · VisaLark",
  },
  description:
    "Open-source US visa appointment monitor. Residential-IP, zero-credential, zero-evasion. Improve your odds and catch slots you'd otherwise miss — safely.",
  keywords: [
    "US visa appointment",
    "visa monitor",
    "签证 监控",
    "usvisa-info",
    "美国签证 预约",
    "open source",
  ],
  authors: [{ name: "VisaLark" }],
  openGraph: {
    title: "VisaLark 签证云雀 — open-source US visa appointment monitor",
    description:
      "Account-safety first. Residential-IP, zero-credential, zero-evasion. Catch slots you'd otherwise miss.",
    type: "website",
    images: ["/banner.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "VisaLark 签证云雀",
    description: "Open-source US visa appointment monitor. Account-safety first.",
    images: ["/banner.png"],
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
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <LocaleProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </LocaleProvider>
      </body>
    </html>
  );
}
