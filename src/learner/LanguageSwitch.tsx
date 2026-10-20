"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, Globe } from "lucide-react";
import { useApp } from "@/state/AppState";
import { dialectOf, isArabic, useLocale, type Dialect, type Locale } from "@/i18n";
import { playSfx } from "@/components/sfx";
import { cn } from "@/components/ui";

const DIALECTS: { id: Dialect; locale: Exclude<Locale, "en">; name: string; short: string; en: string; sample: string; lang: string }[] = [
  { id: "msa", locale: "ar", name: "الفصحى", short: "فصحى", en: "Modern Standard", sample: "كيف أبدأ؟", lang: "ar" },
  { id: "ar-EG", locale: "ar-EG", name: "المصرية", short: "مصري", en: "Egyptian", sample: "أبدأ إزاي؟", lang: "ar-EG" },
  { id: "ar-GULF", locale: "ar-GULF", name: "الخليجية", short: "خليجي", en: "Gulf", sample: "شلون أبدأ؟", lang: "ar-AE" },
];

/**
 * Language controller in two steps: first the language, then, once Arabic is chosen, the dialect.
 * Names are written in their own language so the control is findable from any of them.
 */
export function LanguageSwitch({ className }: { className?: string }) {
  const { learner, dispatch } = useApp();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const arabic = isArabic(locale);
  const current = DIALECTS.find((d) => d.id === dialectOf(locale))!;
  const remembered = learner.preferences.lastArabic ?? "ar";

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (next: Locale, close: boolean) => {
    if (next !== locale) {
      playSfx("tap");
      dispatch({ type: "setLanguage", language: next });
    }
    if (close) setOpen(false);
  };

  return (
    <div ref={root} className={cn("relative", className)} dir="ltr">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={arabic ? `اللغة · Language: العربية، ${current.name}` : "Language · اللغة: English"}
        onClick={() => setOpen((o) => !o)}
        className="press flex h-10 items-center gap-2 rounded-xl border border-line bg-raised px-3 text-sm font-semibold text-fg"
      >
        <Globe size={16} className="text-accent" aria-hidden />
        {arabic ? (
          <span lang={current.lang} className="flex items-center gap-1.5">
            عربي<span className="text-muted">·</span><span className="text-accent">{current.short}</span>
          </span>
        ) : (
          <span>EN</span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          role="group"
          aria-label="Language · اللغة"
          className="slide-in fixed inset-x-4 top-[4.25rem] z-50 rounded-2xl border border-line-strong bg-raised p-3 shadow-[0_18px_50px_rgba(0,0,0,.55)] sm:absolute sm:inset-x-auto sm:end-0 sm:top-full sm:mt-2 sm:w-80"
        >
          <p className="px-1 pb-2 font-mono text-[11px] font-semibold text-muted">Language · اللغة</p>
          <div role="radiogroup" aria-label="Language · اللغة" className="grid grid-cols-2 gap-1 rounded-xl bg-canvas p-1">
            <button
              type="button"
              role="radio"
              aria-checked={!arabic}
              lang="en"
              onClick={() => choose("en", true)}
              className={cn("min-h-10 rounded-[9px] px-3 text-sm font-semibold", !arabic ? "bg-brand text-white" : "text-muted hover:text-fg")}
            >
              English
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={arabic}
              lang="ar"
              onClick={() => choose(arabic ? locale : remembered, false)}
              className={cn("min-h-10 rounded-[9px] px-3 text-sm font-semibold", arabic ? "bg-brand text-white" : "text-muted hover:text-fg")}
            >
              العربية
            </button>
          </div>

          {arabic && (
            <div className="slide-in mt-3">
              <p className="px-1 pb-2 font-mono text-[11px] font-semibold text-muted">Dialect · اللهجة</p>
              <div role="radiogroup" aria-label="Dialect · اللهجة" className="space-y-1.5">
                {DIALECTS.map((d) => {
                  const on = d.id === current.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={`${d.name} · ${d.en}`}
                      lang={d.lang}
                      dir="rtl"
                      onClick={() => choose(d.locale, true)}
                      className={cn("flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-start transition-colors", on ? "border-brand-strong bg-brand-deep" : "border-line hover:border-line-strong")}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-fg">{d.name}</span>
                        <span dir="ltr" lang="en" className="block text-start font-mono text-[11px] text-muted">{d.en}</span>
                      </span>
                      <span className="shrink-0 rounded-lg bg-canvas px-2.5 py-1 text-xs text-muted">{d.sample}</span>
                      <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full", on ? "bg-brand-strong text-white" : "border border-line-strong")}>{on && <Check size={12} strokeWidth={3} aria-hidden />}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
