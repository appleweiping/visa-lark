"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale-context";
import {
  WhatSection,
  SafetySection,
  FeaturesSection,
  CompareSection,
  InstallSection,
  DisclaimerSection,
} from "@/components/landing-sections";

const GITHUB_URL = "https://github.com/appleweiping/visa-lark";

export default function LandingPage() {
  const { t } = useLocale();

  return (
    <>
      {/* ===================== Hero ===================== */}
      <section className="relative overflow-hidden bg-grid">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-lark-50/60 via-white to-white dark:from-lark-950/40 dark:via-slate-950 dark:to-slate-950" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-lark-300/30 blur-3xl dark:bg-lark-700/20" />
        <div className="container-page relative grid gap-12 py-20 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="animate-fade-up">
            <span className="badge bg-lark-100 text-lark-700 dark:bg-lark-900/60 dark:text-lark-200">
              <span className="h-1.5 w-1.5 rounded-full bg-lark-500" /> {t.hero.badge}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
              {t.hero.title}
            </h1>
            <p className="mt-3 text-xl font-medium text-lark-700 dark:text-lark-300">{t.hero.subtitle}</p>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">{t.hero.tagline}</p>
            <p className="mt-4 max-w-xl rounded-xl border border-feather-200 bg-feather-50 px-4 py-3 text-sm leading-6 text-feather-800 dark:border-feather-900/60 dark:bg-feather-900/20 dark:text-feather-200">
              {t.hero.honestNote}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/#install" className="btn-primary">
                {t.hero.ctaInstall}
              </Link>
              <Link href="/demo" className="btn-ghost">
                {t.hero.ctaDemo}
              </Link>
              <Link href="/docs" className="btn-ghost">
                {t.hero.ctaDocs}
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
              {t.hero.trustRow.map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-lark-500" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Hero art placeholder — real mascot/banner art generated later. */}
          <div className="relative animate-fade-up">
            <div className="relative mx-auto max-w-md">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-lark-400/20 to-feather-300/20 blur-2xl" />
              <div className="card relative overflow-hidden p-0">
                {/* Intentional <img> placeholders per spec — real art (/banner.png,
                    /mascot.png) is generated later. Kept as plain <img> so the
                    placeholders work without next/image's optimizer. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/banner.png"
                  alt="VisaLark 签证云雀 — a friendly lark mascot watching a visa appointment calendar light up with an open slot"
                  width={640}
                  height={480}
                  className="h-auto w-full bg-gradient-to-br from-lark-100 to-feather-100 object-cover dark:from-lark-900/40 dark:to-feather-900/30"
                />
                <div className="absolute bottom-3 right-3 animate-float">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/mascot.png"
                    alt="VisaLark lark mascot"
                    width={96}
                    height={96}
                    className="h-20 w-20 drop-shadow-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WhatSection />
      <SafetySection />
      <FeaturesSection />
      <CompareSection />
      <InstallSection />
      <DisclaimerSection />
    </>
  );
}
