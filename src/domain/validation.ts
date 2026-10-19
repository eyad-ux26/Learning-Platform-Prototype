/**
 * Content validation used by publishing and by the JSON import.
 * Structural checks first, then references, then skill coverage.
 */
import { skillsAssessedBy } from "./assessment";
import { CONTENT_FORMAT_VERSION, type Activity, type Block, type PathBundle } from "./types";

export interface Issue {
  level: "error" | "warning";
  path: string;
  message: string;
}

export interface ValidationReport {
  ok: boolean;
  issues: Issue[];
  coverage: SkillCoverage[];
}

export interface SkillCoverage {
  skillId: string;
  skillName: string;
  contexts: string[];
  activities: string[];
  uncoveredCriteria: string[];
  sufficient: boolean;
}

/** Minimum distinct contexts a required skill needs before a full path can be published. */
export const MIN_CONTEXTS_PER_SKILL = 2;

const isStr = (v: unknown) => typeof v === "string" && v.trim().length > 0;
const isArr = Array.isArray;

export function validateStructure(input: unknown): Issue[] {
  const issues: Issue[] = [];
  const err = (path: string, message: string) => issues.push({ level: "error", path, message });
  if (typeof input !== "object" || input === null) {
    err("$", "Expected a JSON object.");
    return issues;
  }
  const b = input as Record<string, unknown>;
  if (b.formatVersion !== CONTENT_FORMAT_VERSION) err("formatVersion", `Expected formatVersion ${CONTENT_FORMAT_VERSION}.`);
  const meta = b.meta as Record<string, unknown> | undefined;
  if (!meta || typeof meta !== "object") err("meta", "Missing path metadata.");
  else {
    for (const k of ["id", "title", "summary", "topic", "level", "audience", "prerequisites", "availability", "icon", "cover"]) {
      if (!isStr(meta[k])) err(`meta.${k}`, "Required text value is missing.");
    }
    if (meta.id && !/^[a-z0-9-]+$/.test(String(meta.id))) err("meta.id", "Use lowercase letters, numbers and hyphens.");
    if (!["Introductory", "Intermediate", "Advanced"].includes(String(meta.level))) err("meta.level", "Level must be Introductory, Intermediate or Advanced.");
    if (!["full", "preview"].includes(String(meta.availability))) err("meta.availability", "Availability must be 'full' or 'preview'.");
    if (typeof meta.estimatedHours !== "number" || meta.estimatedHours <= 0) err("meta.estimatedHours", "Provide a positive estimated duration in hours.");
    if (!isArr(meta.outcomes) || meta.outcomes.length === 0) err("meta.outcomes", "Provide at least one learning outcome.");
    if (!isArr(meta.freeSampleActivityIds)) err("meta.freeSampleActivityIds", "Provide a list (it may be empty).");
  }
  if (!isArr(b.skills)) err("skills", "Expected a list of skills.");
  else
    b.skills.forEach((s: Record<string, unknown>, i: number) => {
      if (!isStr(s?.id)) err(`skills[${i}].id`, "Missing id.");
      if (!isStr(s?.name)) err(`skills[${i}].name`, "Missing name.");
      if (!isArr(s?.criteria)) err(`skills[${i}].criteria`, "Expected a list of criteria.");
      else
        (s.criteria as Record<string, unknown>[]).forEach((c, j) => {
          if (!isStr(c?.id) || !isStr(c?.statement)) err(`skills[${i}].criteria[${j}]`, "Criterion needs id and statement.");
          if (c?.skillId !== s.id) err(`skills[${i}].criteria[${j}].skillId`, "Criterion skillId must match its skill.");
        });
    });
  if (!isArr(b.requiredSkillIds)) err("requiredSkillIds", "Expected a list of skill ids.");
  if (!isArr(b.explore)) err("explore", "Expected a list of Explore concepts.");
  if (!isArr(b.activities)) err("activities", "Expected a list of activities.");
  else
    b.activities.forEach((a: Record<string, unknown>, i: number) => {
      const p = `activities[${i}]`;
      for (const k of ["id", "title", "contextKey", "contextLabel", "scenario", "task", "solution"]) if (!isStr(a?.[k])) err(`${p}.${k}`, "Required text value is missing.");
      if (!["design-bench", "critique", "decision"].includes(String(a?.template))) err(`${p}.template`, "Unknown activity template.");
      if (!isArr(a?.criteria) || a.criteria.length === 0) err(`${p}.criteria`, "An activity must assess at least one criterion.");
      if (a?.template === "design-bench") {
        if (!isArr(a.decisions) || !isArr(a.rules) || typeof a.preview !== "object") err(p, "Design Bench needs preview, decisions and rules.");
      }
      if (a?.template === "critique") {
        if (!isArr(a.hotspots) || !isArr(a.reasons) || typeof a.screen !== "object") err(p, "Critique needs screen, hotspots and reasons.");
      }
      if (a?.template === "decision") {
        if (!isArr(a.nodes) || !isStr(a.start) || typeof a.debrief !== "object") err(p, "Decision Scenario needs start, nodes and debrief.");
      }
    });
  return issues;
}

