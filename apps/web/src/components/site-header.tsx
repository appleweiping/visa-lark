"use client";

import Link from "next/link";
import { useState } from "react";
import { Github, Menu } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
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
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-foreground">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-lark-500 to-lark-700 text-white shadow-md shadow-lark-600/30">
            {/* lark mark — replaced by /mascot.png art later */}
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path d="M3 14c4-1 6-4 7-8 1 3 3 5 6 5l-3 3 4 1-5 2-2 4-1-5-6-2z" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-lg">VisaLark</span>
          <span className="hidden text-sm font-medium text-muted-foreground sm:inline">签证云雀</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LocaleToggle />
          <ThemeToggle />
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              <Github data-icon="inline-start" />
              <span className="hidden lg:inline">{t.nav.github}</span>
            </a>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <Menu />
          </Button>
        </div>
      </div>

      {open && (
        <nav className="border-t bg-background px-5 py-3 md:hidden" aria-label="Mobile">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              {l.label}
            </Link>
          ))}
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
            {t.nav.github}
          </a>
        </nav>
      )}
    </header>
  );
}
