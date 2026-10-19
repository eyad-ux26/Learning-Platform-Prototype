"use client";

import Link from "next/link";
import { BookOpen, Circle, Gift, Lock, Sparkles } from "lucide-react";
import { isSubscriptionActive } from "@/domain/access";
import { useI18n } from "@/i18n";
import type { AccessState, IconId, LearnerRecord } from "@/domain/types";
import { ICONS } from "@/components/PathArt";
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

/** Tile colour per path icon, as in the design's specialism cards. */
const TILE: Record<IconId, string> = { shield: "#6a5cf0", eye: "#1e9e7c", pointer: "#c7741a", compass: "#b0408c", network: "#2e6fd0", layers: "#2e6fd0", book: "#6a5cf0", sparkle: "#b0408c" };
export const pathTile = (icon: IconId) => TILE[icon] ?? "#6a5cf0";
export const pathCode = (index: number) => `SP-${String(index + 1).padStart(2, "0")}`;

export function PathCard({ view, learner, code, recommended }: { view: PathView; learner: LearnerRecord; code: string; recommended?: boolean }) {
  const { tr, L } = useI18n();
  const { meta, skills } = view.bundle;
  const mastered = view.completion.mastered.length;
  const preview = meta.availability === "preview";
  const Icon = ICONS[meta.icon] ?? BookOpen;
  return (
    <article className="frame-card group relative flex flex-1 flex-col gap-4 rounded-[22px] border border-line bg-surface p-5">
      <span className="frame-tag absolute -top-6 start-0.5 font-mono text-xs text-muted">{code} · {preview ? tr("Sample") : tr("Specialism")}</span>
      <div className="flex items-center gap-3">
        <span className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl text-white" style={{ background: pathTile(meta.icon) }} aria-hidden>
          <Icon size={26} strokeWidth={2} />
        </span>
        <span className="ms-auto flex flex-wrap items-center justify-end gap-1.5">
          {recommended && <Badge tone="accent">{tr("Recommended start")}</Badge>}
          {preview ? (
            <span className="rounded-full bg-ok-bg px-2.5 py-1 font-mono text-xs font-semibold text-ok">{tr("Free ×{n}", { n: meta.freeSampleActivityIds.length })}</span>
          ) : (
            <span dir="ltr" className="rounded-full bg-brand-deep px-2.5 py-1 font-mono text-xs font-semibold text-ai" aria-label={tr("{n} of {m}", { n: mastered, m: skills.length })}>{mastered} / {skills.length}</span>
          )}
        </span>
      </div>
      <div>
        <h3 className="font-display text-[22px] font-extrabold leading-[1.1] tracking-tight text-fg">
          <Link href={`/paths/${meta.id}`} className="after:absolute after:inset-0 after:rounded-[22px] focus-visible:outline-none">
            {meta.title}
          </Link>
        </h3>
        <p className="mt-1.5 font-mono text-xs text-muted">
          {L(meta.level)} · {tr("≈ {n} h (estimate)", { n: meta.estimatedHours })}
        </p>
      </div>
      <div className="mt-auto">
        {preview ? (
          <>
            <ul className="flex gap-2.5" aria-label={tr("{n} skills planned", { n: skills.length })}>
              {skills.map((s) => (
                <li key={s.id} title={s.name} className="flex h-[46px] w-[46px] items-center justify-center rounded-full border-[1.5px] border-dashed border-line-strong text-subtle">
                  <Circle size={5} fill="currentColor" aria-hidden />
                  <span className="sr-only">{s.name}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-start gap-1.5 text-xs text-muted"><Gift size={13} className="mt-0.5 shrink-0" aria-hidden /> {tr("Free sample activity available · full path not included in this prototype")}</p>
          </>
        ) : (
          <>
            <ul className="flex gap-2.5" aria-label={tr("Skill progress")}>
              {skills.map((s, i) => (
                <li key={s.id} title={s.name}>
                  <SkillRing index={i} progress={view.progress[s.id]} size={46} />
                  <span className="sr-only">{s.name}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3"><AccessBadge view={view} access={learner.access} /></div>
          </>
        )}
      </div>
    </article>
  );
}
