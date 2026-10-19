"use client";

import { useApp } from "@/state/AppState";
import { useLocale, type Locale } from "@/i18n";
import { playSfx } from "@/components/sfx";
import { cn } from "@/components/ui";

const OPTIONS: { id: Locale; label: string; name: string; lang: string }[] = [
  { id: "en", label: "EN", name: "English", lang: "en" },
  { id: "ar", label: "عربي", name: "العربية", lang: "ar" },
];

/** Language controller. Both names are written in their own language so it is findable from either one. */
export function LanguageSwitch({ className }: { className?: string }) {
  const { dispatch } = useApp();
  const locale = useLocale();
  return (
    <div role="group" aria-label="Language · اللغة" dir="ltr" className={cn("flex rounded-xl border border-line bg-raised p-0.5", className)}>
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          lang={o.lang}
          aria-pressed={locale === o.id}
          aria-label={o.name}
          onClick={() => {
            if (locale === o.id) return;
            playSfx("tap");
            dispatch({ type: "setLanguage", language: o.id });
          }}
          className={cn("min-h-9 min-w-10 rounded-[10px] px-2.5 text-sm font-semibold transition-colors", locale === o.id ? "bg-brand text-white" : "text-muted hover:text-fg")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
