"use client";

import { useMemo, useState } from "react";
import { deriveProgression, type Progression } from "@/domain/progression";
import { useApp, visibleLibrary } from "@/state/AppState";

/** Rep, streak, rank and daily goal for the signed-in learner, derived from their own attempts and evidence. */
export function useProgression(): Progression {
  const { state, learner } = useApp();
  const [now] = useState(() => new Date().toISOString());
  return useMemo(() => {
    const masteredSkills = visibleLibrary(state, learner).reduce((n, v) => n + v.completion.mastered.length, 0);
    return deriveProgression({ attempts: learner.attempts, evidence: learner.evidence, masteredSkills, now, offsetMinutes: new Date(now).getTimezoneOffset() });
  }, [state, learner, now]);
}
