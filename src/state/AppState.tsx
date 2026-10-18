"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { canAccessActivity, canAccessConcept } from "@/domain/access";
import { isLearnerVisible, publishDraft, saveDraft, versionFor } from "@/domain/catalog";
import { submitAttempt } from "@/domain/evidence";
import { derivePathCompletion, deriveSkillProgress, type SkillProgress } from "@/domain/mastery";
import type { Activity, ActivityResponse, Attempt, CatalogEntry, ExploreConcept, LearnerRecord, PathBundle, PublishedVersion } from "@/domain/types";
import type { ValidationReport } from "@/domain/validation";
import { createLocalStorageRepository, type LoadStatus, type PrototypeRepository } from "@/persistence/repository";
import type { PrototypeState } from "@/persistence/state";
import { Spinner } from "@/components/ui";
import { reducer, type Action } from "./reducer";

interface AppContextValue {
  state: PrototypeState;
  learner: LearnerRecord;
  dispatch: (a: Action) => void;
  loadStatus: LoadStatus;
  dismissLoadStatus: () => void;
  submit: (input: { bundle: PathBundle; version: number; activity: Activity; response: ActivityResponse; hintsUsed: boolean; solutionRevealed: boolean }) => Attempt;
  publish: (pathId: string, note: string, bundle?: PathBundle) => { published: boolean; report: ValidationReport };
}

const AppContext = createContext<AppContextValue | null>(null);

function rootReducer(state: PrototypeState | null, action: Action): PrototypeState | null {
  if (action.type === "replace") return action.state;
  if (!state) return state;
  return reducer(state, action);
}

export function AppProvider({ children, repository }: { children: ReactNode; repository?: PrototypeRepository }) {
  const repo = useMemo(() => repository ?? createLocalStorageRepository(), [repository]);
  const [state, dispatch] = useReducer(rootReducer, null);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("fresh");
  const stateRef = useRef<PrototypeState | null>(null);
  stateRef.current = state;

  // Load only on the client, after hydration, so server and first client render match.
  useEffect(() => {
    const { state: loaded, status } = repo.load();
    dispatch({ type: "replace", state: loaded });
    setLoadStatus(status);
  }, [repo]);

  useEffect(() => {
    if (state) repo.save(state);
  }, [state, repo]);

  const learner = state?.learners[state.activeLearnerId];

  useEffect(() => {
    if (!learner) return;
    document.documentElement.dataset.reducedMotion = String(learner.preferences.reducedMotion);
  }, [learner]);

  const submit = useCallback<AppContextValue["submit"]>(({ bundle, version, activity, response, hintsUsed, solutionRevealed }) => {
    const s = stateRef.current!;
    const l = s.learners[s.activeLearnerId];
    const now = new Date().toISOString();
    const { attempt, newEvidence } = submitAttempt(l.attempts, {
      activity,
      skills: bundle.skills,
      response,
      contentVersion: version,
      hintsUsed,
      solutionRevealed,
      now,
      id: `att-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    });
    dispatch({ type: "enroll", pathId: bundle.meta.id, version, now });
    dispatch({ type: "recordAttempt", attempt, evidence: newEvidence });
    return attempt;
  }, []);

  const publish = useCallback<AppContextValue["publish"]>((pathId, note, bundle) => {
    const s = stateRef.current!;
    const now = new Date().toISOString();
    const entry = bundle ? saveDraft(s.catalog.entries[pathId], bundle, now) : s.catalog.entries[pathId];
    const by = s.learners[s.activeLearnerId].name;
    const r = publishDraft(entry, by, note, now);
    if (r.published) {
      const v = r.entry.versions[r.entry.versions.length - 1].version;
      dispatch({ type: "catalog/setEntry", entry: r.entry, event: `${pathId} v${v}` });
    } else if (bundle) {
      dispatch({ type: "catalog/setEntry", entry });
    }
    return { published: r.published, report: r.report };
  }, []);

  if (!state || !learner) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Loading prototype data…" />
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ state, learner, dispatch, loadStatus, dismissLoadStatus: () => setLoadStatus("restored"), submit, publish }}>{children}</AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

// ---------- Selectors ----------

export interface PathView {
  entry: CatalogEntry;
  version: PublishedVersion;
  bundle: PathBundle;
  latestVersion: number;
  enrolledVersion?: number;
  visible: boolean;
  canAccess: (activityId: string) => boolean;
  canAccessConcept: (c: ExploreConcept) => boolean;
  progress: Record<string, SkillProgress>;
  completion: ReturnType<typeof derivePathCompletion>;
  pathEvidence: LearnerRecord["evidence"];
  pathAttempts: Attempt[];
}

export function getPathView(state: PrototypeState, learner: LearnerRecord, pathId: string, override?: { bundle: PathBundle; version: number }): PathView | undefined {
  const entry = state.catalog.entries[pathId];
  if (!entry) return undefined;
  const enrollment = learner.enrollments[pathId];
  const version = override
    ? { version: override.version, publishedAt: "", publishedBy: "", note: "Draft preview", bundle: override.bundle }
    : versionFor(entry, enrollment);
  if (!version) return undefined;
  const bundle = version.bundle;
  const ids = new Set(bundle.activities.map((a) => a.id));
  const pathEvidence = learner.evidence.filter((e) => ids.has(e.activityId));
  const progress: Record<string, SkillProgress> = {};
  for (const s of bundle.skills) progress[s.id] = deriveSkillProgress(s.id, pathEvidence);
  return {
    entry,
    version,
    bundle,
    latestVersion: entry.versions[entry.versions.length - 1]?.version ?? 0,
    enrolledVersion: enrollment?.contentVersion,
    visible: isLearnerVisible(entry),
    canAccess: (id) => canAccessActivity(learner.access, bundle.meta, id),
    canAccessConcept: (c) => canAccessConcept(learner.access, c),
    progress,
    completion: derivePathCompletion(bundle, pathEvidence),
    pathEvidence,
    pathAttempts: learner.attempts.filter((a) => a.pathId === pathId),
  };
}

export function usePathView(pathId: string) {
  const { state, learner } = useApp();
  return useMemo(() => getPathView(state, learner, pathId), [state, learner, pathId]);
}

export function visibleLibrary(state: PrototypeState, learner: LearnerRecord): PathView[] {
  return state.catalog.order
    .map((id) => getPathView(state, learner, id))
    .filter((v): v is PathView => !!v && v.visible);
}
