/**
 * Localisation core. React-free and deterministic.
 *
 * English is the source language and the stored language: attempts, evidence and content are always English.
 * Arabic is applied at display time through dictionaries keyed by the exact English string, in two variants:
 *   "ar"    Modern Standard Arabic (the base)
 *   "ar-EG" Egyptian Arabic, a layer over the base: an Egyptian entry wins, otherwise the base entry is used.
 *   "ar-GULF" Gulf (Khaleeji) Arabic, a layer over the base in the same way.
 * A key containing `{name}` is a pattern: it matches strings assembled from a template (domain messages,
 * interpolated UI text), and each captured value is localised in turn.
 * Anything without a translation falls back to English, so a missing entry never breaks a screen.
 */
export type Locale = "en" | "ar" | "ar-EG" | "ar-GULF";
export type Dialect = "msa" | "ar-EG" | "ar-GULF";
export const LOCALES: Locale[] = ["en", "ar", "ar-EG", "ar-GULF"];
export const asLocale = (v: unknown): Locale => (v === "ar" || v === "ar-EG" || v === "ar-GULF" ? v : "en");
export const isArabic = (l: Locale) => l !== "en";
/** The Arabic dialect layer a locale uses; Modern Standard Arabic is the base with no layer. */
export const dialectOf = (l: Locale): Dialect => (l === "ar-EG" ? "ar-EG" : l === "ar-GULF" ? "ar-GULF" : "msa");
/** Locale for a language choice and a dialect choice, so the two selectors stay independent. */
export const localeFor = (language: "en" | "ar", dialect: Dialect): Locale => (language === "en" ? "en" : dialect === "msa" ? "ar" : dialect);
/** Language tag for the document element. */
export const htmlLang = (l: Locale) => (l === "ar-GULF" ? "ar-AE" : l);
export const dirOf = (l: Locale): "ltr" | "rtl" => (isArabic(l) ? "rtl" : "ltr");
/** Latin digits keep rings, times and counters aligned with the mono typeface in every language. */
export const dateLocale = (l: Locale) => (l === "ar-EG" ? "ar-EG-u-nu-latn" : l === "ar-GULF" ? "ar-AE-u-nu-latn" : l === "ar" ? "ar-u-nu-latn" : undefined);

type Dict = Record<string, string>;
interface Pattern { re: RegExp; names: string[]; out: string }
interface Table { dict: Dict; patterns: Pattern[] }

const empty = (): Table => ({ dict: {}, patterns: [] });
const tables: Record<"ar" | "ar-EG" | "ar-GULF", Table> = { ar: empty(), "ar-EG": empty(), "ar-GULF": empty() };

function compile(dict: Dict): Table {
  const patterns = Object.entries(dict)
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
  return { dict, patterns };
}

/** Register the base (Modern Standard Arabic) dictionaries. */
export function registerArabic(...parts: Dict[]) {
  tables.ar = compile(Object.assign({}, ...parts));
  caches.clear();
}

/** Register the Egyptian layer. Entries here override the base for "ar-EG". */
export function registerEgyptian(...parts: Dict[]) {
  tables["ar-EG"] = compile(Object.assign({}, ...parts));
  caches.clear();
}

/** Register the Gulf (Khaleeji) layer. Entries here override the base for "ar-GULF". */
export function registerGulf(...parts: Dict[]) {
  tables["ar-GULF"] = compile(Object.assign({}, ...parts));
  caches.clear();
}

/** Lookup order for a locale: its own layer first, then the base. */
const chain = (l: Locale): Table[] => (l === "en" ? [] : l === "ar" ? [tables.ar] : [tables[l], tables.ar]);

export const hasArabic = (key: string) => key in tables.ar.dict;
export const hasEgyptian = (key: string) => key in tables["ar-EG"].dict;
export const hasGulf = (key: string) => key in tables["ar-GULF"].dict;

function fill(template: string, params?: Record<string, string | number>) {
  return params ? template.replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m)) : template;
}

