"use client";

import { useParams } from "next/navigation";
import { PreviewBar } from "@/admin/PreviewBar";
import { usePreviewView } from "@/admin/usePreviewView";
import { PathOverview } from "@/learner/PathOverview";
import { useApp } from "@/state/AppState";

export default function PreviewOverview() {
  const { pathId } = useParams<{ pathId: string }>();
  const view = usePreviewView(pathId);
  const { learner } = useApp();
  if (!view) return <p className="text-muted">Nothing to preview.</p>;
  return (
    <>
      <PreviewBar pathId={pathId} version={view.version.version} isDraft={view.isDraft} />
      <div className="-mx-4 sm:-mx-8">
        <PathOverview view={view} learner={{ ...learner, drafts: {}, viewedConcepts: {} }} preview />
      </div>
    </>
  );
}
