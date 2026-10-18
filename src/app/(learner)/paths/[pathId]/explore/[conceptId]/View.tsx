"use client";

import { useRouteParams } from "@/state/routeParams";
import { useSearchParams } from "next/navigation";

import { useCallback } from "react";
import { useApp, usePathView } from "@/state/AppState";
import { ExploreView } from "@/learner/ExploreView";
import { Unavailable } from "@/learner/Unavailable";

export function ExplorePage({ params }: { params?: Record<string, string> } = {}) {
  const { pathId, conceptId } = useRouteParams<{ pathId: string; conceptId: string }>(params);
  const from = useSearchParams().get("from");
  const view = usePathView(pathId);
  const { learner, dispatch } = useApp();
  const onViewed = useCallback((id: string) => dispatch({ type: "viewConcept", conceptId: id, now: new Date().toISOString() }), [dispatch]);
  if (!view || !view.visible) return <Unavailable title="This path isn’t available" />;
  const concept = view.bundle.explore.find((c) => c.id === conceptId);
  if (!concept) return <Unavailable title="This lesson isn’t available" detail="It may have been removed or renamed in this version of the path." backHref={`/paths/${pathId}`} />;
  return <ExploreView view={view} concept={concept} learner={learner} fromActivityId={from} base={`/paths/${pathId}`} onViewed={onViewed} />;
}
