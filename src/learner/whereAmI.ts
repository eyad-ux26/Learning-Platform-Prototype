import { FLAGSHIP_ID } from "@/content/flagship";
import { recommendNext, type Recommendation } from "@/domain/recommend";
import type { Activity, LearnerRecord } from "@/domain/types";
import type { PathView } from "@/state/AppState";

/** Where an activity stands for the learner, from their own drafts and attempts (never a stored flag). */
export type ActivityState = "todo" | "progress" | "reopened" | "shipped";

export function activityState(view: PathView, learner: LearnerRecord, a: Activity): ActivityState {
  if (learner.drafts[a.id]) return "progress";
  const attempts = view.pathAttempts.filter((x) => x.activityId === a.id);
  if (!attempts.length) return "todo";
  return attempts[attempts.length - 1].evaluation.skills.every((s) => s.met) ? "shipped" : "reopened";
}

const pathOfHref = (href?: string) => href?.match(/^\/paths\/([^/]+)/)?.[1];

/**
 * The path the learner is on: the one they were last in, else the one they last submitted in,
 * else the recommended first path. With many paths this keeps Home and the Board pointing at the same place.
 */
export function currentPath(library: PathView[], learner: LearnerRecord): PathView | undefined {
  const byId = (id?: string) => (id ? library.find((v) => v.bundle.meta.id === id) : undefined);
  const lastAttempt = [...learner.attempts].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
  return byId(pathOfHref(learner.lastLocation?.href)) ?? byId(lastAttempt?.pathId) ?? byId(FLAGSHIP_ID) ?? library[0];
}

export interface NextStep {
  /** The activity to do next, if any. */
  activity?: Activity;
  /** True when it has an unfinished response saved. */
  resume: boolean;
  rec?: Recommendation;
  href: string;
}

/** The one next thing to do in a path: an unfinished response, else the recommended activity, else the first free sample. */
export function nextStep(view: PathView, learner: LearnerRecord): NextStep {
  const { bundle } = view;
  const base = `/paths/${bundle.meta.id}`;
  const lastId = learner.lastLocation?.href.split("/").pop();
  const draft = bundle.activities.find((a) => a.id === lastId && learner.drafts[a.id]) ?? bundle.activities.find((a) => learner.drafts[a.id]);
  if (draft) return { activity: draft, resume: true, href: `${base}/practice/${draft.id}` };
  const preview = bundle.meta.availability === "preview";
  const rec = preview ? undefined : recommendNext({ bundle: view.rawBundle, evidence: view.pathEvidence, attempts: view.pathAttempts, canAccess: view.canAccess });
  const recActivity = rec?.type === "activity" ? bundle.activities.find((a) => a.id === rec.activityId) : undefined;
  const sample = bundle.activities.find((a) => bundle.meta.freeSampleActivityIds.includes(a.id));
  const activity = recActivity ?? (rec?.type === "complete" ? undefined : sample);
  if (activity) return { activity, resume: false, rec, href: `${base}/practice/${activity.id}` };
  return { resume: false, rec, href: rec?.type === "complete" ? `${base}/certificate` : base };
}
