# Screen and interaction inventory

## Learner (`src/app/(learner)`, `src/learner`, `src/activities`)

| Route | Screen | Key interactions |
|---|---|---|
| `/` | Home and library | Continue learning (resume saved work), recommended next action, search, filters (topic, progress, access), path cards with access type, skills, skill progress separate from lessons viewed, no-results reset |
| `/paths/[pathId]` | Path overview | Start/Resume/Continue action (respects the "explanation first" preference), Explore first, completion requirements, skills with status and evidence meter, activity list with free/locked/status badges, Explore list with viewed state, outcomes, audience, prior knowledge, free sample boundaries, version notice with "move to latest" |
| `/paths/[pathId]/explore/[conceptId]` | Explore | Concept navigation (viewed and locked states), labelled video placeholder with storyboard and transcript (or real video with load-failure fallback), sections, before/after comparisons, realistic example, practise-this links, contextual return banner (`?from=`), previous/next |
| `/paths/[pathId]/practice/[activityId]` | Practice workspace | Brief (scenario, task, constraints, assessed skills and criteria), renderer, submit with incomplete-response handling, reset (confirmation), save and exit, autosave, help dialog (how it works, evidence rule, related explanations with return, hints with warning, reveal solution with warning), feedback, recommendation, revise and resubmit, view last feedback. Section tabs below 1280 px; tablet shows response and interface side by side |
| (same) | Locked activity | Scenario summary, explanation, Review subscription (returns here after upgrade) |
| `/paths/[pathId]/skills` | Skills and evidence | Completion banner with reason, per-skill status, evidence required versus collected, contexts named, practice-only counts, recommended next practice per skill, plain-language rule, activity history with how each attempt counted |
| `/progress` | Progress | All active paths, skill statuses, lessons viewed separately |
| `/account` | Account | Fictional profile, access status, simulated cancel/keep, preferences (explanation first, reduced motion, transcripts, weekly goal), reset this learner |
| `/subscribe` | Subscription | Monthly and annual plans with placeholder pricing, simulated upgrade with confirmation, return to original destination (`?return=`) |
| `/demo` | Demo controls | Seven scenarios, switch, reset learner, reset all (confirmation), current access inspector |

### Activity renderers
- **Design Bench** (`DesignBench.tsx`, `ProposalPreview.tsx`): radio decisions with tradeoffs, plus a live product preview that supports source viewing, tooltips, inline date editing, alternatives, regenerate, settings detour, Accept / dialog / review / typed confirmation / save-with-task / automatic commitment, undo toasts with countdown, delayed send with cancel, history revert, batch rollback, scope tables with exclusions, and a "what happened" simulation log. Supports `field`, `text`, `change` and `bulk` proposals.
- **Critique a Design** (`Critique.tsx`, `ScreenRenderer.tsx`): numbered hotspots on a realistic screen, keyboard-operable, marks that use icon and colour, element list, verdict, filtered reason, optional note, post-submission marking with explanations.
- **Decision Scenario** (`Decision.tsx`): staged decisions with facts, branching follow-ups, change an earlier decision, consequence panel, route display, debrief.

## Admin (`src/app/admin`, `src/admin`)

| Route | Screen | Key interactions |
|---|---|---|
| `/admin` | Overview | Date range, active learners, sample-to-paid conversion, path participation, mastery distribution, activity drop-off, definitions, table view, separate local demo events |
| `/admin/paths` | Path management | Search, status filter, new draft, keyboard reorder (up/down buttons with live announcement) |
| `/admin/paths/[pathId]` | Path editor | Name, summary, outcomes, level, duration, topic, audience, prerequisites, icon, cover, free samples, save/undo/discard draft, unsaved-changes warning (and on page unload), live validation and coverage, preview, publish with note (Admin only), unpublish/republish, archive with confirmation, restore |
| `/admin/preview/[pathId]/…` | Draft preview | Overview, Explore and practice rendered with learner components from the saved draft. Nothing is recorded |
| `/admin/content` | Content and skills | Explore editing (text, free flag, ordering), skills and criteria review, coverage map, activity-to-skill mappings, review notes |
| `/admin/content/[activityId]` | Activity editor | Instructions, choices and tradeoffs, feedback text, hotspot explanations, decision consequences, preview with the real renderer including unsaved edits |
| `/admin/import` | JSON import | Paste or upload, valid/invalid examples, structural/reference/coverage validation, activity preview, import as draft, replace-draft confirmation |
| `/admin/users` | Users and access | Search, role and access filters, details dialog with progress, simulated access and role changes (Admin only) |
| `/admin/versions` | Versions | Provisional policy, version history per path, demo enrollments and attempts per version |

## States handled
Initial loading (client-only hydration), empty states (library, history, progress, local events), invalid local data (backed up and reset with a banner), storage unavailable, content seed changes, missing paths, activities and concepts, unpublished paths, locked content, failed media, unsaved admin edits, incomplete responses.
