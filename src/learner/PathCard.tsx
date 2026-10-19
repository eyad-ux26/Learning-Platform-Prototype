"use client";

import Link from "next/link";
import { Clock, Gift, Lock, Sparkles } from "lucide-react";
import { isSubscriptionActive } from "@/domain/access";
import { useI18n } from "@/i18n";
import type { AccessState, LearnerRecord } from "@/domain/types";
import { PathCover } from "@/components/PathArt";
import { Badge } from "@/components/ui";
import { SkillRing } from "@/components/SkillRing";
import type { PathView } from "@/state/AppState";

export type ProgressState = "not-started" | "in-progress" | "completed";

export function pathProgressState(view: PathView, learner: LearnerRecord): ProgressState {
  if (view.bundle.meta.availability === "full" && view.completion.complete) return "completed";
  const viewed = view.bundle.explore.some((c) => learner.viewedConcepts[c.id]);
  const drafts = view.bundle.activities.some((a) => learner.drafts[a.id]);
  return view.pathAttempts.length > 0 || viewed || drafts ? "in-progress" : "not-started";
}

export function AccessBadge({ view, access }: { view: PathView; access: AccessState }) {
  const { tr } = useI18n();
  if (view.bundle.meta.availability === "preview")
    return <Badge tone="warn" icon={<Sparkles size={11} aria-hidden />}>{tr("Preview · sample only")}</Badge>;
  if (isSubscriptionActive(access)) return <Badge tone="ok">{tr("Included in your subscription")}</Badge>;
  return (
    <Badge tone="neutral" icon={<Lock size={11} aria-hidden />}>
      {tr("Subscription · {n} free samples", { n: view.bundle.meta.freeSampleActivityIds.length })}
    </Badge>
  );
}

export function PathCard({ view, learner, recommended }: { view: PathView; learner: LearnerRecord; recommended?: boolean }) {
  const { tr, L } = useI18n();
  const { meta, skills, explore } = view.bundle;
  const mastered = view.completion.mastered.length;
  const viewed = explore.filter((c) => learner.viewedConcepts[c.id]).length;
  const preview = meta.availability === "preview";
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface transition-[transform,border-color] hover:-translate-y-0.5 hover:border-brand-strong">
      <PathCover cover={meta.cover} icon={meta.icon} className="h-24" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          {recommended && <Badge tone="accent">{tr("Recommended start")}</Badge>}
          <AccessBadge view={view} access={learner.access} />
        </div>
        <h3 className="mt-3 font-display text-xl font-extrabold tracking-tight text-fg">
          <Link href={`/paths/${meta.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {meta.title}
          </Link>
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{meta.summary}</p>
        <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-subtle">
          <div><dt className="sr-only">{tr("Level")}</dt><dd>{L(meta.level)}</dd></div>
          <div className="flex items-center gap-1"><dt className="sr-only">{tr("Estimated duration")}</dt><Clock size={12} aria-hidden /><dd>{tr("≈ {n} h (estimate)", { n: meta.estimatedHours })}</dd></div>
          <div><dt className="sr-only">{tr("Topic")}</dt><dd>{meta.topic}</dd></div>
        </dl>
        <div className="mt-4">
          {preview ? (
            <>
              <p className="text-xs font-medium text-subtle">{tr("{n} skills planned", { n: skills.length })}</p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <li key={s.id} className="rounded-md border border-dashed border-line-strong px-2 py-0.5 text-xs text-muted">{s.name}</li>
                ))}
              </ul>
            </>
          ) : (
            <ul className="flex flex-wrap gap-3" aria-label={tr("Skill progress")}>
              {skills.map((s, i) => (
                <li key={s.id} className="flex flex-col items-center gap-1" title={s.name}>
                  <SkillRing index={i} progress={view.progress[s.id]} size={48} />
                  <span className="max-w-14 truncate font-mono text-[10px] text-subtle">{s.name.split(" ")[0]}</span>
                  <span className="sr-only">{s.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-auto pt-5">
          {preview ? (
            <p className="flex items-center gap-1.5 text-xs text-muted"><Gift size={13} aria-hidden /> {tr("Free sample activity available · full path not included in this prototype")}</p>
          ) : (
            <dl className="grid grid-cols-2 gap-3 border-t border-line pt-4 text-xs">
              <div>
                <dt className="text-subtle">{tr("Skills mastered")}</dt>
                <dd className="mt-0.5 text-sm font-medium text-fg">{tr("{n} of {m}", { n: mastered, m: skills.length })}</dd>
              </div>
              <div>
                <dt className="text-subtle">{tr("Lessons viewed")}</dt>
                <dd className="mt-0.5 text-sm font-medium text-fg">{tr("{n} of {m}", { n: viewed, m: explore.length })}</dd>
              </div>
            </dl>
          )}
        </div>
      </div>
    </article>
  );
}
