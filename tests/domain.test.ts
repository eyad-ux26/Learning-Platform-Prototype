import { describe, expect, it } from "vitest";
import { checkCompleteness, evaluate } from "@/domain/assessment";
import { clone, ensureDraft, isLearnerVisible, latestPublished, publishDraft, saveDraft, versionFor } from "@/domain/catalog";
import { submitAttempt } from "@/domain/evidence";
import { derivePathCompletion, deriveSkillProgress } from "@/domain/mastery";
import { recommendNext } from "@/domain/recommend";
import type { Activity, ActivityResponse, Attempt, EvidenceItem, PathBundle } from "@/domain/types";
import { validateBundle } from "@/domain/validation";
import { flagshipBundle } from "@/content/flagship";
import { libraryBundles } from "@/content/library";
import { seedCatalog, seedLearner } from "@/content/seed";

const b = flagshipBundle;
const act = (id: string) => b.activities.find((a) => a.id === id)!;

const good = {
  deadline: { template: "design-bench", selections: { presentation: "ghost", uncertainty: "specific", evidence: "source", correction: "alts", commitment: "accept", recovery: "both" } },
  invoice: { template: "design-bench", selections: { presentation: "chip", uncertainty: "specific", evidence: "quote" } },
  recap: {
    template: "critique",
    reviews: {
      "h-label": { verdict: "acceptable", reason: "clear-ai-origin" },
      "h-board": { verdict: "problematic", reason: "unmarked-ai" },
      "h-confidence": { verdict: "problematic", reason: "false-precision" },
      "h-speakers": { verdict: "acceptable", reason: "actionable-uncertainty" },
      "h-decision": { verdict: "problematic", reason: "no-source" },
      "h-action": { verdict: "acceptable", reason: "inspectable-source" },
      "h-why": { verdict: "problematic", reason: "generic-explanation" },
      "h-coverage": { verdict: "acceptable", reason: "specific-explanation" },
    },
  },
} satisfies Record<string, ActivityResponse>;

class Learner {
  attempts: Attempt[] = [];
  evidence: EvidenceItem[] = [];
  n = 0;
  submit(activity: Activity, response: ActivityResponse, opts: { hints?: boolean; reveal?: boolean; version?: number } = {}) {
    const out = submitAttempt(this.attempts, {
      activity,
      skills: b.skills,
      response,
      contentVersion: opts.version ?? 1,
      hintsUsed: !!opts.hints,
      solutionRevealed: !!opts.reveal,
      now: new Date(Date.UTC(2026, 2, 10, 9, this.n)).toISOString(),
      id: `a${++this.n}`,
    });
    this.attempts.push(out.attempt);
    this.evidence.push(...out.newEvidence);
    return out;
  }
  status(skill: string) {
    return deriveSkillProgress(skill, this.evidence);
  }
}

describe("content", () => {
  it("flagship and library bundles validate", () => {
    for (const bundle of [flagshipBundle, ...libraryBundles]) {
      const r = validateBundle(bundle);
      expect(r.issues.filter((i) => i.level === "error"), bundle.meta.id).toEqual([]);
    }
  });
  it("every flagship skill has at least two distinct contexts", () => {
    const r = validateBundle(flagshipBundle);
    for (const c of r.coverage) expect(c.contexts.length).toBeGreaterThanOrEqual(2);
  });
  it("has 8 baseline and at least 4 alternative flagship activities", () => {
    expect(b.activities.filter((a) => a.kind === "baseline")).toHaveLength(8);
    expect(b.activities.filter((a) => a.kind === "alternative").length).toBeGreaterThanOrEqual(4);
  });
});