/** Translate a UI string. `{name}` placeholders are filled from `params`. */
export function translate(locale: Locale, key: string, params?: Record<string, string | number>): string {
  for (const t of chain(locale)) {
    const hit = t.dict[key];
    if (hit !== undefined) return fill(hit, params);
  }
  return fill(key, params);
}

const caches = new Map<Locale, Map<string, string>>();
const cacheFor = (l: Locale) => {
  let c = caches.get(l);
  if (!c) caches.set(l, (c = new Map()));
  return c;
};

function localizeString(s: string, locale: Locale): string {
  if (!s) return s;
  const layers = chain(locale);
  for (const t of layers) {
    const exact = t.dict[s];
    if (exact !== undefined) return exact;
  }
  const cache = cacheFor(locale);
  const cached = cache.get(s);
  if (cached !== undefined) return cached;
  let out = s;
  outer: for (const t of layers) {
    for (const p of t.patterns) {
      const m = p.re.exec(s);
      if (!m) continue;
      const params: Record<string, string> = {};
      p.names.forEach((n, i) => (params[n] = localizeString(m[i + 1], locale)));
      out = fill(p.out, params);
      break outer;
    }
  }
  if (out === s) out = localizeParts(s, locale);
  if (cache.size > 20000) cache.clear();
  cache.set(s, out);
  return out;
}

/**
 * Strings assembled by joining authored sentences (" " between sentences, " · " between clauses) are translated part by part.
 * Used only when the whole string has no entry. Returns the input unchanged if no part is known.
 */
function localizeParts(s: string, locale: Locale): string {
  const pieces = s.split(/((?<=[.?!])\s+| · )/);
  if (pieces.length < 3) return s;
  const layers = chain(locale);
  let changed = false;
  const out = pieces.map((piece, i) => {
    if (i % 2 === 1) return piece;
    for (const t of layers) {
      const hit = t.dict[piece] ?? t.dict[piece.replace(/[.]$/, "")];
      if (hit !== undefined) {
        changed = true;
        return hit;
      }
    }
    return piece;
  });
  return changed ? out.join("") : s;
}

const done = new Map<Locale, WeakMap<object, unknown>>();

/** Deep-localise authored content and domain messages. Objects are copied; ids and machine values are untouched. */
export function localizeDeep<T>(value: T, locale: Locale): T {
  if (locale === "en") return value;
  let memo = done.get(locale);
  if (!memo) done.set(locale, (memo = new WeakMap()));
  return walk(value, locale, memo) as T;
}

function walk(v: unknown, locale: Locale, memo: WeakMap<object, unknown>): unknown {
  if (typeof v === "string") return localizeString(v, locale);
  if (Array.isArray(v)) {
    const seen = memo.get(v);
    if (seen) return seen;
    const out = v.map((x) => walk(x, locale, memo));
    memo.set(v, out);
    return out;
  }
  if (v && typeof v === "object") {
    const seen = memo.get(v as object);
    if (seen) return seen;
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) out[k] = MACHINE_KEYS.has(k) ? x : walk(x, locale, memo);
    memo.set(v as object, out);
    return out;
  }
  return v;
}

/**
 * Fields that carry identifiers or machine values used by assessment and rendering logic.
 * They must never be translated: e.g. a critique verdict is compared with the learner's stored verdict.
 */
export const MACHINE_KEYS = new Set([
  "id", "pathId", "skillId", "activityId", "criterionId", "contextKey", "template", "kind", "behaviour", "dimension", "cover", "icon",
  "iso", "valueIso", "type", "level", "availability", "verdict", "appliesTo", "correctReasons", "oneOf", "evidenceFrom", "start", "next",
  "nodeId", "choiceId", "decision", "tone", "hotspot", "alternativeFor", "relatedConcepts", "practiceActivityIds", "requiredSkillIds",
  "freeSampleActivityIds", "state", "variant", "hotspot", "rowHotspots",
]);
