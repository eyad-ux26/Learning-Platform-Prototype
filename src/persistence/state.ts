import { flagshipBundle } from "@/content/flagship";
import { libraryBundles } from "@/content/library";
import { scenarios, seedCatalog, seedLearner } from "@/content/seed";
import type { AccessState, CatalogEntry, LearnerRecord, PathId, Role } from "@/domain/types";

export const SCHEMA_VERSION = 1;

/** Changes whenever the seed content changes, so stale local content is replaced safely. */
export const SEED_FINGERPRINT = (() => {
  const s = JSON.stringify([flagshipBundle, libraryBundles]);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
})();

export interface DemoEvent {
  at: string;
  learnerId: string;
  type: "activity_submitted" | "concept_viewed" | "upgrade_simulated" | "cancel_simulated" | "content_published" | "sample_started";
  detail: string;
}

export interface PrototypeState {
  schemaVersion: typeof SCHEMA_VERSION;
  seedFingerprint: string;
  activeLearnerId: string;
  learners: Record<string, LearnerRecord>;
  catalog: { order: PathId[]; entries: Record<PathId, CatalogEntry> };
  directoryOverrides: Record<string, { role?: Role; plan?: AccessState["plan"] }>;
  demoEvents: DemoEvent[];
}

export function createInitialState(): PrototypeState {
  const learners: Record<string, LearnerRecord> = {};
  for (const s of scenarios) {
    const l = seedLearner(s.id);
    learners[l.id] = l;
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    seedFingerprint: SEED_FINGERPRINT,
    activeLearnerId: "learner-maya",
    learners,
    catalog: seedCatalog(),
    directoryOverrides: {},
    demoEvents: [],
  };
}

/** Lightweight shape check. Anything unexpected is treated as invalid local data. */
export function isValidState(v: unknown): v is PrototypeState {
  if (!v || typeof v !== "object") return false;
  const s = v as Partial<PrototypeState>;
  if (s.schemaVersion !== SCHEMA_VERSION) return false;
  if (typeof s.activeLearnerId !== "string" || !s.learners || typeof s.learners !== "object") return false;
  if (!s.learners[s.activeLearnerId]) return false;
  if (!s.catalog || !Array.isArray(s.catalog.order) || typeof s.catalog.entries !== "object") return false;
  for (const l of Object.values(s.learners)) {
    if (!l || typeof l !== "object" || !Array.isArray(l.attempts) || !Array.isArray(l.evidence) || typeof l.drafts !== "object" || !l.access) return false;
  }
  for (const id of s.catalog.order) {
    const e = s.catalog.entries[id];
    if (!e || !Array.isArray(e.versions)) return false;
  }
  return Array.isArray(s.demoEvents) && typeof s.directoryOverrides === "object";
}
