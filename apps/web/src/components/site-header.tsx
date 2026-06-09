"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { LocaleToggle } from "./locale-toggle";
import { ThemeToggle } from "./theme-toggle";

const GITHUB_URL = "https://github.com/appleweiping/visa-lark";

export function SiteHeader() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/#features", label: t.nav.features },
    { href: "/#safety", label: t.nav.safety },
    { href: "/docs", label: t.nav.docs },
    { href: "/demo", label: t.nav.demo },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/80">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-white">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-lark-500 to-lark-700 text-white shadow-md shadow-lark-600/30">
            {/* lark mark — replaced by /mascot.png art later */}
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path d="M3 14c4-1 6-4 7-8 1 3 3 5 6 5l-3 3 4 1-5 2-2 4-1-5-6-2z" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-lg">VisaLark</span>
          <span className="hidden text-sm font-medium text-slate-400 sm:inline">签证云雀</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-lark-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LocaleToggle />
          <ThemeToggle />
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="btn-ghost hidden px-3 py-2 sm:inline-flex">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M12 .5A11.5 11.5 0 008.4 22.9c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 016 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.7.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A11.5 11.5 0 0012 .5z" />
            </svg>
            <span className="hidden lg:inline">{t.nav.github}</span>
          </a>
          <button
            type="button"
            className="btn-ghost px-2.5 py-2 md:hidden"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-slate-200 bg-white px-5 py-3 md:hidden dark:border-slate-800 dark:bg-slate-950" aria-label="Mobile">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {l.label}
            </Link>
          ))}
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
            {t.nav.github}
          </a>
        </nav>
      )}
    </header>
  );
}
