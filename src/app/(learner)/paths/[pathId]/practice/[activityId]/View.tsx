"use client";

import { useRouteParams } from "@/state/routeParams";

import { Workspace, LockedActivity } from "@/activities/Workspace";
import { useApp, usePathView } from "@/state/AppState";
import { Unavailable } from "@/learner/Unavailable";

export function PracticePage({ params }: { params?: Record<string, string> } = {}) {
  const { pathId, activityId } = useRouteParams<{ pathId: string; activityId: string }>(params);
  const view = usePathView(pathId);
  const { learner } = useApp();
  if (!view || !view.visible) return <Unavailable title="This path isn’t available" detail="It may have been unpublished or the link may be wrong. Your recorded evidence is kept." />;
  const activity = view.bundle.activities.find((a) => a.id === activityId);
  if (!activity) return <Unavailable title="This activity isn’t available" detail={`No activity “${activityId}” exists in version ${view.version.version} of this path.`} backHref={`/paths/${pathId}`} />;
  const href = `/paths/${pathId}/practice/${activityId}`;
  if (!view.canAccess(activity.id)) return <LockedActivity activity={activity} pathId={pathId} returnHref={href} />;
  // key forces a fresh workspace if the learner or content version changes
  return <Workspace key={`${learner.id}-${activity.id}-${view.version.version}`} view={view} activity={activity} mode="learner" backHref={`/paths/${pathId}`} />;
}
