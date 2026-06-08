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

const STATUS_STYLES: Record<AvailabilityStatus, string> = {
  plenty: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  scarce: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  none: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
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
    <div className="bg-slate-50 dark:bg-slate-950">
      <div className="container-page py-12">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <span className="badge w-fit bg-feather-100 text-feather-700 dark:bg-feather-900/40 dark:text-feather-200">
            <span className="h-1.5 w-1.5 rounded-full bg-feather-500" /> {t.demo.mockNote}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t.demo.title}</h1>
          <p className="max-w-2xl text-slate-600 dark:text-slate-300">{t.demo.subtitle}</p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Availability board spans 2 cols on large screens */}
          <div className="lg:col-span-2">
            <BoardCard board={board} />
          </div>
          <div>
            <BestTimeCard bestHour={heatmap.bestHour} />
            <div className="mt-6">
              <NotifyPreview />
            </div>
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
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.demo.boardTitle}</h2>
          <Legend />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {board.map((row) => (
            <div
              key={row.facility.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-lark-300 dark:border-slate-800"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">{row.facility.city}</span>
                  <span className="text-xs text-slate-400">{row.facility.name}</span>
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {row.earliestDate ? (
                    <>
                      {t.demo.earliest}: <span className="font-medium text-lark-600 dark:text-lark-300">{row.earliestDate}</span>
                      {row.openSlots > 0 && <span className="ml-2">· {row.openSlots} slots</span>}
                    </>
                  ) : (
                    <span>{t.demo.statusLabels.none}</span>
                  )}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  {t.demo.lastUpdated} {row.updatedMinutesAgo}m
                </div>
              </div>
              <span className={`badge ${STATUS_STYLES[row.status]}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[row.status]}`} />
                {t.demo.statusLabels[row.status]}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function Legend() {
    return (
      <div className="hidden items-center gap-3 text-xs text-slate-500 sm:flex dark:text-slate-400">
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
