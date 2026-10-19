import { describe, expect, it } from "vitest";
import { DAILY_GOAL_REP, RANKS, REP, deriveProgression } from "@/domain/progression";
import type { Attempt, EvidenceItem } from "@/domain/types";

const at = (day: number, h = 10) => `2026-05-${String(day).padStart(2, "0")}T${String(h).padStart(2, "0")}:00:00.000Z`;
const attempt = (id: string, day: number, extra: Partial<Attempt> = {}) => ({ id, submittedAt: at(day), ...extra }) as Attempt;
const ev = (attemptId: string, extra: Partial<EvidenceItem> = {}) => ({ attemptId, met: true, independent: true, practiceOnly: false, ...extra }) as EvidenceItem;

describe("progression", () => {
  it("scores new attempts and met criteria, not duplicates or practice-only evidence", () => {
    const p = deriveProgression({
      attempts: [attempt("a", 10), attempt("b", 10, { duplicateOf: "a" }), attempt("c", 10)],
      evidence: [ev("a"), ev("a", { independent: false }), ev("a", { met: false }), ev("b"), ev("c", { practiceOnly: true })],
      masteredSkills: 0,
      now: at(10, 18),
    });
    expect(p.rep).toBe(REP.attempt + REP.metIndependent + REP.metAssisted + REP.attempt);
    expect(p.repToday).toBe(p.rep);
    expect(p.dailyGoal).toBe(DAILY_GOAL_REP);
  });

  it("adds a bonus per Mastered skill and derives the rank from Rep", () => {
    const p = deriveProgression({ attempts: [], evidence: [], masteredSkills: 3, now: at(10) });
    expect(p.rep).toBe(300);
    expect(p.rank.name).toBe(RANKS[1].name);
    expect(p.next?.name).toBe(RANKS[2].name);
    expect(p.rankProgress).toBeCloseTo((300 - 150) / (400 - 150));
    expect(deriveProgression({ attempts: [], evidence: [], masteredSkills: 20, now: at(10) }).rankProgress).toBe(1);
  });

  it("counts consecutive days and does not break the streak when today is still empty", () => {
    const attempts = [attempt("a", 7), attempt("b", 8), attempt("c", 9)];
    const p = deriveProgression({ attempts, evidence: [], masteredSkills: 0, now: at(10) });
    expect(p.streakDays).toBe(3);
    expect(p.last7.slice(-4)).toEqual(["done", "done", "done", "none"]);
    expect(deriveProgression({ attempts, evidence: [], masteredSkills: 0, now: at(12) }).streakDays).toBe(0);
  });

  it("bridges one missed day with a freeze", () => {
    const p = deriveProgression({ attempts: [attempt("a", 6), attempt("b", 8), attempt("c", 9), attempt("d", 10)], evidence: [], masteredSkills: 0, now: at(10) });
    expect(p.streakDays).toBe(4);
    expect(p.freezesUsed).toBe(1);
    expect(p.last7[3]).toBe("freeze");
    const two = deriveProgression({ attempts: [attempt("a", 4), attempt("b", 6), attempt("c", 8), attempt("d", 10)], evidence: [], masteredSkills: 0, now: at(10) });
    expect(two.streakDays).toBe(2);
  });
});
