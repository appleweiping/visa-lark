"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale-context";

const GITHUB_URL = "https://github.com/appleweiping/visa-lark";

export function SiteFooter() {
  const { t } = useLocale();
  return (
    <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-lark-500 to-lark-700 text-white">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <path d="M3 14c4-1 6-4 7-8 1 3 3 5 6 5l-3 3 4 1-5 2-2 4-1-5-6-2z" strokeLinejoin="round" />
              </svg>
            </span>
            VisaLark <span className="text-sm font-medium text-slate-400">签证云雀</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-slate-500 dark:text-slate-400">{t.footer.tagline}</p>
          <p className="mt-2 text-xs text-slate-400">{t.footer.builtWith}</p>
        </div>

        {t.footer.sections.map((section) => (
          <div key={section.title}>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{section.title}</h3>
            <ul className="mt-3 space-y-2">
              {section.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-500 transition hover:text-lark-600 dark:text-slate-400">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800">
        <div className="container-page flex flex-col gap-3 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl">{t.footer.legal}</p>
          <div className="flex items-center gap-4">
            <span>Apache-2.0</span>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-lark-600">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
