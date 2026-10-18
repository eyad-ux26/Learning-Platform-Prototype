"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { useApp, visibleLibrary } from "@/state/AppState";
import { EvidenceMeter, SkillStatusBadge } from "@/components/SkillStatus";
import { Card, EmptyState, LinkButton } from "@/components/ui";

export default function ProgressPage() {
  const { state, learner } = useApp();
  const library = useMemo(() => visibleLibrary(state, learner), [state, learner]);
  const active = library.filter((v) => v.pathAttempts.length > 0 || v.bundle.explore.some((c) => learner.viewedConcepts[c.id]));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">Progress</h1>
      <p className="mt-2 text-muted">Skill status comes from evidence in practice. Lessons viewed are shown separately.</p>
      {active.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No progress yet" action={<LinkButton href="/" variant="primary">Find a path</LinkButton>}>Try a free sample activity to start collecting evidence.</EmptyState>
        </div>
      ) : (
        <ul className="mt-8 space-y-6">
          {active.map((v) => {
            const viewed = v.bundle.explore.filter((c) => learner.viewedConcepts[c.id]).length;
            return (
              <li key={v.bundle.meta.id}>
                <Card className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-fg">{v.bundle.meta.title}</h2>
                      <p className="mt-1 text-sm text-muted">
                        {v.bundle.meta.availability === "full" ? (v.completion.complete ? "Complete" : `${v.completion.mastered.length} of ${v.bundle.requiredSkillIds.length} skills Mastered`) : "Preview path · sample evidence only"}
                        {v.bundle.explore.length > 0 && ` · ${viewed} of ${v.bundle.explore.length} lessons viewed`}
                      </p>
                    </div>
                    <Link href={`/paths/${v.bundle.meta.id}/skills`} className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                      Evidence and history <ArrowRight size={14} aria-hidden />
                    </Link>
                  </div>
                  <ul className="mt-4 divide-y divide-line">
                    {v.bundle.skills.filter((s) => v.bundle.meta.availability === "full" || v.progress[s.id].attemptsAssessed > 0).map((s) => (
                      <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <span className="text-sm text-fg">{s.name}</span>
                        <span className="flex items-center gap-3">
                          <EvidenceMeter progress={v.progress[s.id]} compact />
                          <SkillStatusBadge status={v.progress[s.id].status} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
