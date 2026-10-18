# Provisional assessment and mastery rules

> These are **prototype assumptions** chosen to make the learning mechanics reviewable. They are not a validated educational standard and need expert review before production.

The engine lives in `src/domain/` and has no React dependencies. Each responsibility is separate:

| Responsibility | Module | What it does |
|---|---|---|
| 1. Evaluate a response | `assessment.ts` | Deterministically scores one response against the activity's explicit criteria. Returns per-criterion results with the evidence (what in the response supports the judgement), feedback and practical consequence, plus per-skill results. |
| 2. Store evidence | `evidence.ts` | Turns an evaluated attempt into one evidence item per assessed skill. Flags duplicates. |
| 3. Derive skill status | `mastery.ts` → `deriveSkillProgress` | Not yet demonstrated / Developing / Mastered, with a plain-language reason. |
| 4. Path completion | `mastery.ts` → `derivePathCompletion` | Complete only when every required skill is Mastered. |
| 5. Recommend next | `recommend.ts` | Rule-based choice from the curated bank. Never invents activities. |

## Mastery rule (configurable: `DEFAULT_MASTERY_RULE`)

A skill becomes **Mastered** when its criteria are met in at least **2 distinct challenge contexts**, at least **1** of which was **independent** (no hint used, no solution revealed).

- A skill is "met" in an attempt when every criterion of that skill that the activity assesses is met.
- One activity can assess several skills; each gets its own result and evidence item.

## Evidence rules

| Rule | Implementation |
|---|---|
| Duplicate submissions don’t inflate progress | An identical response (same activity, same content version, same canonical hash) is recorded in history as a duplicate and creates **no** evidence. Optional notes are excluded from the hash. |
| Replaying a challenge doesn’t add independent contexts | Contexts are counted by `contextKey`, so repeat attempts at the same activity, or variants sharing a context, count once. |
| Revealing a solution makes the attempt practice-only | Evidence is stored with `practiceOnly: true` and never counts. The learner is warned before revealing. |
| Hints | Hint-assisted attempts count as evidence but not as independent. The learner is warned before the first hint. |
| Viewing lessons | Creates no evidence. Lesson views are tracked separately (`viewedConcepts`). |
| Later failures | Kept in history. Mastery is not revoked; "further practice recommended" is flagged. |
| Content versions | Every attempt records the version it was assessed against. Attempts are never re-evaluated. |

## Statuses

- **Not yet demonstrated**: no attempt has assessed the skill.
- **Developing**: at least one attempt assessed it, but the rule isn’t met yet. The UI says what is missing (for example, "meet the criteria in 1 more context").
- **Mastered**: the rule was met at some point. The UI names the contexts and whether each was independent.

The learner UI shows a segmented meter (one segment per required context), never a percentage.

## Template scoring

- **Design Bench**: each criterion has explicit `passWhen` condition groups over the chosen options (OR of ANDs), so combinations matter (for example, "apply on task save" only passes when the value is visibly provisional). Several combinations can pass.
- **Critique a Design**: an element is correct only when both the verdict (acceptable/problematic) **and** the reason are right. A criterion passes only if every element linked to it is correct. Each criterion links at least one acceptable element, so marking everything problematic fails. Notes are stored but not assessed.
- **Decision Scenario**: each choice emits per-criterion signals. A criterion passes only if every signal on the learner’s route is positive. Routes branch (for example, an automatic bulk change leads to a client-incident follow-up).

## Recommendation rules

After a submission:
1. Target the skills whose criteria were missed, then other unmastered skills, then mastered skills flagged for practice.
2. Candidates must assess the skill, be a **different** activity, and use a **different context** from the one just attempted. Contexts already counted for that skill are skipped.
3. Prefer: covers the missed criterion > is the alternative for the activity just attempted > not attempted yet > accessible with current access.
4. If the learner can’t access any candidate, recommend the best one and mark it as subscription-only.
5. If no other context exists for the gap, say so honestly, point to the explanation and to retrying, and offer another skill’s practice. Never fabricate a new activity.

## Content validation (publication gate)

`validation.ts` blocks publication when: structure is invalid, references are broken (criteria, concepts, free samples, alternatives, decision nodes, rule options), a criterion has no rule or element evaluating it, or a required skill in a full path has fewer than 2 distinct contexts or criteria with no activity.
