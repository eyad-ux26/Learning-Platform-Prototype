import { seedLearner } from "@/content/seed";
import { addPeriod } from "@/domain/access";
import { clone, ensureDraft, saveDraft } from "@/domain/catalog";
import type { AccessState, CatalogEntry, Attempt, CatalogStatus, EvidenceItem, LearnerPreferences, PathBundle, Role, WorkDraft } from "@/domain/types";
import { createInitialState, type DemoEvent, type PrototypeState } from "@/persistence/state";

export type Action =
  | { type: "replace"; state: PrototypeState }
  | { type: "switchLearner"; learnerId: string }
  | { type: "resetLearner"; learnerId: string }
  | { type: "resetAll" }
  | { type: "saveWork"; draft: WorkDraft }
  | { type: "discardWork"; activityId: string }
  | { type: "recordAttempt"; attempt: Attempt; evidence: EvidenceItem[] }
  | { type: "enroll"; pathId: string; version: number; now: string }
  | { type: "reenroll"; pathId: string; version: number; now: string }
  | { type: "viewConcept"; conceptId: string; now: string }
  | { type: "setLocation"; href: string; label: string; now: string }
  | { type: "setAccess"; learnerId?: string; access: AccessState; event?: DemoEvent["type"] }
  | { type: "subscribe"; billing: "monthly" | "annual"; now: string }
  | { type: "cancelSubscription"; now: string }
  | { type: "resumeSubscription" }
  | { type: "setPreferences"; prefs: Partial<LearnerPreferences> }
  | { type: "setRole"; learnerId: string; role: Role }
  | { type: "setDirectoryOverride"; userId: string; role?: Role; plan?: AccessState["plan"] }
  | { type: "catalog/saveDraft"; pathId: string; bundle: PathBundle; now: string }
  | { type: "catalog/startDraft"; pathId: string; now: string }
  | { type: "catalog/discardDraft"; pathId: string }
  | { type: "catalog/setEntry"; entry: CatalogEntry; event?: string }
  | { type: "catalog/setStatus"; pathId: string; status: CatalogStatus }
  | { type: "catalog/create"; bundle: PathBundle; now: string }
  | { type: "catalog/reorder"; order: string[] }
  | { type: "event"; event: DemoEvent };

function updateLearner(state: PrototypeState, id: string, fn: (l: PrototypeState["learners"][string]) => PrototypeState["learners"][string]): PrototypeState {
  const l = state.learners[id];
  if (!l) return state;
  return { ...state, learners: { ...state.learners, [id]: fn(l) } };
}

const log = (state: PrototypeState, type: DemoEvent["type"], detail: string, now = new Date().toISOString()): PrototypeState => ({
  ...state,
  demoEvents: [...state.demoEvents.slice(-199), { at: now, learnerId: state.activeLearnerId, type, detail }],
});

