# Localisation (English and Arabic)

The learner app ships in English and two Arabic variants (right-to-left): Modern Standard Arabic (عربي) and Egyptian Arabic (مصري). A switch in the header (EN | عربي | مصري) changes the language; the choice is saved per browser through the normal preferences, not per learner.

## How it works
- **English is the stored language.** Content, attempts, evaluations and evidence stay in English. Arabic is applied only when something is displayed, so switching language never changes saved progress or assessment.
- `src/i18n/core.ts` (React-free): `translate`, `localizeDeep`, and the dictionary registry. A dictionary maps the exact English string to its Arabic text. A key containing `{name}` is a pattern, used for messages built from templates (domain messages, interpolated UI text); captured values are localised in turn. Joined sentences or clauses are translated part by part. Anything without an entry falls back to English.
- `src/i18n/index.tsx`: `useI18n()` gives `tr(key, params)` for interface text, `L(value)` for authored content and domain messages, and `date` / `dateTime`.
- `usePathView` / `visibleLibrary` return `bundle` (localised for display) and `rawBundle` (stored English). Anything that evaluates, checks completeness or submits must use the raw data.
- **Variants:** `ar` (Modern Standard Arabic) is the base. `ar-EG` is a layer over it in `src/i18n/eg/`: an Egyptian entry wins, otherwise the base entry is used, otherwise English. Adding another variant means adding another layer in `core.ts` and a switch option.
- **Machine values** (ids, critique verdicts, behaviour tokens and similar, listed in `MACHINE_KEYS`) are never translated; `tests/i18n-machine.test.ts` enforces it.
- Dictionaries live in `src/i18n/ar/`: UI (`ui-*.ts`), content (`content-*.ts`), domain message patterns (`domain.ts`) and single words (`words.ts`).
- Layout uses logical CSS properties, directional icons are flipped by CSS under `[dir="rtl"]`, and Arabic uses Noto Sans Arabic and Noto Kufi Arabic behind the Latin faces. Digits stay Latin in both languages.

## Adding or changing text
1. UI text: wrap it in `tr("English text")` and add the Arabic to the matching `ui-*.ts`.
2. Content: add the Arabic (and Egyptian) for each new sentence. `tests/i18n-coverage.test.ts` fails if an authored sentence in the flagship or library paths has no Arabic entry.
3. Keep Arabic text count-neutral (avoid plural and dual forms that depend on a number).

## Not localised in this prototype
- The admin workspace and the Demo controls page stay English.
- Placeholder plan names and pricing text.
- The simulated assistant "reasoning" trace inside Design Bench previews.
- Arabic and Egyptian translations are a first pass and have not been reviewed by a native-speaking content editor.
