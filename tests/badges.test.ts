import { describe, expect, it } from "vitest";
import { deriveBadges } from "@/domain/badges";
import { certificateCode, certificateQuery, readCertificateQuery, shareLinks } from "@/domain/certificate";
import type { Attempt, EvidenceItem } from "@/domain/types";

const attempt = (id: string, at: string, opts: { met: boolean[]; hints?: boolean; revealed?: boolean; duplicateOf?: string; activityId?: string }): Attempt =>
  ({
    id,
    activityId: opts.activityId ?? `act-${id}`,
    pathId: "p",
    contentVersion: 1,
    submittedAt: at,
    responseHash: id,
    response: { template: "decision", choices: [] },
    hintsUsed: !!opts.hints,
    solutionRevealed: !!opts.revealed,
    duplicateOf: opts.duplicateOf,
    evaluation: { activityId: opts.activityId ?? `act-${id}`, criteria: [], skills: opts.met.map((m, i) => ({ skillId: `s${i}`, met: m })) },
  }) as unknown as Attempt;

const ev = (a: Attempt, skillId: string, met: boolean, contextKey: string): EvidenceItem => ({
  id: `${a.id}-${skillId}`,
  attemptId: a.id,
  skillId,
  activityId: a.activityId,
  contextKey,
  contentVersion: 1,
  met,
  independent: !a.hintsUsed && !a.solutionRevealed,
  practiceOnly: a.solutionRevealed,
  at: a.submittedAt,
});

const paths = [{ id: "p", requiredSkillIds: ["s0"], activityIds: ["act-a", "act-b", "act-c", "act-d"] }];

describe("prototype badges", () => {
  it("are earned once, at the attempt that first met the condition", () => {
    const a = attempt("a", "2026-03-01T10:00:00Z", { met: [false] });
    const b = attempt("b", "2026-03-02T10:00:00Z", { met: [true], hints: true });
    const c = attempt("c", "2026-03-03T10:00:00Z", { met: [true] });
    const evidence = [ev(a, "s0", false, "x"), ev(b, "s0", true, "x"), ev(c, "s0", true, "y")];
    const got = Object.fromEntries(deriveBadges({ attempts: [c, a, b], evidence, paths }).map((x) => [x.id, x.attemptId]));
    expect(got["first-brief"]).toBe("a");
    expect(got["first-ship"]).toBe("b");
    expect(got["clean-run"]).toBe("c");
    expect(got.comeback).toBe("b");
    expect(got["streak-3"]).toBe("c");
    // Two contexts, one independent: mastery and the path are reached at c.
    expect(got["first-mastery"]).toBe("c");
    expect(got["path-complete"]).toBe("c");
  });

  it("give nothing for duplicates or revealed solutions", () => {
    const a = attempt("a", "2026-03-01T10:00:00Z", { met: [true], revealed: true });
    const d = attempt("d", "2026-03-02T10:00:00Z", { met: [true], duplicateOf: "a" });
    const got = deriveBadges({ attempts: [a, d], evidence: [ev(a, "s0", true, "x")], paths }).map((x) => x.id);
    expect(got).toEqual(["first-brief"]);
  });
});

describe("prototype certificate", () => {
  it("has a stable code and a link that round-trips", () => {
    const code = certificateCode("learner-tomas", "calibrated-trust", "2026-03-03T10:00:00Z");
    expect(code).toMatch(/^SB-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);
    expect(certificateCode("learner-tomas", "calibrated-trust", "2026-03-03T10:00:00Z")).toBe(code);
    expect(certificateCode("learner-maya", "calibrated-trust", "2026-03-03T10:00:00Z")).not.toBe(code);
    const q = certificateQuery({ name: "Tomás Lindqvist", date: "2026-03-03", code });
    expect(readCertificateQuery(`?${q}`)).toEqual({ name: "Tomás Lindqvist", date: "2026-03-03", code });
    expect(readCertificateQuery("?n=x&d=bad&c=SB-0000-0000")).toBeUndefined();
  });

  it("pre-fills LinkedIn's add-certification form", () => {
    const l = shareLinks({ url: "https://example.test/c?x=1", pathTitle: "Make It Clear", org: "Skillbench", date: "2026-10-26", code: "SB-ABCD-EFGH", text: "Done" });
    const u = new URL(l.linkedinProfile);
    expect(u.searchParams.get("startTask")).toBe("CERTIFICATION_NAME");
    expect(u.searchParams.get("name")).toBe("Make It Clear");
    expect(u.searchParams.get("issueMonth")).toBe("10");
    expect(u.searchParams.get("certUrl")).toBe("https://example.test/c?x=1");
  });
});