export function reducer(state: PrototypeState, action: Action): PrototypeState {
  const me = state.activeLearnerId;
  switch (action.type) {
    case "replace":
      return action.state;
    case "switchLearner":
      return state.learners[action.learnerId] ? { ...state, activeLearnerId: action.learnerId } : state;
    case "resetLearner": {
      const current = state.learners[action.learnerId];
      if (!current) return state;
      return { ...state, learners: { ...state.learners, [action.learnerId]: seedLearner(current.scenarioId) } };
    }
    case "resetAll":
      return { ...createInitialState(), activeLearnerId: state.learners[me] ? me : "learner-maya" };
    case "saveWork":
      return updateLearner(state, me, (l) => ({ ...l, drafts: { ...l.drafts, [action.draft.activityId]: action.draft } }));
    case "discardWork":
      return updateLearner(state, me, (l) => {
        const drafts = { ...l.drafts };
        delete drafts[action.activityId];
        return { ...l, drafts };
      });
    case "recordAttempt": {
      const s = updateLearner(state, me, (l) => {
        const drafts = { ...l.drafts };
        delete drafts[action.attempt.activityId];
        return { ...l, attempts: [...l.attempts, action.attempt], evidence: [...l.evidence, ...action.evidence], drafts };
      });
      return log(s, "activity_submitted", `${action.attempt.activityId}${action.attempt.duplicateOf ? " (duplicate)" : ""}`, action.attempt.submittedAt);
    }
    case "enroll":
      return updateLearner(state, me, (l) =>
        l.enrollments[action.pathId] ? l : { ...l, enrollments: { ...l.enrollments, [action.pathId]: { pathId: action.pathId, contentVersion: action.version, startedAt: action.now } } },
      );
    case "reenroll":
      return updateLearner(state, me, (l) => ({ ...l, enrollments: { ...l.enrollments, [action.pathId]: { pathId: action.pathId, contentVersion: action.version, startedAt: action.now } } }));
    case "viewConcept": {
      if (state.learners[me]?.viewedConcepts[action.conceptId]) return state;
      const s = updateLearner(state, me, (l) => ({ ...l, viewedConcepts: { ...l.viewedConcepts, [action.conceptId]: action.now } }));
      return log(s, "concept_viewed", action.conceptId, action.now);
    }
    case "setLocation":
      return updateLearner(state, me, (l) => ({ ...l, lastLocation: { href: action.href, label: action.label, at: action.now } }));
    case "setAccess": {
      const s = updateLearner(state, action.learnerId ?? me, (l) => ({ ...l, access: action.access }));
      return action.event ? log(s, action.event, action.access.plan) : s;
    }
    case "subscribe": {
      const now = new Date(action.now);
      const s = updateLearner(state, me, (l) => ({
        ...l,
        access: { plan: "subscriber", billing: action.billing, since: action.now, periodEnd: addPeriod(now, action.billing).toISOString(), cancelAtPeriodEnd: false },
      }));
      return log(s, "upgrade_simulated", action.billing, action.now);
    }
    case "cancelSubscription": {
      const s = updateLearner(state, me, (l) => (l.access.plan === "subscriber" ? { ...l, access: { ...l.access, cancelAtPeriodEnd: true } } : l));
      return log(s, "cancel_simulated", "cancel at period end", action.now);
    }
    case "resumeSubscription":
      return updateLearner(state, me, (l) => (l.access.plan === "subscriber" ? { ...l, access: { ...l.access, cancelAtPeriodEnd: false } } : l));
    case "setPreferences":
      return updateLearner(state, me, (l) => ({ ...l, preferences: { ...l.preferences, ...action.prefs } }));
    case "setRole":
      return updateLearner(state, action.learnerId, (l) => ({ ...l, role: action.role }));
    case "setDirectoryOverride":
      return {
        ...state,
        directoryOverrides: { ...state.directoryOverrides, [action.userId]: { ...state.directoryOverrides[action.userId], ...(action.role && { role: action.role }), ...(action.plan && { plan: action.plan }) } },
      };
    case "catalog/startDraft": {
      const entry = state.catalog.entries[action.pathId];
      if (!entry) return state;
      return { ...state, catalog: { ...state.catalog, entries: { ...state.catalog.entries, [action.pathId]: ensureDraft(entry, action.now) } } };
    }
    case "catalog/saveDraft": {
      const entry = state.catalog.entries[action.pathId];
      if (!entry) return state;
      return { ...state, catalog: { ...state.catalog, entries: { ...state.catalog.entries, [action.pathId]: saveDraft(entry, action.bundle, action.now) } } };
    }
    case "catalog/discardDraft": {
      const entry = state.catalog.entries[action.pathId];
      if (!entry || entry.versions.length === 0) return state;
      return { ...state, catalog: { ...state.catalog, entries: { ...state.catalog.entries, [action.pathId]: { ...entry, draft: undefined, draftUpdatedAt: undefined } } } };
    }
    case "catalog/setEntry": {
      const s = { ...state, catalog: { ...state.catalog, entries: { ...state.catalog.entries, [action.entry.pathId]: action.entry } } };
      return action.event ? log(s, "content_published", action.event) : s;
    }
    case "catalog/setStatus": {
      const entry = state.catalog.entries[action.pathId];
      if (!entry) return state;
      if (action.status === "published" && entry.versions.length === 0) return state;
      return { ...state, catalog: { ...state.catalog, entries: { ...state.catalog.entries, [action.pathId]: { ...entry, status: action.status } } } };
    }
    case "catalog/create": {
      const id = action.bundle.meta.id;
      if (state.catalog.entries[id]) return state;
      return {
        ...state,
        catalog: {
          order: [...state.catalog.order, id],
          entries: { ...state.catalog.entries, [id]: { pathId: id, status: "draft", versions: [], draft: clone(action.bundle), draftUpdatedAt: action.now } },
        },
      };
    }
    case "catalog/reorder":
      return { ...state, catalog: { ...state.catalog, order: action.order } };
    case "event":
      return { ...state, demoEvents: [...state.demoEvents.slice(-199), action.event] };
  }
}
