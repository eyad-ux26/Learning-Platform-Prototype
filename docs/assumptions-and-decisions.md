# Assumptions and unresolved product decisions

Each assumption below is reversible and was made so the prototype could be built coherently. Items marked **Decision needed** need a stakeholder answer before Phase 1.

## Product and learning

| # | Assumption in the prototype | Status |
|---|---|---|
| 1 | Mastery = criteria met in **2 distinct contexts**, at least **1 independent**. Configurable in `DEFAULT_MASTERY_RULE`. | **Decision needed**, with learning-science review |
| 2 | Hints keep evidence but make it non-independent; a revealed solution makes the attempt practice-only. | Decision needed |
| 3 | Mastery is never revoked; later failures flag "further practice recommended". | Decision needed (alternatives: decay, re-certification) |
| 4 | A skill is met in an attempt only if **all** of that skill’s criteria assessed by the activity are met. | Confirm |
| 5 | Critique assesses verdict **and** reason; optional notes are stored but not assessed. | Confirm. Assessing free text needs a separate decision about AI or human review |
| 6 | Statuses are Not yet demonstrated, Developing, Mastered. "Developing" means attempted but not mastered, including all-failed attempts. | Confirm wording |
| 7 | Contexts are explicit `contextKey`s chosen by content authors. | Confirm. Needs authoring guidance |
| 8 | Completion requires every skill in `requiredSkillIds` (all four for the flagship). | Confirm |
| 9 | Recommendation is rule-based from a curated bank; when no new context exists we say so and point to review. | Confirm. Phase 2 may add generated variants |
| 10 | Learning claims in Explore (for example, uncalibrated percentages mislead; repeated dialogs get clicked through) are practitioner guidance without citations; listed as review notes in the content. | **Expert review needed** |
| 11 | Scenario outcomes and analytics numbers are fictional illustrations. | Fine for the prototype |

## Access and commerce

| # | Assumption | Status |
|---|---|---|
| 12 | One platform-wide subscription, monthly or annual. Prices €19 / €190 are **placeholders**. | **Decision needed**: pricing, currency, tax, trials |
| 13 | Free samples: 2 flagship activities, the first flagship lesson, and 1 sample activity per preview path. | Decision needed |
| 14 | Evidence earned on free samples carries over when the learner subscribes. | Confirm |
| 15 | Cancellation keeps access to the period end; after expiry, evidence and history remain and free samples stay available. | Confirm |
| 16 | Period end dates are illustrative (computed from the browser clock); scenario content uses a fixed date (10 March 2026). | Prototype only |

## Content operations and versions

| # | Assumption | Status |
|---|---|---|
| 17 | Learners see only published versions; drafts are invisible. | Confirm |
| 18 | Enrollments are pinned to the version they started on; new enrollments use the latest version; attempts keep their version and are never re-evaluated. | Provisional policy, **Decision needed** |
| 19 | When a learner moves to a newer version, existing evidence still counts as recorded. Alternative: require fresh evidence for changed activities. | **Decision needed** |
| 20 | Library metadata and order always show the latest published version. Order changes apply immediately (a catalogue setting, not versioned). | Confirm |
| 21 | Editors can edit and preview; only Admins publish, unpublish, archive and change access. | Confirm the role model |
| 22 | Skill criteria and assessment rules are not edited inline; they change through the validated JSON format so assessment can’t change by accident. | Confirm |
| 23 | Unpublishing or archiving hides a path from learners, including enrolled learners; evidence is kept. | Decision needed (should enrolled learners keep access?) |

## Interface and platform

| # | Assumption | Status |
|---|---|---|
| 24 | Working product name "Skillbench" (single constant in `src/i18n/en.ts`). | Replaceable |
| 25 | English UI and content. Interface strings are centralised in `src/i18n/en.ts`, and layout uses logical properties (start/end) to prepare for Arabic and RTL. Content strings live in content fixtures. | **Decision needed**: launch languages; Arabic content strategy |
| 26 | Dark learner interface; activity previews use light "product" styling so they read as real apps. | Confirm visual direction |
| 27 | Video lessons are labelled placeholders with storyboards and transcripts; no video assets exist. | Decision needed: video production scope |
| 28 | The Phase 2 resource-to-path generator is out of scope; the content format is designed so Claude-assisted drafting can feed the importer later. | As briefed |
