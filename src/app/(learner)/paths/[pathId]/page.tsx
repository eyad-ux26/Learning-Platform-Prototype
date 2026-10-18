"use client";

import { useParams } from "next/navigation";
import { useApp, usePathView } from "@/state/AppState";
import { PathOverview } from "@/learner/PathOverview";
import { Unavailable } from "@/learner/Unavailable";

export default function PathPage() {
  const { pathId } = useParams<{ pathId: string }>();
  const view = usePathView(pathId);
  const { learner, dispatch } = useApp();
  if (!view || !view.visible) return <Unavailable title="This path isn’t available" detail="It may have been unpublished or archived. Any evidence you recorded is kept." />;
  return (
    <PathOverview
      view={view}
      learner={learner}
      onMoveToLatest={() => dispatch({ type: "reenroll", pathId, version: view.latestVersion, now: new Date().toISOString() })}
    />
  );
}
