"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, CornerUpLeft, Film, Lock, PlayCircle } from "lucide-react";
import { ScreenRenderer } from "@/activities/ScreenRenderer";
import type { ExploreConcept, LearnerRecord, VideoLesson } from "@/domain/types";
import { t } from "@/i18n/en";
import { useI18n } from "@/i18n";
import { Badge, Card, LinkButton, Notice, cn } from "@/components/ui";
import type { PathView } from "@/state/AppState";

export function ExploreView({
  view,
  concept,
  learner,
  fromActivityId,
  base,
  onViewed,
}: {
  view: PathView;
  concept: ExploreConcept;
  learner: LearnerRecord;
  fromActivityId?: string | null;
  base: string;
  onViewed?: (id: string) => void;
}) {
  const { tr } = useI18n();
  const { bundle } = view;
  const idx = bundle.explore.findIndex((c) => c.id === concept.id);
  const prev = bundle.explore[idx - 1];
  const next = bundle.explore[idx + 1];
  const locked = !view.canAccessConcept(concept);
  const from = fromActivityId ? bundle.activities.find((a) => a.id === fromActivityId) : undefined;
  const fromQ = from ? `?from=${from.id}` : "";
  const skill = bundle.skills.find((s) => s.id === concept.skillId);

  useEffect(() => {
    if (!locked) onViewed?.(concept.id);
  }, [concept.id, locked, onViewed]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <nav aria-label={tr("Breadcrumb")} className="text-sm text-subtle">
        <Link href={base} className="hover:text-fg">{bundle.meta.title}</Link> <span aria-hidden>/</span> <span className="text-muted">{tr("Explore")}</span>
      </nav>

      {from && (
        <div className="sticky top-16 z-20 mt-4">
          <Notice
            tone="accent"
            icon={<CornerUpLeft size={16} />}
            title={tr("You came here from “{title}”", { title: from.title })}
            action={<LinkButton href={`${base}/practice/${from.id}`} variant="primary" size="sm">{tr("Return to the activity")}</LinkButton>}
          >
            {tr("Your unfinished response is saved. Reading this does not change how your attempt counts.")}
          </Notice>
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
        <nav aria-label={tr("Concepts")} className="min-w-0 lg:sticky lg:top-24 lg:h-fit">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtle">{tr("Concepts")}</p>
          <ol className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {bundle.explore.map((c, i) => {
              const current = c.id === concept.id;
              const viewed = !!learner.viewedConcepts[c.id];
              return (
                <li key={c.id} className="shrink-0">
                  <Link
                    href={`${base}/explore/${c.id}${fromQ}`}
                    aria-current={current ? "page" : undefined}
                    className={cn("flex min-h-11 items-center gap-2.5 rounded-lg border px-3 py-2 text-sm", current ? "border-accent/50 bg-accent/5 text-fg" : "border-transparent text-muted hover:bg-raised hover:text-fg")}
                  >
                    {viewed ? <CheckCircle2 size={15} className="shrink-0 text-subtle" aria-label={tr("Viewed")} /> : <span className="w-[15px] shrink-0 text-center text-xs">{i + 1}</span>}
                    <span className="whitespace-nowrap lg:whitespace-normal">{c.title}</span>
                    {!view.canAccessConcept(c) && <Lock size={12} className="ms-auto shrink-0 text-subtle" aria-label={tr("Subscription")} />}
                  </Link>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 hidden text-xs text-subtle lg:block">{tr("Viewed lessons are tracked for your convenience. They don’t count as skill evidence.")}</p>
        </nav>

        <article className="min-w-0 max-w-3xl" aria-labelledby="concept-title">
          <div className="flex flex-wrap items-center gap-2 text-xs text-subtle">
            {skill ? <Badge>{skill.name}</Badge> : <Badge>{tr("Introduction")}</Badge>}
            <span>{tr("{n} min read", { n: concept.readingMinutes })}</span>
            {concept.freeSample && <Badge tone="accent">{tr("Free")}</Badge>}
          </div>
          <h1 id="concept-title" className="mt-3 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{concept.title}</h1>
          <p className="mt-2 text-lg leading-relaxed text-muted">{concept.summary}</p>

          {locked ? (
            <Notice tone="accent" className="mt-8" icon={<Lock size={16} />} title={tr("This lesson is included with the subscription")} action={<LinkButton href={`/subscribe?return=${encodeURIComponent(`${base}/explore/${concept.id}`)}`} variant="primary" size="sm">{tr("Review subscription")}</LinkButton>}>
              {tr("The first lesson and two practice activities are free. You can also go straight to the free practice activities.")}
            </Notice>
          ) : (
            <>
              {concept.video && <VideoBlock video={concept.video} transcriptOpen={learner.preferences.captions} />}

              <div className="mt-8 space-y-7">
                {concept.sections.map((s) => (
                  <section key={s.heading}>
                    <h2 className="text-lg font-semibold text-fg">{s.heading}</h2>
                    <p className="mt-2 leading-relaxed text-muted">{s.body}</p>
                  </section>
                ))}
              </div>

              {concept.comparisons.map((cmp) => (
                <section key={cmp.title} className="mt-10" aria-labelledby={`cmp-${cmp.title}`}>
                  <h2 id={`cmp-${cmp.title}`} className="text-lg font-semibold text-fg">{tr("Before and after: {title}", { title: cmp.title })}</h2>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {(["before", "after"] as const).map((side) => (
                      <figure key={side} className="space-y-2">
                        <figcaption className="flex items-center gap-2 text-sm">
                          <Badge tone={side === "before" ? "bad" : "ok"}>{side === "before" ? tr("Before") : tr("After")}</Badge>
                          <span className="text-muted">{cmp[side].caption}</span>
                        </figcaption>
                        <ScreenRenderer screen={cmp[side].screen} label={tr(side === "before" ? "Before: {caption}" : "After: {caption}", { caption: cmp[side].caption })} />
                      </figure>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-muted"><span className="font-medium text-fg">{tr("Why it matters:")} </span>{cmp.whyItMatters}</p>
                </section>
              ))}

              <Card className="mt-10 p-5" as="section" aria-labelledby="example">
                <h2 id="example" className="text-sm font-semibold uppercase tracking-wide text-subtle">{tr("Realistic example")}</h2>
                <p className="mt-2 font-medium text-fg">{concept.example.title}</p>
                <p className="mt-1 leading-relaxed text-muted">{concept.example.body}</p>
              </Card>
            </>
          )}

          {concept.practiceActivityIds.length > 0 && (
            <section className="mt-10" aria-labelledby="practise">
              <h2 id="practise" className="text-lg font-semibold text-fg">{tr("Practise this")}</h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {concept.practiceActivityIds.map((id) => {
                  const a = bundle.activities.find((x) => x.id === id);
                  if (!a) return null;
                  const acc = view.canAccess(a.id);
                  return (
                    <li key={id}>
                      <Link href={`${base}/practice/${a.id}`} className="flex h-full flex-col rounded-xl border border-line bg-surface p-4 hover:border-line-strong">
                        <span className="text-xs text-subtle">{a.contextLabel}</span>
                        <span className="mt-1 font-medium text-fg">{a.title}</span>
                        <span className="mt-auto pt-3 text-xs">{bundle.meta.freeSampleActivityIds.includes(a.id) ? <Badge tone="accent">{tr(t.access.free)}</Badge> : acc ? <span className="text-accent">{tr("Start →")}</span> : <Badge icon={<Lock size={11} aria-hidden />}>{tr("Subscription")}</Badge>}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <div className="mt-12 flex flex-wrap justify-between gap-3 border-t border-line pt-6">
            {prev ? <LinkButton href={`${base}/explore/${prev.id}${fromQ}`} variant="ghost"><ArrowLeft size={15} aria-hidden /> {prev.title}</LinkButton> : <span />}
            {next && <LinkButton href={`${base}/explore/${next.id}${fromQ}`} variant="secondary">{next.title} <ArrowRight size={15} aria-hidden /></LinkButton>}
          </div>
        </article>
      </div>
    </div>
  );
}

/**
 * Short-video lesson format. No video assets exist in this prototype, so lessons
 * without `src` show an explicitly labelled placeholder: no fake player.
 */
function VideoBlock({ video, transcriptOpen }: { video: VideoLesson; transcriptOpen: boolean }) {
  const { tr } = useI18n();
  const [failed, setFailed] = useState(false);
  const [showTranscript, setShowTranscript] = useState(transcriptOpen);
  const placeholder = !video.src || failed;
  return (
    <section className="mt-8 overflow-hidden rounded-xl border border-line bg-surface" aria-labelledby="video-title">
      {placeholder ? (
        <div className="border-b border-line bg-raised p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-line-strong text-subtle"><Film size={18} aria-hidden /></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-warn">{failed ? tr("Video failed to load") : tr("Video placeholder · not produced yet")}</p>
              <h2 id="video-title" className="mt-0.5 font-semibold text-fg">{video.title}</h2>
              <p className="mt-1 text-sm text-muted">
                {failed ? tr("The video file could not be loaded. The transcript below covers the same content.") : tr("Planned length: {length}. The storyboard and transcript below show what the video will cover.", { length: video.plannedLength })}
              </p>
            </div>
          </div>
          <ol className="mt-4 grid gap-2 sm:grid-cols-2">
            {video.storyboard.map((f) => (
              <li key={f.frame} className="rounded-lg border border-line bg-canvas p-3">
                <p className="text-xs font-semibold text-subtle">{tr("Frame {n}", { n: f.frame })}</p>
                <p className="mt-1 text-sm text-fg">{f.visual}</p>
                <p className="mt-1 text-xs italic text-muted">“{f.narration}”</p>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="border-b border-line">
          <h2 id="video-title" className="sr-only">{video.title}</h2>
          <video controls preload="metadata" className="aspect-video w-full bg-black" onError={() => setFailed(true)}>
            <source src={video.src} onError={() => setFailed(true)} />
          </video>
        </div>
      )}
      <div className="p-4">
        <button type="button" onClick={() => setShowTranscript((s) => !s)} aria-expanded={showTranscript} className="inline-flex items-center gap-2 text-sm font-medium text-accent">
          <PlayCircle size={15} aria-hidden /> {showTranscript ? tr("Hide transcript") : tr("Read the transcript")}
        </button>
        {showTranscript && (
          <ol className="mt-3 space-y-2">
            {video.transcript.map((l) => (
              <li key={l.at} className="flex gap-3 text-sm">
                <span className="w-10 shrink-0 font-mono text-xs text-subtle">{l.at}</span>
                <span className="text-muted">{l.text}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