describe("assessment", () => {
  it("evaluates each assessed skill separately", () => {
    const resp: ActivityResponse = { template: "design-bench", selections: { ...good.deadline.selections, commitment: "dialog" } };
    const e = evaluate(act("bench-deadline"), resp, b.skills);
    expect(e.skills.find((s) => s.skillId === "uncertainty")?.met).toBe(true);
    expect(e.skills.find((s) => s.skillId === "commitment")?.met).toBe(false);
    expect(e.criteria.find((c) => c.criterionId === "com-proportionate")?.evidence.length).toBeGreaterThan(0);
  });

  it("flagging every critique element as problematic does not produce a perfect result", () => {
    const a = act("critique-recap");
    if (a.template !== "critique") throw new Error();
    const reviews = Object.fromEntries(a.hotspots.map((h) => [h.id, { verdict: "problematic" as const, reason: h.verdict === "problematic" ? h.correctReasons[0] : "no-source" }]));
    const e = evaluate(a, { template: "critique", reviews }, b.skills);
    expect(e.criteria.every((c) => c.met)).toBe(false);
    expect(e.detail?.kind === "critique" && e.detail.wronglyFlagged.length).toBe(4);
  });

  it("evaluates the reason as well as the judgement", () => {
    const reviews = { ...good.recap.reviews, "h-confidence": { verdict: "problematic" as const, reason: "no-source" } };
    const e = evaluate(act("critique-recap"), { template: "critique", reviews }, b.skills);
    expect(e.criteria.find((c) => c.criterionId === "unc-actionable")?.met).toBe(false);
  });

  it("reports incomplete responses", () => {
    const c = checkCompleteness(act("bench-deadline"), { template: "design-bench", selections: { presentation: "chip" } });
    expect(c.complete).toBe(false);
    expect(c.missing).toHaveLength(5);
    const d = checkCompleteness(act("scenario-replan"), { template: "decision", choices: [{ nodeId: "n0", choiceId: "inline" }] });
    expect(d.complete).toBe(false);
  });

  it("follows decision branches", () => {
    const a = act("scenario-replan");
    const resp: ActivityResponse = { template: "decision", choices: [{ nodeId: "n0", choiceId: "inline" }, { nodeId: "n1", choiceId: "auto" }, { nodeId: "n2-incident", choiceId: "revert-selected" }, { nodeId: "n3", choiceId: "label" }] };
    expect(checkCompleteness(a, resp).complete).toBe(true);
    const e = evaluate(a, resp, b.skills);
    expect(e.criteria.find((c) => c.criterionId === "com-proportionate")?.met).toBe(false);
    expect(e.criteria.find((c) => c.criterionId === "cor-recovery")?.met).toBe(true);
  });
});

describe("evidence and mastery", () => {
  it("duplicate submissions do not inflate evidence", () => {
    const l = new Learner();
    l.submit(act("bench-deadline"), good.deadline);
    const second = l.submit(act("bench-deadline"), good.deadline);
    expect(second.attempt.duplicateOf).toBe("a1");
    expect(second.newEvidence).toHaveLength(0);
    expect(l.attempts).toHaveLength(2); // still visible in history
    expect(l.status("uncertainty").contextsMet).toHaveLength(1);
    expect(l.status("uncertainty").status).toBe("developing");
  });

  it("replaying the same challenge with a different response does not add a second context", () => {
    const l = new Learner();
    l.submit(act("bench-deadline"), good.deadline);
    l.submit(act("bench-deadline"), { template: "design-bench", selections: { ...good.deadline.selections, recovery: "undo" } });
    expect(l.status("uncertainty").contextsMet).toHaveLength(1);
    expect(l.status("uncertainty").status).toBe("developing");
  });

  it("variants that share a context key count as one context", () => {
    const variant: Activity = { ...clone(act("bench-invoice")), id: "bench-invoice-variant", contextKey: act("bench-deadline").contextKey };
    const l = new Learner();
    l.submit(act("bench-deadline"), good.deadline);
    l.submit(variant, good.invoice);
    expect(l.status("uncertainty").contextsMet).toHaveLength(1);
    expect(l.status("uncertainty").status).not.toBe("mastered");
    l.submit(act("bench-invoice"), good.invoice);
    expect(l.status("uncertainty").status).toBe("mastered");
  });

  it("solution-revealed attempts are practice-only", () => {
    const l = new Learner();
    l.submit(act("bench-deadline"), good.deadline, { reveal: true });
    l.submit(act("bench-invoice"), good.invoice, { reveal: true });
    const s = l.status("uncertainty");
    expect(s.status).toBe("developing");
    expect(s.contextsMet).toHaveLength(0);
    expect(s.practiceOnlyAttempts).toBe(2);
  });

  it("requires at least one independent context", () => {
    const l = new Learner();
    l.submit(act("bench-deadline"), good.deadline, { hints: true });
    l.submit(act("bench-invoice"), good.invoice, { hints: true });
    expect(l.status("uncertainty").status).toBe("developing");
    l.submit(act("critique-recap"), good.recap);
    expect(l.status("uncertainty").status).toBe("mastered");
  });

  it("does not revoke mastery after a later failure, but recommends practice", () => {
    const l = new Learner();
    l.submit(act("bench-deadline"), good.deadline);
    l.submit(act("bench-invoice"), good.invoice);
    expect(l.status("uncertainty").status).toBe("mastered");
    l.submit(act("critique-recap"), { template: "critique", reviews: { ...good.recap.reviews, "h-label": { verdict: "problematic", reason: "unmarked-ai" } } });
    const s = l.status("uncertainty");
    expect(s.status).toBe("mastered");
    expect(s.practiceRecommended).toBe(true);
    expect(l.attempts).toHaveLength(3);
  });

  it("viewing lessons creates no evidence", () => {
    const learner = seedLearner("new-free");
    learner.viewedConcepts = Object.fromEntries(b.explore.map((c) => [c.id, "2026-03-10T00:00:00Z"]));
    expect(learner.evidence).toHaveLength(0);
    expect(deriveSkillProgress("uncertainty", learner.evidence).status).toBe("not-demonstrated");
  });

  it("path completes only when every required skill is mastered", () => {
    const near = seedLearner("near-complete");
    const c = derivePathCompletion(b, near.evidence);
    expect(c.mastered).toHaveLength(3);
    expect(c.complete).toBe(false);
    expect(c.remaining).toEqual(["commitment"]);
    const l = new Learner();
    l.attempts = [...near.attempts];
    l.evidence = [...near.evidence];
    l.n = 100;
    l.submit(act("bench-pricing"), { template: "design-bench", selections: { scope: "diff", commitment: "review", recovery: "rollback" } });
    expect(derivePathCompletion(b, l.evidence).complete).toBe(true);
  });
});

