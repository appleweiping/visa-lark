"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale-context";
import { Section, SectionHeading } from "@/components/section";
import { Icon } from "@/components/icon";

const GITHUB_URL = "https://github.com/appleweiping/visa-lark";

/* ===================== What it does ===================== */
export function WhatSection() {
  const { t } = useLocale();
  return (
    <Section id="what">
      <SectionHeading eyebrow={t.what.eyebrow} title={t.what.title} subtitle={t.what.body} />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {t.what.points.map((p) => (
          <div key={p.title} className="card transition hover:-translate-y-0.5 hover:shadow-md">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{p.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{p.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ===================== Safety model ===================== */
export function SafetySection() {
  const { t } = useLocale();
  const pillarIcons = ["shield", "lock", "ban"];
  return (
    <Section id="safety" className="bg-slate-50 dark:bg-slate-900/40">
      <SectionHeading eyebrow={t.safety.eyebrow} title={t.safety.title} subtitle={t.safety.intro} />

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {t.safety.pillars.map((pillar, i) => (
          <div key={pillar.title} className="card flex flex-col">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-lark-100 text-lark-700 dark:bg-lark-900/50 dark:text-lark-300">
              <Icon name={pillarIcons[i] ?? "shield"} className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{pillar.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{pillar.body}</p>
            <p className="mt-4 rounded-lg bg-lark-50 px-3 py-2 text-xs leading-5 text-lark-800 dark:bg-lark-950/50 dark:text-lark-200">
              <span className="font-semibold">Why → </span>
              {pillar.why}
            </p>
          </div>
        ))}
      </div>

      {/* Two-plane diagram */}
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border-2 border-lark-200 bg-white p-6 dark:border-lark-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <span className="badge bg-lark-600 text-white">Data plane</span>
          </div>
          <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">{t.safety.planes.dataTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{t.safety.planes.dataBody}</p>
        </div>
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <span className="badge bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">Control plane</span>
          </div>
          <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">{t.safety.planes.controlTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{t.safety.planes.controlBody}</p>
        </div>
      </div>
    </Section>
  );
}

/* ===================== Features ===================== */
export function FeaturesSection() {
  const { t } = useLocale();
  return (
    <Section id="features">
      <SectionHeading eyebrow={t.features.eyebrow} title={t.features.title} subtitle={t.features.subtitle} />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {t.features.items.map((f) => (
          <div key={f.title} className="card group transition hover:-translate-y-0.5 hover:border-lark-300 hover:shadow-md">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-lark-500 to-lark-700 text-white shadow-sm transition group-hover:scale-105">
              <Icon name={f.icon} className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{f.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{f.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ===================== Comparison ===================== */
export function CompareSection() {
  const { t } = useLocale();
  return (
    <Section id="compare" className="bg-slate-50 dark:bg-slate-900/40">
      <SectionHeading eyebrow={t.compare.eyebrow} title={t.compare.title} subtitle={t.compare.subtitle} />
      <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="px-4 py-4 font-medium text-slate-400" />
              <th className="px-4 py-4">
                <span className="inline-flex items-center gap-1.5 font-semibold text-lark-700 dark:text-lark-300">
                  <span className="h-2 w-2 rounded-full bg-lark-500" />
                  {t.compare.columns.us}
                </span>
              </th>
              <th className="px-4 py-4 font-semibold text-slate-500 dark:text-slate-400">{t.compare.columns.them}</th>
            </tr>
          </thead>
          <tbody>
            {t.compare.rows.map((row, i) => (
              <tr
                key={row.label}
                className={i % 2 ? "bg-slate-50/60 dark:bg-slate-800/30" : ""}
              >
                <th scope="row" className="px-4 py-4 font-medium text-slate-700 dark:text-slate-200">
                  {row.label}
                </th>
                <td className="px-4 py-4 text-slate-700 dark:text-slate-200">
                  <span className="inline-flex items-start gap-1.5">
                    <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-lark-500" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {row.us}
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-500 dark:text-slate-400">{row.them}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-6 text-slate-500 dark:text-slate-400">
        {t.compare.footnote}
      </p>
    </Section>
  );
}

/* ===================== Install ===================== */
export function InstallSection() {
  const { t } = useLocale();
  return (
    <Section id="install">
      <SectionHeading eyebrow={t.install.eyebrow} title={t.install.title} subtitle={t.install.subtitle} center />
      <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
        {t.install.steps.map((step) => (
          <div key={step.title} className="card">
            <h3 className="font-semibold text-lark-700 dark:text-lark-300">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.body}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-3">
        <a href={`${GITHUB_URL}/releases`} target="_blank" rel="noreferrer" className="btn-primary">
          {t.install.extensionCta}
        </a>
        <a href={`${GITHUB_URL}/tree/main/apps/agent`} target="_blank" rel="noreferrer" className="btn-ghost">
          {t.install.agentCta}
        </a>
        <Link href="/docs#control-plane" className="btn-ghost">
          {t.install.controlPlaneCta}
        </Link>
      </div>

      <div className="mx-auto mt-8 max-w-2xl">
        <div className="prose-doc">
          <pre>
            <code>{`# Optional self-host control plane (Oracle Cloud Always Free)
curl -fsSL https://raw.githubusercontent.com/appleweiping/visa-lark/main/apps/control-plane/install.sh | bash`}</code>
          </pre>
        </div>
      </div>
    </Section>
  );
}

/* ===================== Disclaimer ===================== */
export function DisclaimerSection() {
  const { t } = useLocale();
  return (
    <Section id="disclaimer" className="border-t border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl rounded-2xl border border-feather-200 bg-feather-50 p-6 dark:border-feather-900/50 dark:bg-feather-900/10">
        <h2 className="flex items-center gap-2 text-base font-bold text-feather-800 dark:text-feather-200">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <path d="M12 9v4M12 17h.01M10.3 3.9l-7.4 13A2 2 0 004.6 20h14.8a2 2 0 001.7-3l-7.4-13a2 2 0 00-3.4 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t.disclaimer.title}
        </h2>
        <div className="mt-4 space-y-3">
          {t.disclaimer.body.map((para, i) => (
            <p key={i} className="text-xs leading-5 text-feather-900/90 dark:text-feather-100/80">
              {para}
            </p>
          ))}
        </div>
      </div>
    </Section>
  );
}