export function validateReferences(bundle: PathBundle): Issue[] {
  const issues: Issue[] = [];
  const err = (path: string, message: string) => issues.push({ level: "error", path, message });
  const skillIds = new Set(bundle.skills.map((s) => s.id));
  const criterionIds = new Set(bundle.skills.flatMap((s) => s.criteria.map((c) => c.id)));
  const activityIds = new Set<string>();
  const conceptIds = new Set(bundle.explore.map((c) => c.id));

  bundle.activities.forEach((a, i) => {
    if (activityIds.has(a.id)) err(`activities[${i}].id`, `Duplicate activity id “${a.id}”.`);
    activityIds.add(a.id);
    if (a.pathId !== bundle.meta.id) err(`activities[${i}].pathId`, `Activity belongs to “${a.pathId}”, not this path.`);
    a.criteria.forEach((c) => {
      if (!criterionIds.has(c)) err(`activities[${i}].criteria`, `Unknown criterion “${c}”.`);
    });
    a.relatedConcepts.forEach((c) => {
      if (!conceptIds.has(c)) err(`activities[${i}].relatedConcepts`, `Unknown Explore concept “${c}”.`);
    });
    issues.push(...templateReferences(a, `activities[${i}]`));
  });
  bundle.activities.forEach((a, i) => {
    if (a.alternativeFor && !activityIds.has(a.alternativeFor)) err(`activities[${i}].alternativeFor`, `Unknown baseline activity “${a.alternativeFor}”.`);
  });
  bundle.requiredSkillIds.forEach((s) => {
    if (!skillIds.has(s)) err("requiredSkillIds", `Unknown skill “${s}”.`);
  });
  bundle.meta.freeSampleActivityIds.forEach((id) => {
    if (!activityIds.has(id)) err("meta.freeSampleActivityIds", `Free sample references missing activity “${id}”.`);
  });
  bundle.explore.forEach((c, i) => {
    if (c.skillId && !skillIds.has(c.skillId)) err(`explore[${i}].skillId`, `Unknown skill “${c.skillId}”.`);
    c.practiceActivityIds.forEach((id) => {
      if (!activityIds.has(id)) err(`explore[${i}].practiceActivityIds`, `Unknown activity “${id}”.`);
    });
  });
  return issues;
}

/** Every hotspot id used by a screen's blocks, including list items, table rows and nested blocks. */
function screenHotspotIds(blocks: Block[]): Set<string> {
  const ids = new Set<string>();
  const visit = (b: Block) => {
    if (b.hotspot) ids.add(b.hotspot);
    if (b.type === "list") b.items.forEach((i) => i.hotspot && ids.add(i.hotspot));
    if (b.type === "table") b.rowHotspots?.forEach((h) => h && ids.add(h));
    if (b.type === "dialog" || b.type === "group") b.blocks.forEach(visit);
  };
  blocks.forEach(visit);
  return ids;
}

