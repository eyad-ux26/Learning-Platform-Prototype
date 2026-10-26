"use client";

import { useMemo } from "react";
import { deriveBadges, type EarnedBadge } from "@/domain/badges";
import { useApp, visibleLibrary } from "@/state/AppState";

/** Prototype badges for the signed-in learner, derived from their own attempts and evidence. */
export function useBadges(): EarnedBadge[] {
  const { state, learner } = useApp();
  return useMemo(() => {
    const paths = visibleLibrary(state, learner).map((v) => ({
      id: v.rawBundle.meta.id,
      requiredSkillIds: v.rawBundle.requiredSkillIds,
      activityIds: v.rawBundle.activities.map((a) => a.id),
    }));
    const offsetMinutes = new Date().getTimezoneOffset();
    return deriveBadges({ attempts: learner.attempts, evidence: learner.evidence, paths, offsetMinutes });
  }, [state, learner]);
}
