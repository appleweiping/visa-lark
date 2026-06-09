"use client";

import { useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

/* ---------- Best time to check ---------- */
export function BestTimeCard({ bestHour }: { bestHour: number }) {
  const { t } = useLocale();
  const label = `${String(bestHour).padStart(2, "0")}:00 – ${String((bestHour + 1) % 24).padStart(2, "0")}:00`;
  return (
    <Card className="border-0 bg-gradient-to-br from-lark-600 to-lark-800 text-white">
      <CardContent className="pt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lark-100">{t.demo.bestTime}</p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold tabular-nums">{label}</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-lark-50/90">
          {t.features.items[4]?.body}
        </p>
      </CardContent>
    </Card>
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
    if (v <= 0) return "bg-muted";
    const intensity = v / (max || 1);
    if (intensity < 0.2) return "bg-lark-100 dark:bg-lark-900/50";
    if (intensity < 0.4) return "bg-lark-200 dark:bg-lark-800/70";
    if (intensity < 0.6) return "bg-lark-300 dark:bg-lark-700";
    if (intensity < 0.8) return "bg-lark-400 dark:bg-lark-600";
    return "bg-lark-600 dark:bg-lark-400";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t.demo.heatmapTitle}</CardTitle>
        <p className="text-sm text-muted-foreground">{t.demo.heatmapSubtitle}</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Hour header */}
            <div className="flex pl-10">
              {hourLabels.map((h) => (
                <div key={h} className="w-[14px] shrink-0 text-center text-[9px] text-muted-foreground">
                  {h % 3 === 0 ? h : ""}
                </div>
              ))}
            </div>
            {/* Rows */}
            {counts.map((row, dow) => (
              <div key={dow} className="flex items-center">
                <div className="w-10 shrink-0 pr-1 text-right text-[10px] font-medium text-muted-foreground">
                  {dowLabels[dow]}
                </div>
                {row.map((v, hour) => (
                  <div
                    key={hour}
                    role="img"
                    aria-label={`${dowLabels[dow]} ${String(hour).padStart(2, "0")}:00 · ${v} releases`}
                    className={`m-[1px] h-3.5 w-3 shrink-0 rounded-sm ${cellColor(v)}`}
                    title={`${dowLabels[dow]} ${String(hour).padStart(2, "0")}:00 · ${v} releases`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
          <span>less</span>
          <span className="h-3 w-3 rounded-sm bg-muted" />
          <span className="h-3 w-3 rounded-sm bg-lark-200 dark:bg-lark-800/70" />
          <span className="h-3 w-3 rounded-sm bg-lark-400 dark:bg-lark-600" />
          <span className="h-3 w-3 rounded-sm bg-lark-600 dark:bg-lark-400" />
          <span>more</span>
        </div>
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{t.demo.monitorTitle}</CardTitle>
          <Badge variant="secondary">{t.demo.readOnly}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-5 text-sm">
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t.demo.fields.cities}</label>
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
                      : "border-border text-muted-foreground hover:border-lark-300"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t.demo.fields.visaType}</label>
              <div className="mt-2 rounded-lg border px-3 py-2 text-foreground">
                B1/B2
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t.demo.fields.cadence}</label>
              <div className="mt-2 rounded-lg border px-3 py-2 text-foreground">
                patient · 90–300s
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">{t.demo.fields.dateRange}</label>
            <div className="mt-2 rounded-lg border px-3 py-2 text-foreground">
              2026-06-15 → 2026-09-30
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">{t.demo.fields.dow}</label>
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
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">{t.demo.fields.mode}</label>
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
                      : "border-border text-muted-foreground hover:border-lark-300"
                  }`}
                >
                  {t.demo.modes[m]}
                </button>
              ))}
            </div>
            {mode === "auto" && (
              <Alert className="mt-2 border-feather-200 bg-feather-50 dark:border-feather-900/40 dark:bg-feather-900/20">
                <AlertDescription className="text-[11px] leading-5 text-feather-700 dark:text-feather-200">
                  ⚠ {t.demo.modes.auto}: OFF by default, behind strict interlocks (strictly-earlier-only, confirm-first-N, kill-switch).
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t.demo.notifyTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2.5">
          {channels.map((c) => (
            <li
              key={c.key}
              className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm"
            >
              <span className="flex items-center gap-2 text-foreground">
                {t.demo.channels[c.key]}
                {c.reliable ? (
                  <Badge className="border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300">
                    CN ✓
                  </Badge>
                ) : (
                  <Badge variant="secondary">VPN</Badge>
                )}
              </span>
              <span
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                  c.on ? "bg-lark-600" : "bg-muted"
                }`}
                role="img"
                aria-label={c.on ? "enabled" : "disabled"}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${c.on ? "translate-x-4" : "translate-x-1"}`} />
              </span>
            </li>
          ))}
        </ul>
        <Alert className="mt-4 border-lark-200 bg-lark-50 dark:border-lark-900/50 dark:bg-lark-950/50">
          <AlertDescription className="text-[11px] leading-5 text-lark-800 dark:text-lark-200">
            {t.demo.heartbeatNote}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
