"use client";

import { useLocale } from "@/lib/locale-context";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n";

/** Language switch: 中文 / EN / 日本語 / 한국어. */
export function LocaleToggle() {
  const { locale, setLocale } = useLocale();
  return (
    <div
      className="inline-flex items-center rounded-xl border bg-card p-0.5 text-xs font-semibold"
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={`rounded-lg px-2 py-1.5 transition ${
            locale === l
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
