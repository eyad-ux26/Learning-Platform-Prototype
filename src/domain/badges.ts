import { DEFAULT_MASTERY_RULE, deriveSkillProgress, type MasteryRule } from "./mastery";
import { dayIndex } from "./progression";
import type { Attempt, EvidenceItem } from "./types";

/**
 * Prototype badges: motivation derived from the learner's own attempts and evidence, like Rep and streaks.
 * They never change a skill's status and never complete a path. Each badge is earned once (path completion once per path),
 * at the attempt that first met its condition, so a result screen can show what that attempt earned.
 */
export const BADGES = [
  { id: "first-brief", name: "First brief", detail: "Submitted your first activity" },
  { id: "first-ship", name: "Shipped", detail: "Met every criterion in an activity" },
  { id: "clean-run", name: "Clean run", detail: "Met every criterion without hints" },
  { id: "comeback", name: "Comeback", detail: "Met a criterion you had missed before" },
  { id: "streak-3", name: "3-day streak", detail: "Practised three days in a row" },
  { id: "first-mastery", name: "Mastered", detail: "Mastered your first skill" },
  { id: "path-complete", name: "Path complete", detail: "Mastered every skill in a path" },
] as const;

export type BadgeId = (typeof BADGES)[number]["id"];

export interface EarnedBadge {
  id: BadgeId;
  attemptId: string;
  at: string;
  /** For "path-complete": the path. */
  pathId?: string;
}

export interface BadgePath {
  id: string;
  requiredSkillIds: string[];
  activityIds: string[];
}

export function deriveBadges(input: { attempts: Attempt[]; evidence: EvidenceItem[]; paths: BadgePath[]; offsetMinutes?: number; rule?: MasteryRule }): EarnedBadge[] {
  const rule = input.rule ?? DEFAULT_MASTERY_RULE;
  const off = input.offsetMinutes ?? 0;
  const attempts = [...input.attempts].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  const earned: EarnedBadge[] = [];
  const has = (id: BadgeId, pathId?: string) => earned.some((b) => b.id === id && b.pathId === pathId);
  const earn = (id: BadgeId, a: Attempt, pathId?: string) => {
    if (!has(id, pathId)) earned.push({ id, attemptId: a.id, at: a.submittedAt, ...(pathId ? { pathId } : {}) });
  };

  const seenAttempts = new Set<string>();
  const missed = new Set<string>();
  const days = new Set<number>();
  for (const a of attempts) {
    seenAttempts.add(a.id);
    if (a.duplicateOf) continue;
    const mine = input.evidence.filter((e) => e.attemptId === a.id);
    const counting = !a.solutionRevealed;
    const allMet = a.evaluation.skills.length > 0 && a.evaluation.skills.every((s) => s.met);

    earn("first-brief", a);
    if (counting && allMet) earn("first-ship", a);
    if (counting && allMet && !a.hintsUsed) earn("clean-run", a);
    if (counting && mine.some((e) => e.met && missed.has(e.skillId))) earn("comeback", a);
    for (const e of mine) if (!e.met) missed.add(e.skillId);

    const d = dayIndex(a.submittedAt, off);
    days.add(d);
    if (days.has(d - 1) && days.has(d - 2)) earn("streak-3", a);

    // Mastery and completion, from the evidence recorded up to and including this attempt.
    const sofar = input.evidence.filter((e) => seenAttempts.has(e.attemptId));
    if (!has("first-mastery")) {
      const skills = new Set(sofar.map((e) => e.skillId));
      if ([...skills].some((id) => deriveSkillProgress(id, sofar, rule).status === "mastered")) earn("first-mastery", a);
    }
    const path = input.paths.find((p) => p.id === a.pathId);
    if (path && path.requiredSkillIds.length && !has("path-complete", path.id)) {
      const onPath = sofar.filter((e) => path.activityIds.includes(e.activityId));
      if (path.requiredSkillIds.every((id) => deriveSkillProgress(id, onPath, rule).status === "mastered")) earn("path-complete", a, path.id);
    }
  }
  return earned;
}
