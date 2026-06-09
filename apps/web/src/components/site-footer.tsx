"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale-context";
import { Separator } from "@/components/ui/separator";

const GITHUB_URL = "https://github.com/appleweiping/visa-lark";

export function SiteFooter() {
  const { t } = useLocale();
  return (
    <footer className="border-t bg-muted/40">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 font-bold text-foreground">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-lark-500 to-lark-700 text-white">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <path d="M3 14c4-1 6-4 7-8 1 3 3 5 6 5l-3 3 4 1-5 2-2 4-1-5-6-2z" strokeLinejoin="round" />
              </svg>
            </span>
            VisaLark <span className="text-sm font-medium text-muted-foreground">签证云雀</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{t.footer.tagline}</p>
          <p className="mt-2 text-xs text-muted-foreground/70">{t.footer.builtWith}</p>
        </div>

        {t.footer.sections.map((section) => (
          <div key={section.title}>
            <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
            <ul className="mt-3 flex flex-col gap-2">
              {section.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground transition hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Separator />
      <div className="container-page flex flex-col gap-3 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl">{t.footer.legal}</p>
        <div className="flex items-center gap-4">
          <span>Apache-2.0</span>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="transition hover:text-primary">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
