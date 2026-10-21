import { describe, expect, it } from "vitest";
import { authoredBundles } from "@/content/paths";
import { evaluate } from "@/domain/assessment";
import { derivePathCompletion } from "@/domain/mastery";
import { submitAttempt } from "@/domain/evidence";
import { validateBundle } from "@/domain/validation";
import type { Activity, ActivityResponse, Attempt, DecisionActivity, EvidenceItem, PathBundle } from "@/domain/types";

/** Every complete route through a Decision Scenario, as response choices. */
function routes(a: DecisionActivity): { nodeId: string; choiceId: string }[][] {
  const out: { nodeId: string; choiceId: string }[][] = [];
  const walk = (nodeId: string, acc: { nodeId: string; choiceId: string }[]) => {
    const node = a.nodes.find((n) => n.id === nodeId)!;
    for (const c of node.choices) {
      const next = [...acc, { nodeId, choiceId: c.id }];
      if (c.next) walk(c.next, next);
      else out.push(next);
    }
  };
  walk(a.start, []);
  return out;
}

/** A response that meets every criterion: all-met decision route, or each hotspot judged correctly. */
function bestResponse(a: Activity): ActivityResponse | undefined {
  if (a.template === "critique") {
    return { template: "critique", reviews: Object.fromEntries(a.hotspots.map((h) => [h.id, { verdict: h.verdict, reason: h.correctReasons[0] }])) };
  }
  if (a.template === "decision") {
    const best = routes(a).find((r) => r.every(({ nodeId, choiceId }) => a.nodes.find((n) => n.id === nodeId)!.choices.find((c) => c.id === choiceId)!.signals.every((s) => s.met)));
    return best && { template: "decision", choices: best };
  }
  return undefined;
}

describe.each(authoredBundles.map((b) => [b.meta.id, b] as [string, PathBundle]))("authored path %s", (_, bundle) => {
  it("passes publication validation without errors or warnings", () => {
    const report = validateBundle(bundle);
    expect(report.issues).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it("assesses every listed criterion on every route through each scenario", () => {
    for (const a of bundle.activities) {
      if (a.template !== "decision") continue;
      for (const r of routes(a)) {
        const signalled = new Set(r.flatMap(({ nodeId, choiceId }) => a.nodes.find((n) => n.id === nodeId)!.choices.find((c) => c.id === choiceId)!.signals.map((s) => s.criterionId)));
        expect([...signalled].sort(), `${a.id}: ${r.map((x) => x.choiceId).join(" → ")}`).toEqual([...a.criteria].sort());
      }
    }
  });

  it("has a response that meets every criterion in each activity, and a weak one that doesn’t", () => {
    for (const a of bundle.activities) {
      const best = bestResponse(a);
      expect(best, a.id).toBeDefined();
      expect(evaluate(a, best!, bundle.skills).criteria.every((c) => c.met), a.id).toBe(true);
      if (a.template === "decision") {
        const weak = routes(a).some((r) => !evaluate(a, { template: "decision", choices: r }, bundle.skills).criteria.every((c) => c.met));
        expect(weak, `${a.id} has no failing route`).toBe(true);
      }
    }
  });

  it("can be completed only through demonstrated skills, and practice in one context alone isn’t enough", () => {
    let attempts: Attempt[] = [];
    let evidence: EvidenceItem[] = [];
    let n = 0;
    const run = (a: Activity) => {
      const { attempt, newEvidence } = submitAttempt(attempts, { activity: a, skills: bundle.skills, response: bestResponse(a)!, contentVersion: 1, hintsUsed: false, solutionRevealed: false, now: `2026-11-0${1 + (n % 8)}T10:00:00.000Z`, id: `t-${++n}` });
      attempts = [...attempts, attempt];
      evidence = [...evidence, ...newEvidence];
    };
    const contexts = [...new Set(bundle.activities.map((a) => a.contextKey))];
    const first = bundle.activities.filter((a) => a.contextKey === contexts[0]);
    first.forEach(run);
    expect(derivePathCompletion(bundle, evidence).complete).toBe(false);
    bundle.activities.filter((a) => a.contextKey !== contexts[0]).forEach(run);
    expect(derivePathCompletion(bundle, evidence).complete).toBe(true);
  });
});
