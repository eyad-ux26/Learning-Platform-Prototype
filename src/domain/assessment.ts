/**
 * Responsibility 1: evaluate a single activity response.
 * Pure and deterministic. No storage, no React.
 */
import type {
  Activity,
  ActivityResponse,
  CriterionId,
  CriterionResult,
  CritiqueActivity,
  CritiqueDetail,
  DecisionActivity,
  DesignBenchActivity,
  Evaluation,
  Skill,
  SkillResult,
} from "./types";

export interface Completeness {
  complete: boolean;
  missing: string[];
}

export function emptyResponse(activity: Activity): ActivityResponse {
  switch (activity.template) {
    case "design-bench":
      return { template: "design-bench", selections: {} };
    case "critique":
      return { template: "critique", reviews: {} };
    case "decision":
      return { template: "decision", choices: [] };
  }
}

export function criterionSkillMap(skills: Skill[]): Map<CriterionId, string> {
  const map = new Map<CriterionId, string>();
  for (const s of skills) for (const c of s.criteria) map.set(c.id, s.id);
  return map;
}

export function skillsAssessedBy(activity: Activity, skills: Skill[]): string[] {
  const map = criterionSkillMap(skills);
  const out: string[] = [];
  for (const c of activity.criteria) {
    const s = map.get(c);
    if (s && !out.includes(s)) out.push(s);
  }
  return out;
}

export function checkCompleteness(activity: Activity, response: ActivityResponse): Completeness {
  const missing: string[] = [];
  if (activity.template === "design-bench" && response.template === "design-bench") {
    for (const d of activity.decisions) {
      if (!response.selections[d.id]) missing.push(d.prompt);
    }
  } else if (activity.template === "critique" && response.template === "critique") {
    for (const h of activity.hotspots) {
      const r = response.reviews[h.id];
      if (!r?.verdict) missing.push(`Judge “${h.label}”`);
      else if (!r.reason) missing.push(`Choose a reason for “${h.label}”`);
    }
  } else if (activity.template === "decision" && response.template === "decision") {
    const path = walkDecision(activity, response);
    if (!path.finished) missing.push(path.nextPrompt ?? "Complete the scenario");
  } else {
    missing.push("Response does not match this activity type");
  }
  return { complete: missing.length === 0, missing };
}

export function evaluate(activity: Activity, response: ActivityResponse, skills: Skill[]): Evaluation {
  const map = criterionSkillMap(skills);
  let criteria: CriterionResult[];
  let detail: Evaluation["detail"];

  if (activity.template === "design-bench" && response.template === "design-bench") {
    criteria = evaluateDesignBench(activity, response.selections, map);
  } else if (activity.template === "critique" && response.template === "critique") {
    const r = evaluateCritique(activity, response.reviews, map);
    criteria = r.criteria;
    detail = r.detail;
  } else if (activity.template === "decision" && response.template === "decision") {
    const r = evaluateDecision(activity, response, map);
    criteria = r.criteria;
    detail = r.detail;
  } else {
    throw new Error(`Response template ${response.template} does not match activity ${activity.id}`);
  }

  const skillsOut: SkillResult[] = [];
  for (const c of criteria) {
    let s = skillsOut.find((x) => x.skillId === c.skillId);
    if (!s) {
      s = { skillId: c.skillId, met: true, criteria: [] };
      skillsOut.push(s);
    }
    s.criteria.push(c.criterionId);
    s.met = s.met && c.met;
  }
  return { activityId: activity.id, criteria, skills: skillsOut, detail };
}

// ---------- Design Bench ----------

function evaluateDesignBench(
  activity: DesignBenchActivity,
  selections: Record<string, string>,
  map: Map<CriterionId, string>,
): CriterionResult[] {
  return activity.rules.map((rule) => {
    const met = rule.passWhen.some((group) => group.every((cond) => cond.oneOf.includes(selections[cond.decision])));
    const evidence: string[] = [];
    const consequences: string[] = [];
    for (const decisionId of rule.evidenceFrom) {
      const decision = activity.decisions.find((d) => d.id === decisionId);
      const option = decision?.options.find((o) => o.id === selections[decisionId]);
      if (decision && option) {
        evidence.push(`${decision.prompt} → ${option.label}`);
        consequences.push(option.consequence);
      }
    }
    return {
      criterionId: rule.criterionId,
      skillId: map.get(rule.criterionId) ?? "unknown",
      met,
      evidence,
      feedback: met ? rule.pass : rule.fail,
      consequence: consequences.join(" "),
    };
  });
}

// ---------- Critique ----------

