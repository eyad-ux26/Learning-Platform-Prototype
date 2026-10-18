"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePathView } from "@/state/AppState";
import { Unavailable } from "@/learner/Unavailable";

export default function ExploreIndex() {
  const { pathId } = useParams<{ pathId: string }>();
  const view = usePathView(pathId);
  const router = useRouter();
  const first = view?.bundle.explore[0];
  useEffect(() => {
    if (first) router.replace(`/paths/${pathId}/explore/${first.id}`);
  }, [first, pathId, router]);
  if (!first) return <Unavailable title="No Explore content in this prototype" detail="This path has a free sample activity but its lessons are not included." backHref={`/paths/${pathId}`} />;
  return null;
}
