"use client";

import { useMemo } from "react";
import { hasUnpublishedChanges, latestPublished } from "@/domain/catalog";
import { getPathView, useApp, type PathView } from "@/state/AppState";
import { workingCopy } from "./helpers";

/** A learner-shaped view of the SAVED draft (or latest version), with everything unlocked. */
export function usePreviewView(pathId: string): (PathView & { isDraft: boolean }) | undefined {
  const { state, learner } = useApp();
  return useMemo(() => {
    const entry = state.catalog.entries[pathId];
    if (!entry) return undefined;
    const bundle = workingCopy(entry);
    const isDraft = hasUnpublishedChanges(entry) || entry.versions.length === 0;
    const version = (latestPublished(entry)?.version ?? 0) + (isDraft ? 1 : 0);
    // A preview learner has no evidence, so it shows the first-time experience.
    const blank = { ...learner, attempts: [], evidence: [], drafts: {}, viewedConcepts: {}, enrollments: {} };
    const v = getPathView(state, blank, pathId, { bundle, version });
    if (!v) return undefined;
    return { ...v, visible: true, canAccess: () => true, canAccessConcept: () => true, isDraft };
  }, [state, learner, pathId]);
}