function evaluateCritique(
  activity: CritiqueActivity,
  reviews: Record<string, { verdict?: string; reason?: string }>,
  map: Map<CriterionId, string>,
): { criteria: CriterionResult[]; detail: CritiqueDetail } {
  const detail: CritiqueDetail = {
    kind: "critique",
    correctlyIdentified: [],
    missed: [],
    wronglyFlagged: [],
    wrongReason: [],
    correctlyAccepted: [],
  };
  const hotspotOk = new Map<string, boolean>();
  const reasonLabel = (id?: string) => activity.reasons.find((r) => r.id === id)?.label ?? "no reason";

  for (const h of activity.hotspots) {
    const r = reviews[h.id];
    const verdictOk = r?.verdict === h.verdict;
    const reasonOk = verdictOk && !!r?.reason && h.correctReasons.includes(r.reason);
    hotspotOk.set(h.id, reasonOk);
    if (h.verdict === "problematic") {
      if (!verdictOk) detail.missed.push(h.id);
      else if (!reasonOk) detail.wrongReason.push(h.id);
      else detail.correctlyIdentified.push(h.id);
    } else {
      if (!verdictOk) detail.wronglyFlagged.push(h.id);
      else if (!reasonOk) detail.wrongReason.push(h.id);
      else detail.correctlyAccepted.push(h.id);
    }
  }

  const criteria: CriterionResult[] = activity.criteria.map((criterionId) => {
    const spots = activity.hotspots.filter((h) => h.criterionId === criterionId);
    const met = spots.length > 0 && spots.every((h) => hotspotOk.get(h.id));
    const evidence = spots.map((h) => {
      const r = reviews[h.id];
      const judged = r?.verdict ? `${r.verdict} — ${reasonLabel(r.reason)}` : "not reviewed";
      const mark = hotspotOk.get(h.id) ? "✓" : "✗";
      return `${mark} “${h.label}”: you judged ${judged}`;
    });
    const wrong = spots.filter((h) => !hotspotOk.get(h.id));
    const feedback = met
      ? `You judged every element linked to this criterion correctly, with a fitting reason.`
      : wrong
          .map((h) =>
            h.verdict === "problematic"
              ? `“${h.label}” is problematic: ${h.explanation}`
              : `“${h.label}” is acceptable: ${h.explanation}`,
          )
          .join(" ");
    return {
      criterionId,
      skillId: map.get(criterionId) ?? "unknown",
      met,
      evidence,
      feedback,
      consequence: wrong.map((h) => h.improvement).join(" "),
    };
  });
  return { criteria, detail };
}

// ---------- Decision Scenario ----------

export function walkDecision(activity: DecisionActivity, response: { choices: { nodeId: string; choiceId: string }[] }) {
  let nodeId: string | undefined = activity.start;
  const steps: { nodeId: string; choiceId: string; consequence: string; signals: DecisionActivity["nodes"][number]["choices"][number]["signals"] }[] = [];
  let i = 0;
  while (nodeId) {
    const node = activity.nodes.find((n) => n.id === nodeId);
    if (!node) break;
    const picked = response.choices[i];
    if (!picked || picked.nodeId !== node.id) {
      return { finished: false, steps, currentNodeId: node.id, nextPrompt: `${node.title}: ${node.prompt}` };
    }
    const choice = node.choices.find((c) => c.id === picked.choiceId);
    if (!choice) return { finished: false, steps, currentNodeId: node.id, nextPrompt: `${node.title}: ${node.prompt}` };
    steps.push({ nodeId: node.id, choiceId: choice.id, consequence: choice.consequence, signals: choice.signals });
    nodeId = choice.next;
    i++;
  }
  return { finished: true, steps, currentNodeId: undefined as string | undefined, nextPrompt: undefined as string | undefined };
}

function evaluateDecision(
  activity: DecisionActivity,
  response: { choices: { nodeId: string; choiceId: string }[] },
  map: Map<CriterionId, string>,
): { criteria: CriterionResult[]; detail: Evaluation["detail"] } {
  const walk = walkDecision(activity, response);
  const criteria: CriterionResult[] = activity.criteria.map((criterionId) => {
    const signals = walk.steps.flatMap((s) => {
      const node = activity.nodes.find((n) => n.id === s.nodeId)!;
      const choice = node.choices.find((c) => c.id === s.choiceId)!;
      return s.signals.filter((g) => g.criterionId === criterionId).map((g) => ({ ...g, node, choice }));
    });
    const met = signals.length > 0 && signals.every((g) => g.met);
    return {
      criterionId,
      skillId: map.get(criterionId) ?? "unknown",
      met,
      evidence: signals.map((g) => `${g.met ? "✓" : "✗"} ${g.node.title} → ${g.choice.label}`),
      feedback:
        signals.length === 0
          ? "Your route through the scenario did not reach a decision that tests this criterion."
          : signals.map((g) => g.because).join(" "),
      consequence: signals.filter((g) => !g.met).map((g) => g.choice.consequence).join(" "),
    };
  });
  return {
    criteria,
    detail: { kind: "decision", steps: walk.steps.map(({ nodeId, choiceId, consequence }) => ({ nodeId, choiceId, consequence })) },
  };
}

// ---------- Response identity ----------

/** Stable serialisation so identical responses produce the same hash. Notes are excluded: they are not assessed. */
export function responseHash(response: ActivityResponse): string {
  let canonical: unknown;
  if (response.template === "critique") {
    const reviews: Record<string, unknown> = {};
    for (const k of Object.keys(response.reviews).sort()) {
      const r = response.reviews[k];
      reviews[k] = { verdict: r.verdict ?? null, reason: r.reason ?? null };
    }
    canonical = { t: "critique", reviews };
  } else if (response.template === "design-bench") {
    const sel: Record<string, string> = {};
    for (const k of Object.keys(response.selections).sort()) sel[k] = response.selections[k];
    canonical = { t: "design-bench", sel };
  } else {
    canonical = { t: "decision", choices: response.choices.map((c) => `${c.nodeId}:${c.choiceId}`) };
  }
  const s = JSON.stringify(canonical);
  // Small deterministic string hash (FNV-1a). Not for security.
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
