"use client";

import { useRouteParams } from "@/state/routeParams";

import { PreviewBar } from "@/admin/PreviewBar";
import { usePreviewView } from "@/admin/usePreviewView";
import { ExploreView } from "@/learner/ExploreView";
import { useApp } from "@/state/AppState";

export function PreviewExplore({ params }: { params?: Record<string, string> } = {}) {
  const { pathId, conceptId } = useRouteParams<{ pathId: string; conceptId: string }>(params);
  const view = usePreviewView(pathId);
  const { learner } = useApp();
  const concept = view?.bundle.explore.find((c) => c.id === conceptId);
  if (!view || !concept) return <p className="text-muted">This concept does not exist in the saved draft.</p>;
  return (
    <>
      <PreviewBar pathId={pathId} version={view.version.version} isDraft={view.isDraft} />
      <div className="-mx-4 sm:-mx-8">
        <ExploreView view={view} concept={concept} learner={{ ...learner, viewedConcepts: {} }} base={`/admin/preview/${pathId}`} />
      </div>
    </>
  );
}
