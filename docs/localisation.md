# Localisation (English and Arabic)

The learner app ships in English and Arabic (right-to-left), and Arabic comes in three dialects: Modern Standard Arabic (الفصحى), Egyptian (المصرية) and Gulf/Khaleeji (الخليجية). The control in the header has two steps: choose the language (English | العربية); once Arabic is chosen, a second group offers the dialect, each with a short sample phrase. The choice is saved per browser through the normal preferences, not per learner, and the last Arabic dialect is remembered when switching to English and back (`preferences.lastArabic`).

## How it works
- **English is the stored language.** Content, attempts, evaluations and evidence stay in English. Arabic is applied only when something is displayed, so switching language never changes saved progress or assessment.
- `src/i18n/core.ts` (React-free): `translate`, `localizeDeep`, and the dictionary registry. A dictionary maps the exact English string to its Arabic text. A key containing `{name}` is a pattern, used for messages built from templates (domain messages, interpolated UI text); captured values are localised in turn. Joined sentences or clauses are translated part by part. Anything without an entry falls back to English.
- `src/i18n/index.tsx`: `useI18n()` gives `tr(key, params)` for interface text, `L(value)` for authored content and domain messages, and `date` / `dateTime`.
- `usePathView` / `visibleLibrary` return `bundle` (localised for display) and `rawBundle` (stored English). Anything that evaluates, checks completeness or submits must use the raw data.
- **Variants:** `ar` (Modern Standard Arabic) is the base. `ar-EG` (`src/i18n/eg/`) and `ar-GULF` (`src/i18n/gulf/`) are layers over it: a dialect entry wins, otherwise the base entry is used, otherwise English. The dialect layers are written as real colloquial speech (educated, friendly-professional register, no slang), not as Modern Standard Arabic with a few swapped words. Adding another dialect means adding a layer in `core.ts` (`Locale`, `registerX`, `chain`), a dictionary folder, and an option in `LanguageSwitch`.
- **Product screens stay in Modern Standard Arabic** in every dialect (`useProductI18n`, `withStandardProductScreens`). Therefore any on-screen label quoted inside “ ” in dialect text must match the Modern Standard Arabic label exactly.
- **Technical terms stay in English** inside dialect sentences: job titles (Product Manager…), UX/UI vocabulary and component names (toast, dialog, chip…).
- **Machine values** (ids, critique verdicts, behaviour tokens and similar, listed in `MACHINE_KEYS`) are never translated; `tests/i18n-machine.test.ts` enforces it.
- Dictionaries live in `src/i18n/ar/`: UI (`ui-*.ts`), content (`content-*.ts`), domain message patterns (`domain.ts`) and single words (`words.ts`).
- Layout uses logical CSS properties, directional icons are flipped by CSS under `[dir="rtl"]`, and Arabic uses Noto Sans Arabic and Noto Kufi Arabic behind the Latin faces. Digits stay Latin in both languages.

## Adding or changing text
1. UI text: wrap it in `tr("English text")` and add the Arabic to the matching `ui-*.ts`.
2. Content: add the Arabic (and Egyptian and Gulf) for each new sentence. `tests/i18n-coverage.test.ts` fails if an authored sentence in the flagship or library paths has no Arabic entry.
3. Keep Arabic text count-neutral (avoid plural and dual forms that depend on a number).

## Not localised in this prototype
- The admin workspace and the Demo controls page stay English.
- Placeholder plan names and pricing text.
- The simulated assistant "reasoning" trace inside Design Bench previews.
- Arabic, Egyptian and Gulf translations are a first pass and have not been reviewed by a native-speaking content editor.
