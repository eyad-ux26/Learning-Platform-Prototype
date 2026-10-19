"use client";

import { useCallback, useMemo } from "react";
import { useApp } from "@/state/AppState";
import { asLocale, dateLocale, dirOf, localizeDeep, translate, type Locale } from "./core";

export { LOCALES, dirOf, type Locale } from "./core";

export function useLocale(): Locale {
  const { learner } = useApp();
  return asLocale(learner?.preferences.language);
}

/** `tr` for interface text, `L` for authored content and domain messages, `date` for locale-aware dates. */
export function useI18n() {
  const locale = useLocale();
  const tr = useCallback((key: string, params?: Record<string, string | number>) => translate(locale, key, params), [locale]);
  const L = useCallback(<T,>(value: T): T => localizeDeep(value, locale), [locale]);
  const date = useCallback(
    (iso: string, opts?: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleDateString(dateLocale(locale), opts ?? { day: "numeric", month: "long", year: "numeric" }),
    [locale],
  );
  const dateTime = useCallback((iso: string) => new Date(iso).toLocaleString(dateLocale(locale)), [locale]);
  return useMemo(() => ({ locale, dir: dirOf(locale), tr, L, date, dateTime }), [locale, tr, L, date, dateTime]);
}
