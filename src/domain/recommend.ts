/**
 * Responsibility 5: recommend the next activity.
 * Rule-based over the curated challenge bank. It never invents activities:
 * when eligible variants are exhausted it says so and points to review.
 */
import { skillsAssessedBy } from "./assessment";
import { deriveSkillProgress, DEFAULT_MASTERY_RULE, type MasteryRule } from "./mastery";
import type { Activity, ActivityId, Attempt, CriterionId, EvidenceItem, PathBundle, SkillId } from "./types";

export type Recommendation =
  | {
      type: "activity";
      activityId: ActivityId;
      skillIds: SkillId[];
      targetsCriteria: CriterionId[];
      reason: string;
      locked: boolean;
      conceptId?: string;
    }
  | { type: "review"; skillId: SkillId; conceptId?: string; reason: string; otherActivityId?: ActivityId }
  | { type: "complete"; reason: string };

export interface RecommendInput {
  bundle: PathBundle;
  evidence: EvidenceItem[];
  attempts: Attempt[];
  canAccess: (activityId: ActivityId) => boolean;
  /** The attempt just submitted, if recommending from a feedback screen. */
  after?: Attempt;
  rule?: MasteryRule;
}

export function recommendNext(input: RecommendInput): Recommendation {
  const { bundle, evidence, attempts, canAccess, after } = input;
  const rule = input.rule ?? DEFAULT_MASTERY_RULE;
  const required = bundle.requiredSkillIds.length ? bundle.requiredSkillIds : bundle.skills.map((s) => s.id);
  const progress = new Map(required.map((id) => [id, deriveSkillProgress(id, evidence, rule)]));

  const unmetCriteria = after ? after.evaluation.criteria.filter((c) => !c.met).map((c) => c.criterionId) : [];
  const gapSkills = after ? after.evaluation.skills.filter((s) => !s.met).map((s) => s.skillId) : [];

  const ordered: SkillId[] = [
    ...gapSkills.filter((s) => required.includes(s)),
    ...required.filter((s) => !gapSkills.includes(s) && progress.get(s)!.status !== "mastered"),
    ...required.filter((s) => !gapSkills.includes(s) && progress.get(s)!.practiceRecommended),
  ];

  if (ordered.length === 0) {
    return { type: "complete", reason: "Every required skill is Mastered. You can keep practising any activity." };
  }

  const lastActivity = after ? bundle.activities.find((a) => a.id === after.activityId) : undefined;
  const attemptedIds = new Set(attempts.map((a) => a.activityId));
  const skillName = (id: SkillId) => bundle.skills.find((s) => s.id === id)?.name ?? id;

  let exhaustedGap: SkillId | undefined;
  for (const skillId of ordered) {
    const p = progress.get(skillId)!;
    const usedContexts = new Set(p.contextsMet.map((c) => c.contextKey));
    const candidates = bundle.activities
      .filter((a) => skillsAssessedBy(a, bundle.skills).includes(skillId))
      .filter((a) => a.id !== lastActivity?.id)
      .filter((a) => !lastActivity || a.contextKey !== lastActivity.contextKey)
      .filter((a) => p.practiceRecommended || !usedContexts.has(a.contextKey));

    if (candidates.length === 0) {
      if (gapSkills.includes(skillId) && !exhaustedGap) exhaustedGap = skillId;
      continue;
    }
    if (exhaustedGap) {
      return {
        type: "review",
        skillId: exhaustedGap,
        conceptId: conceptForSkill(bundle, exhaustedGap),
        reason: exhaustedReason(skillName(exhaustedGap)),
        otherActivityId: [...candidates].sort((a, b) => Number(canAccess(b.id)) - Number(canAccess(a.id)) || a.id.localeCompare(b.id))[0].id,
      };
    }

    const score = (a: Activity) => {
      let s = 0;
      if (unmetCriteria.some((c) => a.criteria.includes(c))) s += 4;
      if (lastActivity && a.alternativeFor === lastActivity.id) s += 3;
      if (!attemptedIds.has(a.id)) s += 2;
      if (canAccess(a.id)) s += 1;
      return s;
    };
    const accessible = candidates.filter((a) => canAccess(a.id));
    const pool = accessible.length ? accessible : candidates;
    const best = [...pool].sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id))[0];
    const targets = unmetCriteria.filter((c) => best.criteria.includes(c));
    const ctx = lastActivity ? ` in a different context (${best.contextLabel})` : ` (${best.contextLabel})`;
    const why = targets.length
      ? `Practises the ${targets.length === 1 ? "criterion" : "criteria"} you missed for “${skillName(skillId)}”${ctx}.`
      : p.practiceRecommended
        ? `Further practice for “${skillName(skillId)}”, which you mastered earlier but missed recently.`
        : `Adds evidence for “${skillName(skillId)}”${ctx}. ${p.reason}`;
    return {
      type: "activity",
      activityId: best.id,
      skillIds: skillsAssessedBy(best, bundle.skills),
      targetsCriteria: targets,
      reason: why,
      locked: !canAccess(best.id),
      conceptId: conceptForSkill(bundle, skillId),
    };
  }

  const skillId = exhaustedGap ?? ordered[0];
  return { type: "review", skillId, conceptId: conceptForSkill(bundle, skillId), reason: exhaustedReason(skillName(skillId)) };
}

function exhaustedReason(name: string) {
  return `There are no other challenge contexts for “${name}” in this prototype. Review the explanation, then retry an earlier activity with a different approach. A retry is recorded, but replaying a context you already used does not add a new context.`;
}

export function conceptForSkill(bundle: PathBundle, skillId: SkillId): string | undefined {
  return bundle.explore.find((c) => c.skillId === skillId)?.id;
}
