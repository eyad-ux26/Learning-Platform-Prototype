"use client";

import { useRouteParams } from "@/state/routeParams";
import { useRouter } from "next/navigation";

import { useEffect } from "react";
import { useI18n } from "@/i18n";
import { usePathView } from "@/state/AppState";
import { Unavailable } from "@/learner/Unavailable";

export function ExploreIndex({ params }: { params?: Record<string, string> } = {}) {
  const { pathId } = useRouteParams<{ pathId: string }>(params);
  const { tr } = useI18n();
  const view = usePathView(pathId);
  const router = useRouter();
  const first = view?.bundle.explore[0];
  useEffect(() => {
    if (first) router.replace(`/paths/${pathId}/explore/${first.id}`);
  }, [first, pathId, router]);
  if (!first) return <Unavailable title={tr("No Explore content in this prototype")} detail={tr("This path has a free sample activity but its lessons are not included.")} backHref={`/paths/${pathId}`} />;
  return null;
}
