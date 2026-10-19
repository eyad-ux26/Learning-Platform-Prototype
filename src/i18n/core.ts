/**
 * Localisation core. React-free and deterministic.
 *
 * English is the source language and the stored language: attempts, evidence and content are always English.
 * Arabic is applied at display time through dictionaries keyed by the exact English string.
 * A key containing `{name}` is a pattern: it matches strings assembled from a template (domain messages,
 * interpolated UI text), and each captured value is localised in turn.
 * Anything without a translation falls back to English, so a missing entry never breaks a screen.
 */
export type Locale = "en" | "ar";
export const LOCALES: Locale[] = ["en", "ar"];
export const dirOf = (l: Locale): "ltr" | "rtl" => (l === "ar" ? "rtl" : "ltr");
/** Latin digits keep rings, times and counters aligned with the mono typeface in both languages. */
export const dateLocale = (l: Locale) => (l === "ar" ? "ar-EG-u-nu-latn" : undefined);

type Dict = Record<string, string>;
let arabic: Dict = {};
let arabicPatterns: { re: RegExp; names: string[]; out: string }[] = [];

export function registerArabic(...parts: Dict[]) {
  arabic = Object.assign({}, ...parts);
  arabicPatterns = Object.entries(arabic)
    .filter(([k]) => /\{\w+\}/.test(k))
    .map(([k, out]) => {
      const names: string[] = [];
      const src = k
        .split(/(\{\w+\})/)
        .map((part) => {
          const m = /^\{(\w+)\}$/.exec(part);
          if (m) {
            names.push(m[1]);
            return "([\\s\\S]+?)";
          }
          return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        })
        .join("");
      return { re: new RegExp(`^${src}$`), names, out };
    })
    // Longer, more specific templates first.
    .sort((a, b) => b.re.source.length - a.re.source.length);
}

export const hasArabic = (key: string) => key in arabic;

function fill(template: string, params?: Record<string, string | number>) {
  return params ? template.replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m)) : template;
}

/** Translate a UI string. `{name}` placeholders are filled from `params`. */
export function translate(locale: Locale, key: string, params?: Record<string, string | number>): string {
  if (locale === "en") return fill(key, params);
  const hit = arabic[key];
  return fill(hit ?? key, params);
}

const cache = new Map<string, string>();

function localizeString(s: string): string {
  if (!s) return s;
  const exact = arabic[s];
  if (exact !== undefined) return exact;
  const cached = cache.get(s);
  if (cached !== undefined) return cached;
  let out = s;
  for (const p of arabicPatterns) {
    const m = p.re.exec(s);
    if (!m) continue;
    const params: Record<string, string> = {};
    p.names.forEach((n, i) => (params[n] = localizeString(m[i + 1])));
    out = fill(p.out, params);
    break;
  }
  if (out === s) out = localizeParts(s);
  if (cache.size > 20000) cache.clear();
  cache.set(s, out);
  return out;
}

/**
 * Strings assembled by joining authored sentences (" " between sentences, " · " between clauses) are translated part by part.
 * Used only when the whole string has no entry. Returns the input unchanged if no part is known.
 */
function localizeParts(s: string): string {
  const pieces = s.split(/((?<=[.?!])\s+| · )/);
  if (pieces.length < 3) return s;
  let changed = false;
  const out = pieces.map((piece, i) => {
    if (i % 2 === 1) return piece;
    const t = arabic[piece] ?? arabic[piece.replace(/[.]$/, "")];
    if (t === undefined) return piece;
    changed = true;
    return t;
  });
  return changed ? out.join("") : s;
}

const done = new WeakMap<object, unknown>();

/** Deep-localise authored content and domain messages. Objects are copied; ids and non-text values are untouched. */
export function localizeDeep<T>(value: T, locale: Locale): T {
  if (locale === "en") return value;
  return walk(value) as T;
}

function walk(v: unknown): unknown {
  if (typeof v === "string") return localizeString(v);
  if (Array.isArray(v)) {
    const seen = done.get(v);
    if (seen) return seen;
    const out = v.map(walk);
    done.set(v, out);
    return out;
  }
  if (v && typeof v === "object") {
    const seen = done.get(v as object);
    if (seen) return seen;
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) out[k] = ID_KEYS.has(k) ? x : walk(x);
    done.set(v as object, out);
    return out;
  }
  return v;
}

/** Fields that carry identifiers or machine values and must never be translated. */
const ID_KEYS = new Set(["id", "pathId", "skillId", "activityId", "criterionId", "contextKey", "template", "kind", "behaviour", "dimension", "cover", "icon", "iso", "valueIso", "type", "level"]);
