import type { Attempt, EvidenceItem } from "./types";

/**
 * Prototype scoring: Rep, streak, rank and the daily goal are derived from the learner's own attempts and
 * evidence. They are motivation, not assessment. They never change a skill's status and never complete a path.
 * Duplicate responses and lesson views earn nothing; practice-only evidence earns nothing.
 */
export const REP = {
  /** A new (non-duplicate) submitted response. */
  attempt: 10,
  /** Per met criterion with no hints and no revealed solution. */
  metIndependent: 15,
  /** Per met criterion where hints were used. */
  metAssisted: 8,
  /** Once per Mastered skill. */
  mastered: 100,
} as const;

export const DAILY_GOAL_REP = 60;

export const RANKS = [
  { id: "junior", name: "Junior", at: 0 },
  { id: "designer-1", name: "Designer I", at: 150 },
  { id: "designer-2", name: "Designer II", at: 400 },
  { id: "senior", name: "Senior", at: 800 },
  { id: "lead", name: "Lead", at: 1400 },
] as const;

export type DayState = "done" | "freeze" | "none";

export interface Progression {
  rep: number;
  repToday: number;
  dailyGoal: number;
  rank: (typeof RANKS)[number];
  rankIndex: number;
  next?: (typeof RANKS)[number];
  /** 0..1 progress from the current rank to the next; 1 at the top rank. */
  rankProgress: number;
  streakDays: number;
  freezesUsed: number;
  /** Oldest first, ending today. */
  last7: DayState[];
}

const MIN = 60_000;
const DAY = 86_400_000;

/** Whole local days since the epoch for an ISO timestamp. `offsetMinutes` is `Date#getTimezoneOffset()`. */
export function dayIndex(iso: string, offsetMinutes = 0): number {
  return Math.floor((new Date(iso).getTime() - offsetMinutes * MIN) / DAY);
}

export function attemptRep(attempt: Attempt, evidence: EvidenceItem[]): number {
  if (attempt.duplicateOf) return 0;
  let rep = REP.attempt;
  for (const e of evidence) {
    if (e.attemptId !== attempt.id || !e.met || e.practiceOnly) continue;
    rep += e.independent ? REP.metIndependent : REP.metAssisted;
  }
  return rep;
}

export function deriveProgression(input: { attempts: Attempt[]; evidence: EvidenceItem[]; masteredSkills: number; now: string; offsetMinutes?: number }): Progression {
  const off = input.offsetMinutes ?? 0;
  const today = dayIndex(input.now, off);
  const byDay = new Map<number, number>();
  let rep = input.masteredSkills * REP.mastered;
  for (const a of input.attempts) {
    const r = attemptRep(a, input.evidence);
    if (!r) continue;
    rep += r;
    const d = dayIndex(a.submittedAt, off);
    byDay.set(d, (byDay.get(d) ?? 0) + r);
  }

  let rankIndex = 0;
  RANKS.forEach((r, i) => {
    if (rep >= r.at) rankIndex = i;
  });
  const next = RANKS[rankIndex + 1];
  const rank = RANKS[rankIndex];

  // A streak is consecutive days with at least one scored attempt. One missed day is bridged by a freeze,
  // once per streak, when practice resumes the day before. Today may still be empty without breaking it.
  const active = (d: number) => byDay.has(d);
  let streakDays = 0;
  let freezesUsed = 0;
  const frozen = new Set<number>();
  let d = active(today) ? today : today - 1;
  while (true) {
    if (active(d)) {
      streakDays++;
      d--;
    } else if (streakDays > 0 && freezesUsed === 0 && active(d - 1)) {
      freezesUsed = 1;
      frozen.add(d);
      d--;
    } else break;
  }
  const last7: DayState[] = Array.from({ length: 7 }, (_, i) => {
    const day = today - 6 + i;
    return active(day) ? "done" : frozen.has(day) ? "freeze" : "none";
  });

  return {
    rep,
    repToday: byDay.get(today) ?? 0,
    dailyGoal: DAILY_GOAL_REP,
    rank,
    rankIndex,
    next,
    rankProgress: next ? (rep - rank.at) / (next.at - rank.at) : 1,
    streakDays,
    freezesUsed,
    last7,
  };
}
