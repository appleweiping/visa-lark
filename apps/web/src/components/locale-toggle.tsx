"use client";

import { useLocale } from "@/lib/locale-context";

/** zh / en switch. */
export function LocaleToggle() {
  const { locale, setLocale } = useLocale();
  return (
    <div
      className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-0.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900"
      role="group"
      aria-label="Language"
    >
      {(["zh", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={`rounded-lg px-2.5 py-1.5 transition ${
            locale === l
              ? "bg-lark-600 text-white"
              : "text-slate-500 hover:text-lark-600 dark:text-slate-400"
          }`}
        >
          {l === "zh" ? "中文" : "EN"}
        </button>
      ))}
    </div>
  );
}
