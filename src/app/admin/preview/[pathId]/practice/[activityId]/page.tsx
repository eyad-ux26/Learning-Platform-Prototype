"use client";

import { useParams } from "next/navigation";
import { Workspace } from "@/activities/Workspace";
import { PreviewBar } from "@/admin/PreviewBar";
import { usePreviewView } from "@/admin/usePreviewView";

export default function PreviewPractice() {
  const { pathId, activityId } = useParams<{ pathId: string; activityId: string }>();
  const view = usePreviewView(pathId);
  const activity = view?.bundle.activities.find((a) => a.id === activityId);
  if (!view || !activity) return <p className="text-muted">This activity does not exist in the saved draft.</p>;
  return (
    <>
      <PreviewBar pathId={pathId} version={view.version.version} isDraft={view.isDraft} />
      <div className="-mx-4 sm:-mx-8">
        <Workspace key={JSON.stringify(activity).length + activity.id} view={view} activity={activity} mode="preview" backHref={`/admin/preview/${pathId}`} />
      </div>
    </>
  );
}