describe("recommendations", () => {
  it("targets the unmet skill in a different context after a failure", () => {
    const l = new Learner();
    const fail = l.submit(act("bench-deadline"), { template: "design-bench", selections: { ...good.deadline.selections, commitment: "dialog" } });
    const rec = recommendNext({ bundle: b, evidence: l.evidence, attempts: l.attempts, canAccess: () => true, after: fail.attempt });
    expect(rec.type).toBe("activity");
    if (rec.type !== "activity") return;
    const next = act(rec.activityId);
    expect(next.criteria).toContain("com-proportionate");
    expect(next.contextKey).not.toBe("task-deadline");
    expect(rec.targetsCriteria).toContain("com-proportionate");
  });

  it("prefers accessible activities for free learners and flags locked ones", () => {
    const l = new Learner();
    const fail = l.submit(act("bench-deadline"), { template: "design-bench", selections: { ...good.deadline.selections, commitment: "dialog" } });
    const rec = recommendNext({ bundle: b, evidence: l.evidence, attempts: l.attempts, canAccess: (id) => b.meta.freeSampleActivityIds.includes(id), after: fail.attempt });
    expect(rec.type === "activity" && rec.locked).toBe(true);
  });

  it("is honest when variants are exhausted", () => {
    const tiny: PathBundle = { ...clone(b), activities: [act("bench-deadline"), act("bench-invoice")] };
    tiny.explore = tiny.explore.map((c) => ({ ...c, practiceActivityIds: [] }));
    const l = new Learner();
    const fail = l.submit(act("bench-deadline"), { template: "design-bench", selections: { ...good.deadline.selections, commitment: "dialog" } });
    const rec = recommendNext({ bundle: tiny, evidence: l.evidence, attempts: l.attempts, canAccess: () => true, after: fail.attempt });
    // commitment only appears in bench-deadline here, so no different context exists
    expect(rec.type).toBe("review");
    if (rec.type !== "review") return;
    expect(rec.skillId).toBe("commitment");
    expect(rec.reason).toMatch(/no other challenge contexts/);
  });
});

describe("drafts and publishing", () => {
  it("draft edits stay separate from published content", () => {
    const catalog = seedCatalog();
    const entry = ensureDraft(catalog.entries[b.meta.id], "2026-03-10T00:00:00Z");
    const draft = clone(entry.draft!);
    draft.meta.title = "Changed title";
    const saved = saveDraft(entry, draft, "2026-03-10T00:01:00Z");
    expect(latestPublished(saved)!.bundle.meta.title).toBe(b.meta.title);
    expect(saved.draft!.meta.title).toBe("Changed title");
    expect(versionFor(saved)!.bundle.meta.title).toBe(b.meta.title);

    const pub = publishDraft(saved, "Sam", "Rename", "2026-03-10T00:02:00Z");
    expect(pub.published).toBe(true);
    expect(pub.entry.versions).toHaveLength(2);
    expect(latestPublished(pub.entry)!.bundle.meta.title).toBe("Changed title");
    // Existing enrollments remain on their recorded version.
    expect(versionFor(pub.entry, { pathId: b.meta.id, contentVersion: 1, startedAt: "" })!.bundle.meta.title).toBe(b.meta.title);
  });

  it("blocks publication when coverage is insufficient or references are invalid", () => {
    const catalog = seedCatalog();
    let entry = ensureDraft(catalog.entries[b.meta.id], "t");
    const draft = clone(entry.draft!);
    draft.activities = draft.activities.filter((a) => !["bench-booking", "scenario-replan", "bench-pricing", "critique-archive", "scenario-calendar"].includes(a.id));
    entry = saveDraft(entry, draft, "t");
    const r = publishDraft(entry, "Sam", "", "t");
    expect(r.published).toBe(false);
    expect(r.report.issues.some((i) => i.message.includes("Choose appropriate confirmation"))).toBe(true);
    expect(r.report.issues.some((i) => i.message.includes("Unknown activity"))).toBe(true);
    expect(r.entry.versions).toHaveLength(1);
  });

  it("unpublished entries are not learner-visible", () => {
    const catalog = seedCatalog();
    expect(isLearnerVisible({ ...catalog.entries[b.meta.id], status: "unpublished" })).toBe(false);
  });
});
