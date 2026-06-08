"use client";

import { useState } from "react";
import { useLocale } from "@/lib/locale-context";

/* ---------- Best time to check ---------- */
export function BestTimeCard({ bestHour }: { bestHour: number }) {
  const { t } = useLocale();
  const label = `${String(bestHour).padStart(2, "0")}:00 – ${String((bestHour + 1) % 24).padStart(2, "0")}:00`;
  return (
    <div className="card bg-gradient-to-br from-lark-600 to-lark-800 text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lark-100">{t.demo.bestTime}</p>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-4xl font-extrabold tabular-nums">{label}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-lark-50/90">
        {t.features.items[4]?.body}
      </p>
    </div>
  );
}

/* ---------- Heatmap ---------- */
export function HeatmapCard({
  counts,
  max,
  dowLabels,
}: {
  counts: number[][];
  max: number;
  dowLabels: string[];
}) {
  const { t } = useLocale();
  // Show every 3rd hour label to keep it readable.
  const hourLabels = Array.from({ length: 24 }, (_, h) => h);

  const cellColor = (v: number) => {
    if (v <= 0) return "bg-slate-100 dark:bg-slate-800/60";
    const intensity = v / (max || 1);
    if (intensity < 0.2) return "bg-lark-100 dark:bg-lark-900/50";
    if (intensity < 0.4) return "bg-lark-200 dark:bg-lark-800/70";
    if (intensity < 0.6) return "bg-lark-300 dark:bg-lark-700";
    if (intensity < 0.8) return "bg-lark-400 dark:bg-lark-600";
    return "bg-lark-600 dark:bg-lark-400";
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.demo.heatmapTitle}</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.demo.heatmapSubtitle}</p>

      <div className="mt-5 overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Hour header */}
          <div className="flex pl-10">
            {hourLabels.map((h) => (
              <div key={h} className="w-[14px] shrink-0 text-center text-[9px] text-slate-400">
                {h % 3 === 0 ? h : ""}
              </div>
            ))}
          </div>
          {/* Rows */}
          {counts.map((row, dow) => (
            <div key={dow} className="flex items-center">
              <div className="w-10 shrink-0 pr-1 text-right text-[10px] font-medium text-slate-500 dark:text-slate-400">
                {dowLabels[dow]}
              </div>
              {row.map((v, hour) => (
                <div
                  key={hour}
                  className={`m-[1px] h-3.5 w-3 shrink-0 rounded-sm ${cellColor(v)}`}
                  title={`${dowLabels[dow]} ${String(hour).padStart(2, "0")}:00 · ${v} releases`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-slate-400">
        <span>less</span>
        <span className="h-3 w-3 rounded-sm bg-slate-100 dark:bg-slate-800" />
        <span className="h-3 w-3 rounded-sm bg-lark-200 dark:bg-lark-800/70" />
        <span className="h-3 w-3 rounded-sm bg-lark-400 dark:bg-lark-600" />
        <span className="h-3 w-3 rounded-sm bg-lark-600 dark:bg-lark-400" />
        <span>more</span>
      </div>
    </div>
  );
}

/* ---------- Monitor config (mock, interactive but read-only effect) ---------- */
const CITIES = [
  { id: "95", label: "北京 Beijing" },
  { id: "98", label: "上海 Shanghai" },
  { id: "97", label: "广州 Guangzhou" },
  { id: "120", label: "東京 Tokyo" },
];

export function MonitorConfig() {
  const { t } = useLocale();
  const [cities, setCities] = useState<string[]>(["95", "98"]);
  const [mode, setMode] = useState<"notify" | "confirm" | "auto">("confirm");
  const [dow, setDow] = useState<number[]>([1, 2, 3, 4, 5]);

  const toggleCity = (id: string) =>
    setCities((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const toggleDow = (d: number) =>
    setDow((arr) => (arr.includes(d) ? arr.filter((x) => x !== d) : [...arr, d]));

  const dowShort = (t.demo.fields.dow === "Day-of-week filter")
    ? ["S", "M", "T", "W", "T", "F", "S"]
    : ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.demo.monitorTitle}</h2>
        <span className="badge bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">{t.demo.readOnly}</span>
      </div>

      <div className="mt-5 space-y-5 text-sm">
        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.demo.fields.cities}</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {CITIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCity(c.id)}
                aria-pressed={cities.includes(c.id)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  cities.includes(c.id)
                    ? "border-lark-500 bg-lark-50 text-lark-700 dark:bg-lark-900/40 dark:text-lark-200"
                    : "border-slate-200 text-slate-500 hover:border-lark-300 dark:border-slate-700 dark:text-slate-400"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.demo.fields.visaType}</label>
            <div className="mt-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-700 dark:border-slate-700 dark:text-slate-200">
              B1/B2
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.demo.fields.cadence}</label>
            <div className="mt-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-700 dark:border-slate-700 dark:text-slate-200">
              patient · 90–300s
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.demo.fields.dateRange}</label>
          <div className="mt-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-700 dark:border-slate-700 dark:text-slate-200">
            2026-06-15 → 2026-09-30
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.demo.fields.dow}</label>
          <div className="mt-2 flex gap-1.5">
            {dowShort.map((label, d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDow(d)}
                aria-pressed={dow.includes(d)}
                className={`h-8 w-8 rounded-lg text-xs font-medium transition ${
                  dow.includes(d)
                    ? "bg-lark-600 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.demo.fields.mode}</label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["notify", "confirm", "auto"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                  mode === m
                    ? "border-lark-500 bg-lark-50 text-lark-700 dark:bg-lark-900/40 dark:text-lark-200"
                    : "border-slate-200 text-slate-500 hover:border-lark-300 dark:border-slate-700 dark:text-slate-400"
                }`}
              >
                {t.demo.modes[m]}
              </button>
            ))}
          </div>
          {mode === "auto" && (
            <p className="mt-2 rounded-lg bg-feather-50 px-3 py-2 text-[11px] leading-5 text-feather-700 dark:bg-feather-900/20 dark:text-feather-200">
              ⚠ {t.demo.modes.auto}: OFF by default, behind strict interlocks (strictly-earlier-only, confirm-first-N, kill-switch).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Notification settings preview ---------- */
export function NotifyPreview() {
  const { t } = useLocale();
  const channels = [
    { key: "bark" as const, reliable: true, on: true },
    { key: "serverchan" as const, reliable: true, on: true },
    { key: "telegram" as const, reliable: false, on: false },
    { key: "webhook" as const, reliable: true, on: false },
  ];
  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.demo.notifyTitle}</h2>
      <ul className="mt-4 space-y-2.5">
        {channels.map((c) => (
          <li
            key={c.key}
            className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-800"
          >
            <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              {t.demo.channels[c.key]}
              {c.reliable ? (
                <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  CN ✓
                </span>
              ) : (
                <span className="badge bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">VPN</span>
              )}
            </span>
            <span
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                c.on ? "bg-lark-600" : "bg-slate-300 dark:bg-slate-700"
              }`}
              role="img"
              aria-label={c.on ? "enabled" : "disabled"}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${c.on ? "translate-x-4" : "translate-x-1"}`} />
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 rounded-lg bg-lark-50 px-3 py-2 text-[11px] leading-5 text-lark-800 dark:bg-lark-950/50 dark:text-lark-200">
        {t.demo.heartbeatNote}
      </p>
    </div>
  );
}
