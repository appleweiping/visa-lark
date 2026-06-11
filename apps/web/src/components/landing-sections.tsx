"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { Section, SectionHeading } from "@/components/section";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TwoPlaneDiagram } from "@/components/two-plane-diagram";

const GITHUB_URL = "https://github.com/appleweiping/visa-lark";

/* ===================== What it does ===================== */
export function WhatSection() {
  const { t } = useLocale();
  return (
    <Section id="what">
      <SectionHeading eyebrow={t.what.eyebrow} title={t.what.title} subtitle={t.what.body} />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {t.what.points.map((p) => (
          <Card key={p.title} className="card-premium">
            <CardHeader>
              <CardTitle className="text-lg">{p.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{p.body}</p>
            </CardContent>
          </Card>
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
    <Section id="safety" className="bg-muted/40">
      <SectionHeading eyebrow={t.safety.eyebrow} title={t.safety.title} subtitle={t.safety.intro} />

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {t.safety.pillars.map((pillar, i) => (
          <Card key={pillar.title} className="card-premium flex flex-col">
            <CardHeader>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-lark-100 text-lark-700 dark:bg-lark-900/50 dark:text-lark-300">
                <Icon name={pillarIcons[i] ?? "shield"} className="h-6 w-6" />
              </span>
              <CardTitle className="mt-4 text-lg">{pillar.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <p className="text-sm leading-6 text-muted-foreground">{pillar.body}</p>
              <Tooltip>
                <TooltipTrigger className="mt-4 self-start text-left text-xs font-semibold text-primary underline-offset-2 hover:underline">
                  Why this matters →
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">{pillar.why}</TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Animated two-plane architecture diagram */}
      <TwoPlaneDiagram />

      {/* Two-plane detail cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="border-2 border-lark-200 dark:border-lark-800">
          <CardHeader>
            <div>
              <Badge>Data plane</Badge>
            </div>
            <CardTitle className="mt-3 text-base">{t.safety.planes.dataTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">{t.safety.planes.dataBody}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-dashed">
          <CardHeader>
            <div>
              <Badge variant="secondary">Control plane</Badge>
            </div>
            <CardTitle className="mt-3 text-base">{t.safety.planes.controlTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">{t.safety.planes.controlBody}</p>
          </CardContent>
        </Card>
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
          <Card key={f.title} className="card-premium group">
            <CardHeader>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-lark-500 to-lark-700 text-white shadow-sm transition group-hover:scale-105">
                <Icon name={f.icon} className="h-6 w-6" />
              </span>
              <CardTitle className="mt-4 text-lg">{f.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{f.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}

/* ===================== Comparison ===================== */
export function CompareSection() {
  const { t } = useLocale();
  return (
    <Section id="compare" className="bg-muted/40">
      <SectionHeading eyebrow={t.compare.eyebrow} title={t.compare.title} subtitle={t.compare.subtitle} />
      <div className="mt-10 overflow-hidden rounded-2xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[26%]" />
              <TableHead className="w-[40%] bg-primary/[0.06] py-4">
                <span className="inline-flex items-center gap-2 text-sm font-bold text-primary">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-primary/60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  {t.compare.columns.us}
                </span>
              </TableHead>
              <TableHead className="py-4 font-semibold text-muted-foreground">
                {t.compare.columns.them}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {t.compare.rows.map((row) => (
              <TableRow key={row.label} className="group transition-colors">
                <TableHead scope="row" className="py-4 align-top font-medium text-foreground">
                  {row.label}
                </TableHead>
                <TableCell className="bg-primary/[0.04] py-4 align-top text-foreground transition-colors group-hover:bg-primary/[0.08]">
                  <span className="inline-flex items-start gap-2">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10">
                      <Check className="h-3.5 w-3.5 text-primary" />
                    </span>
                    {row.us}
                  </span>
                </TableCell>
                <TableCell className="py-4 align-top text-muted-foreground">{row.them}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-6 text-muted-foreground">
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
          <Card key={step.title}>
            <CardHeader>
              <CardTitle className="text-base text-primary">{step.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{step.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <a href={`${GITHUB_URL}/releases`} target="_blank" rel="noreferrer">
            {t.install.extensionCta}
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={`${GITHUB_URL}/tree/main/apps/agent`} target="_blank" rel="noreferrer">
            {t.install.agentCta}
          </a>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/docs#control-plane">{t.install.controlPlaneCta}</Link>
        </Button>
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
    <Section id="disclaimer" className="border-t bg-muted/40 py-16">
      <Alert className="mx-auto max-w-3xl border-feather-200 bg-feather-50 dark:border-feather-900/50 dark:bg-feather-900/10">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-feather-700 dark:text-feather-300" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <path d="M12 9v4M12 17h.01M10.3 3.9l-7.4 13A2 2 0 004.6 20h14.8a2 2 0 001.7-3l-7.4-13a2 2 0 00-3.4 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 className="text-base font-bold text-feather-800 dark:text-feather-200">
          {t.disclaimer.title}
        </h2>
        <AlertDescription>
          <div className="mt-2 flex flex-col gap-3">
            {t.disclaimer.body.map((para, i) => (
              <p key={i} className="text-xs leading-5 text-feather-900/90 dark:text-feather-100/80">
                {para}
              </p>
            ))}
          </div>
        </AlertDescription>
      </Alert>
    </Section>
  );
}
