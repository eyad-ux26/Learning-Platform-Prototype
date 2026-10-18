"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useApp, usePathView } from "@/state/AppState";
import { ExploreView } from "@/learner/ExploreView";
import { Unavailable } from "@/learner/Unavailable";

export default function ExplorePage() {
  const { pathId, conceptId } = useParams<{ pathId: string; conceptId: string }>();
  const from = useSearchParams().get("from");
  const view = usePathView(pathId);
  const { learner, dispatch } = useApp();
  const onViewed = useCallback((id: string) => dispatch({ type: "viewConcept", conceptId: id, now: new Date().toISOString() }), [dispatch]);
  if (!view || !view.visible) return <Unavailable title="This path isn’t available" />;
  const concept = view.bundle.explore.find((c) => c.id === conceptId);
  if (!concept) return <Unavailable title="This lesson isn’t available" detail="It may have been removed or renamed in this version of the path." backHref={`/paths/${pathId}`} />;
  return <ExploreView view={view} concept={concept} learner={learner} fromActivityId={from} base={`/paths/${pathId}`} onViewed={onViewed} />;
}
