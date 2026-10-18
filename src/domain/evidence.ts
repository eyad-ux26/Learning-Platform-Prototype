/**
 * Responsibility 2: turn a submitted, evaluated attempt into evidence items.
 * Duplicate submissions are recorded in history but never create evidence.
 */
import { evaluate, responseHash } from "./assessment";
import type { Activity, ActivityResponse, Attempt, EvidenceItem, Skill } from "./types";

export interface SubmitInput {
  activity: Activity;
  skills: Skill[];
  response: ActivityResponse;
  contentVersion: number;
  hintsUsed: boolean;
  solutionRevealed: boolean;
  now: string;
  id: string;
}

export interface SubmitOutcome {
  attempt: Attempt;
  newEvidence: EvidenceItem[];
}

export function submitAttempt(previousAttempts: Attempt[], input: SubmitInput): SubmitOutcome {
  const hash = responseHash(input.response);
  const duplicate = previousAttempts.find(
    (a) =>
      a.activityId === input.activity.id &&
      a.contentVersion === input.contentVersion &&
      a.responseHash === hash &&
      !a.duplicateOf,
  );
  const evaluation = evaluate(input.activity, input.response, input.skills);
  const attempt: Attempt = {
    id: input.id,
    activityId: input.activity.id,
    pathId: input.activity.pathId,
    contentVersion: input.contentVersion,
    submittedAt: input.now,
    responseHash: hash,
    response: input.response,
    hintsUsed: input.hintsUsed,
    solutionRevealed: input.solutionRevealed,
    duplicateOf: duplicate?.id,
    evaluation,
  };
  if (duplicate) return { attempt, newEvidence: [] };

  const newEvidence: EvidenceItem[] = evaluation.skills.map((s) => ({
    id: `${input.id}:${s.skillId}`,
    attemptId: input.id,
    skillId: s.skillId,
    activityId: input.activity.id,
    contextKey: input.activity.contextKey,
    contentVersion: input.contentVersion,
    met: s.met,
    independent: !input.hintsUsed && !input.solutionRevealed,
    practiceOnly: input.solutionRevealed,
    at: input.now,
  }));
  return { attempt, newEvidence };
}
