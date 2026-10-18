/**
 * Responsibilities 3 and 4: derive skill status from evidence, and decide path completion.
 *
 * PROVISIONAL PROTOTYPE RULE (configurable, not a validated educational standard):
 * A skill is Mastered once its criteria are met in at least `requiredContexts`
 * distinct challenge contexts, at least `requiredIndependent` of which were
 * independent (no hints, no revealed solution). Solution-revealed attempts are
 * practice-only. Mastery is not revoked by later unsuccessful attempts.
 */
import type { EvidenceItem, PathBundle, SkillId } from "./types";

export interface MasteryRule {
  requiredContexts: number;
  requiredIndependent: number;
}

export const DEFAULT_MASTERY_RULE: MasteryRule = { requiredContexts: 2, requiredIndependent: 1 };

export type SkillStatus = "not-demonstrated" | "developing" | "mastered";

export interface SkillProgress {
  skillId: SkillId;
  status: SkillStatus;
  /** Distinct contexts where the skill's criteria were met (counting evidence only). */
  contextsMet: { contextKey: string; activityId: string; independent: boolean }[];
  independentContexts: number;
  requiredContexts: number;
  requiredIndependent: number;
  attemptsAssessed: number;
  practiceOnlyAttempts: number;
  lastResult?: { met: boolean; activityId: string; at: string };
  /** Mastered, but the most recent attempt did not meet the criteria. */
  practiceRecommended: boolean;
  /** Plain-language explanation of the status. */
  reason: string;
}

export function deriveSkillProgress(
  skillId: SkillId,
  evidence: EvidenceItem[],
  rule: MasteryRule = DEFAULT_MASTERY_RULE,
): SkillProgress {
  const items = evidence.filter((e) => e.skillId === skillId).sort((a, b) => a.at.localeCompare(b.at));
  const counting = items.filter((e) => e.met && !e.practiceOnly);

  const byContext = new Map<string, { contextKey: string; activityId: string; independent: boolean }>();
  for (const e of counting) {
    const prev = byContext.get(e.contextKey);
    if (!prev) byContext.set(e.contextKey, { contextKey: e.contextKey, activityId: e.activityId, independent: e.independent });
    else if (!prev.independent && e.independent) byContext.set(e.contextKey, { contextKey: e.contextKey, activityId: e.activityId, independent: true });
  }
  const contextsMet = [...byContext.values()];
  const independentContexts = contextsMet.filter((c) => c.independent).length;

  // Mastery is established at the first moment the rule held, and is then kept.
  let mastered = false;
  const seen = new Map<string, boolean>();
  for (const e of counting) {
    seen.set(e.contextKey, (seen.get(e.contextKey) ?? false) || e.independent);
    const indep = [...seen.values()].filter(Boolean).length;
    if (seen.size >= rule.requiredContexts && indep >= rule.requiredIndependent) mastered = true;
  }

  const last = items[items.length - 1];
  const status: SkillStatus = mastered ? "mastered" : items.length > 0 ? "developing" : "not-demonstrated";
  const practiceRecommended = mastered && !!last && !last.met;

  let reason: string;
  if (status === "mastered") {
    reason = practiceRecommended
      ? "Mastered earlier. Your most recent attempt missed a criterion, so more practice is recommended."
      : `Criteria met in ${contextsMet.length} different contexts, including ${independentContexts} without hints or a revealed solution.`;
  } else if (status === "not-demonstrated") {
    reason = "No attempts have assessed this skill yet. Viewing lessons does not count as evidence.";
  } else {
    const needContexts = Math.max(0, rule.requiredContexts - contextsMet.length);
    const needIndep = Math.max(0, rule.requiredIndependent - independentContexts);
    const parts: string[] = [];
    if (needContexts > 0) parts.push(`meet the criteria in ${needContexts} more ${needContexts === 1 ? "context" : "contexts"}`);
    if (needIndep > 0 && needContexts === 0) parts.push("complete one attempt without hints or a revealed solution");
    else if (needIndep > 0) parts.push("at least one of them without hints or a revealed solution");
    reason = `To master this skill, ${parts.join(", ")}.`;
  }

  return {
    skillId,
    status,
    contextsMet,
    independentContexts,
    requiredContexts: rule.requiredContexts,
    requiredIndependent: rule.requiredIndependent,
    attemptsAssessed: items.length,
    practiceOnlyAttempts: items.filter((e) => e.practiceOnly).length,
    lastResult: last ? { met: last.met, activityId: last.activityId, at: last.at } : undefined,
    practiceRecommended,
    reason,
  };
}

export interface PathCompletion {
  complete: boolean;
  mastered: SkillId[];
  remaining: SkillId[];
  reason: string;
}

export function derivePathCompletion(
  bundle: PathBundle,
  evidence: EvidenceItem[],
  rule: MasteryRule = DEFAULT_MASTERY_RULE,
): PathCompletion {
  const required = bundle.requiredSkillIds.length ? bundle.requiredSkillIds : bundle.skills.map((s) => s.id);
  const pathEvidence = evidence.filter((e) => bundle.activities.some((a) => a.id === e.activityId));
  const mastered = required.filter((id) => deriveSkillProgress(id, pathEvidence, rule).status === "mastered");
  const remaining = required.filter((id) => !mastered.includes(id));
  const names = remaining.map((id) => bundle.skills.find((s) => s.id === id)?.name ?? id);
  return {
    complete: required.length > 0 && remaining.length === 0,
    mastered,
    remaining,
    reason:
      remaining.length === 0
        ? "Every required skill is Mastered."
        : `Not complete yet: ${names.length} of ${required.length} required ${required.length === 1 ? "skill is" : "skills are"} not Mastered (${names.join(", ")}). Lessons viewed and activities attempted do not complete a path on their own.`,
  };
}
