# Content format (version 1)

A learning path is one JSON document, a **PathBundle**. The TypeScript definitions in `src/domain/types.ts` are the source of truth. The admin **Import** screen validates a bundle with `src/domain/validation.ts`, previews its activities with the real renderers, and imports it as a draft. Nothing is published by importing.

The format is designed for Claude-assisted content production. A model drafts the JSON, the validator checks it, and a human reviews it in preview before an Admin publishes it. No AI service is connected in this prototype.

## Top level

```jsonc
{
  "formatVersion": 1,
  "meta": { … },                 // path metadata
  "skills": [ … ],               // skills with assessment criteria
  "requiredSkillIds": [ … ],     // skills that must be Mastered for completion
  "explore": [ … ],              // Explore concepts (may be empty for preview paths)
  "activities": [ … ],           // Design Bench, Critique or Decision activities
  "reviewNotes": [ … ]           // optional: claims needing expert review
}
```

## `meta`

| Field | Notes |
|---|---|
| `id` | lowercase letters, numbers, hyphens; unique |
| `title`, `summary`, `topic`, `audience`, `prerequisites` | required text |
| `level` | `Introductory` · `Intermediate` · `Advanced` |
| `estimatedHours` | positive number; always shown as an estimate |
| `icon` | `shield` `eye` `pointer` `layers` `network` `compass` `book` `sparkle` |
| `cover` | `rings` `grid` `steps` `nodes` `layers` `waves` |
| `outcomes` | at least one |
| `availability` | `full` (playable; coverage enforced) or `preview` (overview + samples only) |
| `freeSampleActivityIds` | ids from `activities` |
| `plannedModules` | optional; shown as "not included in this prototype" |

## `skills[]`

```json
{ "id": "uncertainty", "name": "…", "description": "…",
  "criteria": [ { "id": "unc-distinguish", "skillId": "uncertainty", "statement": "…", "lookFor": "…" } ] }
```

## `activities[]` (common fields)

`id`, `pathId` (must equal `meta.id`), `template`, `title`, `contextLabel`, `contextKey` (distinct contexts count for mastery), `kind` (`baseline` | `alternative`), `alternativeFor` (optional baseline id), `estimatedMinutes`, `scenario`, `task`, `constraints[]`, `criteria[]` (criterion ids assessed), `relatedConcepts[]`, `hints[]`, `solution`.

### `design-bench`

- `preview`: configuration for the shared interactive product preview: app, record, and the `proposal` (kind `field` | `text` | `change` | `bulk`, value, alternatives, uncertainty texts, source with highlight, impact, review message, scope rows).
- `decisions[]`: `{ id, dimension, prompt, options[] }`. Each option has `{ id, label, behaviour, tradeoff, consequence }`. `dimension` is one of `presentation, uncertainty, evidence, explanation, correction, commitment, recovery, scope`, and `behaviour` is a token the preview renders (see `Behaviour` in `types.ts`).
- `rules[]`: one per assessed criterion: `{ criterionId, passWhen: Condition[][], evidenceFrom: decisionId[], pass, fail }`. A criterion passes when **any** group has **all** conditions true.

### `critique`

- `screen`: `{ app, title, blocks[] }`. Blocks are typed interface pieces (`appbar`, `heading`, `text`, `badge`, `field`, `quote`, `list`, `buttons`, `banner`, `table`, `meter`, `checkbox`, `link`, `dialog`, `toast`, `group`). Any block or list item can carry a `hotspot` id. Don’t nest hotspots.
- `reasons[]`: `{ id, label, appliesTo: "acceptable" | "problematic" }`.
- `hotspots[]`: `{ id, label, verdict, correctReasons[], criterionId, explanation, improvement }`. Give every criterion at least one acceptable element (the validator warns otherwise).

### `decision`

- `start`: first node id. `nodes[]`: `{ id, title, situation, prompt, facts?, screen?, choices[] }`.
- Each choice has `{ id, label, detail, consequence, signals: [{ criterionId, met, because }], next? }`. A choice without `next` ends the scenario.
- `debrief`: `{ impact, reversibility, uncertainty }`.

## `explore[]`

`{ id, title, skillId?, summary, readingMinutes, freeSample, sections[{heading, body}], comparisons[{title, before{caption, screen}, after{caption, screen}, whyItMatters}], example{title, body}, video?, practiceActivityIds[] }`.

`video` has `{ title, src?, plannedLength, transcript[{at, text}], storyboard[{frame, visual, narration}] }`. Without `src`, the UI shows a labelled placeholder with the storyboard and transcript, never a fake player. If `src` fails to load, the transcript is shown with a "failed to load" notice.

## Validation outcomes

- **Structural errors** (missing fields, wrong types): cannot be imported.
- **Reference and coverage errors**: can be imported as a draft, but publication is blocked.
- **Warnings**: allowed, shown to reviewers.

The Import screen has "Load valid example" and "Load invalid example" buttons for review.
