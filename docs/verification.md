# Verification results

Run on 18 October 2026 in the build environment: Linux, Node 22.22.0, npm 10.9.4, Chromium 1194 via playwright-core 1.56.1, against a **production build** (`npm run build && npm start`).

| Check | Command | Result |
|---|---|---|
| Type check | `npm run typecheck` | Passed, no errors |
| Lint | `npm run lint` | Passed, no errors or warnings |
| Unit tests | `npm test` | **22/22 passed** |
| Production build | `npm run build` | Passed; 14 static and 9 dynamic routes |
| Browser journeys | `npm run e2e` | **8/8 passed**, no browser console errors or page errors |

## Focused unit tests (`tests/domain.test.ts`)
- Duplicate submissions don’t inflate evidence (recorded in history, no new evidence).
- Replaying the same challenge with a different response doesn’t add a second context.
- Variants that share a context key count as one context.
- Solution-revealed attempts are practice-only.
- At least one independent context is required (hint-only evidence isn’t enough).
- Mastery isn’t revoked after a later failure; practice is recommended and history keeps the attempt.
- Viewing lessons creates no evidence.
- The path completes only when every required skill is mastered.
- Recommendations target the unmet skill in a different context, prefer accessible activities, and are honest when variants are exhausted.
- Draft edits stay separate from published content; publishing creates v2 while existing enrollments stay on v1.
- Publication is blocked by insufficient coverage and invalid references.
- Content checks: all bundles validate, each flagship skill has ≥ 2 contexts, 8 baseline + 4 alternative activities.
- Assessment checks: per-skill results, flagging everything as problematic does not produce a perfect result, reasons are assessed, incomplete responses are detected, decision branches evaluate correctly.

## Browser journeys (`scripts/e2e.mjs`)
1. **Complete an activity and inspect feedback**: incomplete-submit notice, six Design Bench choices, preview interactions (View source, choose 20 Mar, Accept, Undo), 6/6 criteria feedback.
2. **Fail a criterion and receive an alternative**: weak booking response → improvement feedback → recommendation in a different context → explanation with contextual return → back to the activity → recommended alternative completed → new context listed on Skills.
3. **Refresh and resume**: Continue learning restores saved selections and the open source panel; a new selection survives a page reload.
4. **Upgrade and return**: locked activity → plans → simulated upgrade → back on the original activity, now playable.
5. **Edit, preview, publish**: draft summary edit is invisible to learners, visible in preview; publish v2 updates the learner library; version history records the note; activity editor previews with the real renderer.
6. **Switch learners without mixing progress**: Tomás and Maya keep separate histories across switches; Tomás has 1 of 4 skills remaining.
- **G. Content reviewer**: Editor sees the coverage map; the invalid import example is flagged; Publish is disabled for Editors.
- **Responsive**: 1024 px shows response and interface side by side behind a Brief tab. At 390 px the workspace uses section tabs; selecting an element on the interface moves to the review form, and the mark persists when switching back.

## Screenshots (`docs/screenshots/`)
Learner: `01-home-new-learner`, `02-path-overview`, `03-design-bench-preview`, `04-feedback-success`, `05-feedback-gap-recommendation`, `06-explore-contextual-return`, `07-skills-updated-evidence`, `08-resumed-after-refresh`, `09-locked-activity`, `10-subscription-plans`, `11-returned-after-upgrade`, `15-near-complete-skills`.
Admin: `12-admin-path-editor`, `13-admin-preview`, `14-admin-activity-preview`, `16-coverage-map`, `17-import-validation`.
Responsive: `r-tablet-home`, `r-tablet-workspace`, `r-mobile-home`, `r-mobile-workspace`.

## Issues found and fixed during verification
- Seeded draft stored preview state under the wrong key, so the "resume" journey lost the open source panel.
- The admin draft preview linked to a nonexistent skills route; its prefetch never settled.
- On mobile, the bottom navigation covered the workspace action bar.
- Undo left a date field showing "No due date · Suggested"; it now returns the suggestion to its proposed state.
- Hotspot outlines on list items were clipped, and hotspot text touched its outline.
- At 1024 px the brief pushed the activity below the fold; tablet now uses a Brief tab with response and interface side by side.
- Lint flagged ref writes during render and state set inside effects; state loading and draft editors were restructured.

## Limitations
- Journeys ran in Chromium only. Safari and Firefox weren’t tested.
- Accessibility was checked by implementation review and the keyboard/role-based selectors in the journeys, not by an automated audit or a screen reader. A full WCAG audit is in the backlog.
- Visual review covered 1440, 1024 and 390 px screenshots; no physical devices were used.
- `npm run e2e` clears this origin’s localStorage, so run it on a dedicated port if you want to keep manual demo data.
- `next dev` regenerates `AGENTS.md` (Next.js agent guidance); it is committed so the tree stays clean.
