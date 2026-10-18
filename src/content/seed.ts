/**
 * Seeded demonstration scenarios. Progress is produced by running canned
 * responses through the real assessment engine, so seeded evidence follows
 * exactly the same rules as live attempts. All people are fictional.
 */
import { submitAttempt } from "@/domain/evidence";
import type { ActivityResponse, CatalogEntry, LearnerRecord, PathBundle, Role, AccessState } from "@/domain/types";
import { flagshipBundle, FLAGSHIP_ID } from "./flagship";
import { libraryBundles } from "./library";

export const SEED_PUBLISHED_AT = "2026-02-02T09:00:00.000Z";

export interface ScenarioInfo {
  id: string;
  label: string;
  description: string;
}

export const scenarios: ScenarioInfo[] = [
  { id: "new-free", label: "New free learner", description: "No progress. Free samples only." },
  { id: "returning", label: "Returning subscriber", description: "One activity complete, another half-finished." },
  { id: "skill-gap", label: "Learner with a skill gap", description: "Strong on uncertainty and evidence; missed a commitment criterion." },
  { id: "near-complete", label: "Close to path completion", description: "Three skills Mastered; commitment needs one more context." },
  { id: "editor", label: "Editor", description: "Content editor role. Can edit and preview, not publish." },
  { id: "admin", label: "Administrator", description: "Full admin workspace, including publishing and access." },
  { id: "expired", label: "Subscription expired", description: "Has progress; subscription ended." },
];

const prefs = { explanationsFirst: false, reducedMotion: false, weeklyGoalMinutes: 60, captions: true };

function base(id: string, scenarioId: string, name: string, email: string, title: string, role: Role, access: AccessState): LearnerRecord {
  return { id, scenarioId, name, email, title, role, access, preferences: { ...prefs }, enrollments: {}, attempts: [], evidence: [], drafts: {}, viewedConcepts: {} };
}

const perfect = {
  deadline: { template: "design-bench", selections: { presentation: "ghost", uncertainty: "specific", evidence: "source", correction: "alts", commitment: "accept", recovery: "both" } },
  deadlineDialog: { template: "design-bench", selections: { presentation: "ghost", uncertainty: "specific", evidence: "source", correction: "alts", commitment: "dialog", recovery: "both" } },
  summary: { template: "design-bench", selections: { presentation: "block", uncertainty: "specific", evidence: "source", explanation: "reason", correction: "alts" } },
  bookingWeak: { template: "design-bench", selections: { commitment: "accept", explanation: "generic", recovery: "undo" } },
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
  calendar: { template: "decision", choices: [{ nodeId: "c1", choiceId: "split" }, { nodeId: "c2", choiceId: "restore" }, { nodeId: "c3", choiceId: "review" }] },
} satisfies Record<string, ActivityResponse>;

let seq = 0;
function record(learner: LearnerRecord, bundle: PathBundle, activityId: string, response: ActivityResponse, at: string, opts: { hints?: boolean } = {}) {
  const activity = bundle.activities.find((a) => a.id === activityId)!;
  const { attempt, newEvidence } = submitAttempt(learner.attempts, {
    activity,
    skills: bundle.skills,
    response,
    contentVersion: 1,
    hintsUsed: !!opts.hints,
    solutionRevealed: false,
    now: at,
    id: `seed-${learner.id}-${++seq}`,
  });
  learner.attempts.push(attempt);
  learner.evidence.push(...newEvidence);
  learner.enrollments[bundle.meta.id] ??= { pathId: bundle.meta.id, contentVersion: 1, startedAt: at };
}

const subscriber = (since: string, billing: "monthly" | "annual" = "monthly"): AccessState => {
  const end = new Date(since);
  if (billing === "monthly") end.setMonth(end.getMonth() + 1);
  else end.setFullYear(end.getFullYear() + 1);
  // Keep seeded subscriptions active relative to the reviewer's real date.
  while (end.getTime() < Date.now()) end.setMonth(end.getMonth() + 1);
  return { plan: "subscriber", billing, since, periodEnd: end.toISOString(), cancelAtPeriodEnd: false };
};

