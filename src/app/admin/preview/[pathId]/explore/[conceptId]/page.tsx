"use client";

import { useParams } from "next/navigation";
import { PreviewBar } from "@/admin/PreviewBar";
import { usePreviewView } from "@/admin/usePreviewView";
import { ExploreView } from "@/learner/ExploreView";
import { useApp } from "@/state/AppState";

export default function PreviewExplore() {
  const { pathId, conceptId } = useParams<{ pathId: string; conceptId: string }>();
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