function templateReferences(a: Activity, p: string): Issue[] {
  const issues: Issue[] = [];
  const err = (path: string, message: string) => issues.push({ level: "error", path, message });
  if (a.template === "design-bench") {
    const decisionIds = new Set(a.decisions.map((d) => d.id));
    a.rules.forEach((r, j) => {
      if (!a.criteria.includes(r.criterionId)) err(`${p}.rules[${j}]`, `Rule criterion “${r.criterionId}” is not listed in the activity criteria.`);
      r.passWhen.flat().forEach((c) => {
        const d = a.decisions.find((x) => x.id === c.decision);
        if (!d) err(`${p}.rules[${j}]`, `Unknown decision “${c.decision}”.`);
        else c.oneOf.forEach((o) => !d.options.some((x) => x.id === o) && err(`${p}.rules[${j}]`, `Unknown option “${o}” for “${d.id}”.`));
      });
      r.evidenceFrom.forEach((d) => !decisionIds.has(d) && err(`${p}.rules[${j}].evidenceFrom`, `Unknown decision “${d}”.`));
    });
    a.criteria.forEach((c) => !a.rules.some((r) => r.criterionId === c) && err(`${p}.rules`, `No rule evaluates criterion “${c}”.`));
  }
  if (a.template === "critique") {
    const reasonIds = new Set(a.reasons.map((r) => r.id));
    a.hotspots.forEach((h, j) => {
      if (!a.criteria.includes(h.criterionId)) err(`${p}.hotspots[${j}]`, `Hotspot criterion “${h.criterionId}” is not listed in the activity criteria.`);
      h.correctReasons.forEach((r) => !reasonIds.has(r) && err(`${p}.hotspots[${j}]`, `Unknown reason “${r}”.`));
    });
    a.criteria.forEach((c) => {
      const spots = a.hotspots.filter((h) => h.criterionId === c);
      if (spots.length === 0) err(`${p}.hotspots`, `No hotspot evaluates criterion “${c}”.`);
      else if (!spots.some((h) => h.verdict === "acceptable"))
        issues.push({ level: "warning", path: `${p}.hotspots`, message: `Criterion “${c}” has no acceptable element, so flagging everything would pass it.` });
    });
  }
  if (a.template === "decision") {
    const nodeIds = new Set(a.nodes.map((n) => n.id));
    if (!nodeIds.has(a.start)) err(`${p}.start`, `Start node “${a.start}” does not exist.`);
    a.nodes.forEach((n, j) =>
      n.choices.forEach((c) => {
        if (c.next && !nodeIds.has(c.next)) err(`${p}.nodes[${j}]`, `Choice “${c.id}” points to missing node “${c.next}”.`);
        c.signals.forEach((s) => !a.criteria.includes(s.criterionId) && err(`${p}.nodes[${j}]`, `Signal criterion “${s.criterionId}” is not listed in the activity criteria.`));
        const spots = screenHotspotIds(n.screen?.blocks ?? []);
        c.affects?.forEach((x) => !spots.has(x.hotspot) && err(`${p}.nodes[${j}]`, `Choice “${c.id}” highlights hotspot “${x.hotspot}”, which is not on the screen of node “${n.id}”.`));
      }),
    );
    if (a.nodes.length < 2) issues.push({ level: "warning", path: p, message: "A Decision Scenario should include at least one follow-up decision." });
  }
  return issues;
}

export function computeCoverage(bundle: PathBundle): SkillCoverage[] {
  return bundle.skills.map((skill) => {
    const acts = bundle.activities.filter((a) => skillsAssessedBy(a, bundle.skills).includes(skill.id));
    const contexts = [...new Set(acts.map((a) => a.contextKey))];
    const uncoveredCriteria = skill.criteria.filter((c) => !acts.some((a) => a.criteria.includes(c.id))).map((c) => c.id);
    return {
      skillId: skill.id,
      skillName: skill.name,
      contexts,
      activities: acts.map((a) => a.id),
      uncoveredCriteria,
      sufficient: contexts.length >= MIN_CONTEXTS_PER_SKILL && uncoveredCriteria.length === 0,
    };
  });
}

export function validateBundle(bundle: unknown): ValidationReport {
  const structural = validateStructure(bundle);
  if (structural.some((i) => i.level === "error")) return { ok: false, issues: structural, coverage: [] };
  const b = bundle as PathBundle;
  const issues = [...structural, ...validateReferences(b)];
  const coverage = computeCoverage(b);
  if (b.meta.availability === "full") {
    if (b.skills.length === 0) issues.push({ level: "error", path: "skills", message: "A full path needs at least one required skill." });
    for (const c of coverage) {
      if (!b.requiredSkillIds.includes(c.skillId)) continue;
      if (c.contexts.length < MIN_CONTEXTS_PER_SKILL)
        issues.push({ level: "error", path: `coverage.${c.skillId}`, message: `“${c.skillName}” has ${c.contexts.length} distinct challenge ${c.contexts.length === 1 ? "context" : "contexts"}; at least ${MIN_CONTEXTS_PER_SKILL} are required.` });
      if (c.uncoveredCriteria.length)
        issues.push({ level: "error", path: `coverage.${c.skillId}`, message: `“${c.skillName}” has criteria no activity assesses: ${c.uncoveredCriteria.join(", ")}.` });
    }
  }
  return { ok: !issues.some((i) => i.level === "error"), issues, coverage };
}
