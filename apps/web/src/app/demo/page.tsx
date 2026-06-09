"use client";

import { useMemo } from "react";
import { useLocale } from "@/lib/locale-context";
import {
  buildBoard,
  buildHeatmap,
  DOW_LABELS,
  type AvailabilityStatus,
} from "@/lib/demo-data";
import { BestTimeCard, HeatmapCard, MonitorConfig, NotifyPreview } from "@/components/demo-widgets";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_STYLES: Record<AvailabilityStatus, string> = {
  plenty: "border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300",
  scarce: "border-transparent bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300",
  none: "border-transparent bg-muted text-muted-foreground hover:bg-muted",
};
const STATUS_DOT: Record<AvailabilityStatus, string> = {
  plenty: "bg-emerald-500",
  scarce: "bg-amber-500",
  none: "bg-slate-400",
};

export default function DemoPage() {
  const { t, locale } = useLocale();
  const board = useMemo(() => buildBoard(), []);
  const heatmap = useMemo(() => buildHeatmap(), []);
  const dowLabels = DOW_LABELS[locale] ?? DOW_LABELS.en!;

  return (
    <div className="bg-muted/40">
      <div className="container-page py-12">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <Badge className="w-fit gap-1.5 border-transparent bg-feather-100 text-feather-700 hover:bg-feather-100 dark:bg-feather-900/40 dark:text-feather-200">
            <span className="h-1.5 w-1.5 rounded-full bg-feather-500" /> {t.demo.mockNote}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t.demo.title}</h1>
          <p className="max-w-2xl text-muted-foreground">{t.demo.subtitle}</p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Availability board spans 2 cols on large screens */}
          <div className="lg:col-span-2">
            <BoardCard board={board} />
          </div>
          <div className="flex flex-col gap-6">
            <BestTimeCard bestHour={heatmap.bestHour} />
            <NotifyPreview />
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <HeatmapCard counts={heatmap.counts} max={heatmap.max} dowLabels={dowLabels} />
          </div>
          <div>
            <MonitorConfig />
          </div>
        </div>
      </div>
    </div>
  );

  /* ---------- Availability board ---------- */
  function BoardCard({ board }: { board: ReturnType<typeof buildBoard> }) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t.demo.boardTitle}</CardTitle>
            <Legend />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {board.map((row) => (
              <div
                key={row.facility.id}
                className="flex items-center justify-between rounded-xl border p-4 transition hover:border-lark-300"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{row.facility.city}</span>
                    <span className="text-xs text-muted-foreground">{row.facility.name}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {row.earliestDate ? (
                      <>
                        {t.demo.earliest}: <span className="font-medium text-primary">{row.earliestDate}</span>
                        {row.openSlots > 0 && <span className="ml-2">· {row.openSlots} slots</span>}
                      </>
                    ) : (
                      <span>{t.demo.statusLabels.none}</span>
                    )}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground/70">
                    {t.demo.lastUpdated} {row.updatedMinutesAgo}m
                  </div>
                </div>
                <Badge className={`gap-1.5 ${STATUS_STYLES[row.status]}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[row.status]}`} />
                  {t.demo.statusLabels[row.status]}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  function Legend() {
    return (
      <div className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
        {(["plenty", "scarce", "none"] as AvailabilityStatus[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${STATUS_DOT[s]}`} />
            {t.demo.statusLabels[s]}
          </span>
        ))}
      </div>
    );
  }
}