export function seedLearner(scenarioId: string): LearnerRecord {
  const b = flagshipBundle;
  switch (scenarioId) {
    case "new-free":
      return base("learner-maya", "new-free", "Maya Okafor", "maya.okafor@example.test", "Product designer", "learner", { plan: "free" });
    case "returning": {
      const l = base("learner-daniel", "returning", "Daniel Reyes", "daniel.reyes@example.test", "Senior UX designer", "learner", subscriber("2026-01-12T10:00:00.000Z"));
      record(l, b, "bench-deadline", perfect.deadline, "2026-03-02T18:20:00.000Z");
      l.viewedConcepts = { "why-calibrated-trust": "2026-03-02T18:00:00.000Z", "communicating-uncertainty": "2026-03-02T18:05:00.000Z" };
      l.drafts["bench-summary"] = {
        activityId: "bench-summary",
        contentVersion: 1,
        response: { template: "design-bench", selections: { presentation: "block", uncertainty: "specific", evidence: "source" } },
        ui: { previewSourceOpen: true },
        hintsUsed: false,
        solutionRevealed: false,
        updatedAt: "2026-03-03T19:42:00.000Z",
      };
      l.lastLocation = { href: `/paths/${FLAGSHIP_ID}/practice/bench-summary`, label: "A summary at the top of a policy", at: "2026-03-03T19:42:00.000Z" };
      return l;
    }
    case "skill-gap": {
      const l = base("learner-priya", "skill-gap", "Priya Natarajan", "priya.n@example.test", "Product manager", "learner", subscriber("2026-02-01T10:00:00.000Z", "annual"));
      record(l, b, "critique-recap", perfect.recap, "2026-03-01T09:10:00.000Z");
      record(l, b, "bench-deadline", perfect.deadlineDialog, "2026-03-01T09:40:00.000Z");
      l.viewedConcepts = { "why-calibrated-trust": "2026-03-01T09:00:00.000Z" };
      return l;
    }
    case "near-complete": {
      const l = base("learner-tomas", "near-complete", "Tomás Lindqvist", "tomas.l@example.test", "Design lead", "learner", subscriber("2025-11-20T10:00:00.000Z", "annual"));
      record(l, b, "bench-deadline", perfect.deadlineDialog, "2026-02-20T10:00:00.000Z");
      record(l, b, "critique-recap", perfect.recap, "2026-02-21T10:00:00.000Z");
      record(l, b, "bench-summary", perfect.summary, "2026-02-23T10:00:00.000Z", { hints: true });
      record(l, b, "scenario-calendar", perfect.calendar, "2026-02-25T10:00:00.000Z");
      l.viewedConcepts = Object.fromEntries(b.explore.map((c) => [c.id, "2026-02-19T10:00:00.000Z"]));
      return l;
    }
    case "editor": {
      const l = base("staff-lena", "editor", "Lena Hoffmann", "lena.h@example.test", "Learning content editor", "editor", subscriber("2025-09-01T10:00:00.000Z", "annual"));
      return l;
    }
    case "admin": {
      const l = base("staff-sam", "admin", "Sam Adeyemi", "sam.a@example.test", "Platform administrator", "admin", subscriber("2025-09-01T10:00:00.000Z", "annual"));
      return l;
    }
    case "expired": {
      const l = base("learner-noor", "expired", "Noor Haddad", "noor.h@example.test", "Interaction designer", "learner", { plan: "expired", endedAt: "2026-02-28T23:59:00.000Z" });
      record(l, b, "bench-deadline", perfect.deadline, "2026-01-15T12:00:00.000Z");
      record(l, b, "bench-booking", perfect.bookingWeak, "2026-01-18T12:00:00.000Z");
      return l;
    }
  }
  throw new Error(`Unknown scenario ${scenarioId}`);
}

export function seedCatalog(): { order: string[]; entries: Record<string, CatalogEntry> } {
  const all = [flagshipBundle, ...libraryBundles];
  const entries: Record<string, CatalogEntry> = {};
  for (const bundle of all) {
    entries[bundle.meta.id] = {
      pathId: bundle.meta.id,
      status: "published",
      versions: [{ version: 1, publishedAt: SEED_PUBLISHED_AT, publishedBy: "Seed content", note: "Initial prototype content", bundle: JSON.parse(JSON.stringify(bundle)) }],
    };
  }
  return { order: all.map((b) => b.meta.id), entries };
}
