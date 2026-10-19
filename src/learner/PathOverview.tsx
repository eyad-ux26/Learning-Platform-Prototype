"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Circle, Clock, Eye, Gift, Info, Lock, PlayCircle, Target } from "lucide-react";
import { skillsAssessedBy } from "@/domain/assessment";
import { recommendNext } from "@/domain/recommend";
import type { Activity, LearnerRecord } from "@/domain/types";
import { t } from "@/i18n/en";
import { useI18n } from "@/i18n";
import { isArabic } from "@/i18n/core";
import { PathCover } from "@/components/PathArt";
import { SkillStatusBadge } from "@/components/SkillStatus";
import { SkillRing, skillHue } from "@/components/SkillRing";
import { Badge, Card, Frame, Handles, LinkButton, Notice, SectionHeading, cn } from "@/components/ui";
import type { PathView } from "@/state/AppState";
import { AccessBadge } from "./PathCard";

const COLUMNS = [
  { id: "inbox", label: "Inbox", hue: "#8c8b9e" },
  { id: "progress", label: "In progress", hue: "#ffc94d" },
  { id: "reopened", label: "Reopened", hue: "#ff7d5c" },
  { id: "shipped", label: "Shipped", hue: "#5ee0a8" },
] as const;

const TEMPLATE = { "design-bench": "Design Bench", critique: "Critique", decision: "Decision Scenario" } as const;

export function PathOverview({ view, learner, preview, onMoveToLatest }: { view: PathView; learner: LearnerRecord; preview?: boolean; onMoveToLatest?: () => void }) {
  const { tr, L, locale } = useI18n();
  const { bundle } = view;
  const { meta } = bundle;
  const base = preview ? `/admin/preview/${meta.id}` : `/paths/${meta.id}`;
  const isPreviewPath = meta.availability === "preview";
  const draftActivity = bundle.activities.find((a) => learner.drafts[a.id]);
  const rec = !isPreviewPath ? recommendNext({ bundle, evidence: view.pathEvidence, attempts: view.pathAttempts, canAccess: view.canAccess }) : undefined;
  const recActivity = rec?.type === "activity" ? bundle.activities.find((a) => a.id === rec.activityId) : undefined;
  const firstSample = bundle.activities.find((a) => meta.freeSampleActivityIds.includes(a.id));
  const started = view.pathAttempts.length > 0 || bundle.explore.some((c) => learner.viewedConcepts[c.id]);
  const explainFirst = learner.preferences.explanationsFirst && !started && bundle.explore.length > 0 && view.canAccessConcept(bundle.explore[0]);
  const primary: { href: string; label: string } | undefined = preview
    ? undefined
    : explainFirst
      ? { href: `${base}/explore/${bundle.explore[0].id}`, label: tr("Start with Explore") }
    : draftActivity
      ? { href: `${base}/practice/${draftActivity.id}`, label: tr("Resume: {title}", { title: draftActivity.title }) }
      : recActivity
        ? { href: `${base}/practice/${recActivity.id}`, label: started ? tr("Continue: {title}", { title: recActivity.title }) : tr("Start with practice") }
        : firstSample
          ? { href: `${base}/practice/${firstSample.id}`, label: isPreviewPath ? tr("Try the free sample") : tr("Start with practice") }
          : undefined;

  const freeList = [
    ...bundle.activities.filter((a) => meta.freeSampleActivityIds.includes(a.id)).map((a) => `“${a.title}”`),
    ...bundle.explore.filter((c) => c.freeSample).map((c) => tr("the lesson “{title}”", { title: c.title })),
  ];

  /** Board column: derived from the learner's own drafts and attempts, never from a stored flag. */
  const columnOf = (a: Activity): "inbox" | "progress" | "reopened" | "shipped" => {
    if (learner.drafts[a.id]) return "progress";
    const attempts = view.pathAttempts.filter((x) => x.activityId === a.id);
    if (!attempts.length) return "inbox";
    return attempts[attempts.length - 1].evaluation.skills.every((s) => s.met) ? "shipped" : "reopened";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <nav aria-label={tr("Breadcrumb")} className="text-sm text-subtle">
        <Link href={preview ? "/admin/paths" : "/"} className="hover:text-fg">{preview ? tr("Paths") : tr(t.nav.library)}</Link> <span aria-hidden>/</span> <span className="text-muted">{meta.title}</span>
      </nav>

      <Frame name={tr("Frame · {topic}", { topic: meta.topic })} className="mt-9">
      <Handles className="overflow-hidden rounded-[28px] border border-line bg-surface">
        <PathCover cover={meta.cover} icon={meta.icon} className="h-28 sm:h-32" />
        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex flex-wrap gap-2">
              <AccessBadge view={view} access={learner.access} />
              <Badge>{meta.topic}</Badge>
              {view.enrolledVersion && view.enrolledVersion < view.latestVersion && !preview && <Badge tone="ai">{tr("Your enrollment: version {n}", { n: view.enrolledVersion })}</Badge>}
            </div>
            <h1 className="mt-3 text-3xl font-extrabold leading-[1.05] tracking-tight text-fg sm:text-5xl">{meta.title}</h1>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted">{meta.summary}</p>
            <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div><dt className="text-subtle">{tr("Level")}</dt><dd className="text-fg">{L(meta.level)}</dd></div>
              <div><dt className="text-subtle">{tr("Estimated time")}</dt><dd className="flex items-center gap-1 text-fg"><Clock size={14} aria-hidden /> {tr("about {n} hours (estimate; varies)", { n: meta.estimatedHours })}</dd></div>
              <div><dt className="text-subtle">{tr(t.nav.skills)}</dt><dd className="text-fg">{tr("{n} to demonstrate", { n: bundle.skills.length })}</dd></div>
            </dl>
            {primary && (
              <div className="mt-6 flex flex-wrap gap-2">
                <LinkButton href={primary.href} variant="primary" size="lg">
                  <PlayCircle size={18} aria-hidden /> {primary.label}
                </LinkButton>
                {bundle.explore.length > 0 && !explainFirst && (
                  <LinkButton href={`${base}/explore/${bundle.explore[0].id}`} size="lg">
                    <BookOpen size={18} aria-hidden /> {tr("Explore first")}
                  </LinkButton>
                )}
                {explainFirst && firstSample && (
                  <LinkButton href={`${base}/practice/${firstSample.id}`} size="lg">
                    {tr("Go straight to practice")}
                  </LinkButton>
                )}
              </div>
            )}
            {!isPreviewPath && !preview && <p className="mt-3 text-sm text-subtle">{tr("You don’t need to finish Explore before practising. If you already know the topic, go straight to practice.")}</p>}
          </div>

          {!isPreviewPath ? (
            <Card className="h-fit bg-raised p-5" as="aside" aria-labelledby="completion">
              <h2 id="completion" className="flex items-center gap-2 text-sm font-semibold text-fg"><Target size={16} aria-hidden /> {tr("What completion requires")}</h2>
              <p className="mt-2 text-sm text-muted">{tr(t.rule.short)}</p>
              <p className={cn("mt-3 text-sm", view.completion.complete ? "text-ok" : "text-fg")}>
                {view.completion.complete ? tr("Complete. Every required skill is Mastered.") : tr("{n} of {m} skills Mastered.", { n: view.completion.mastered.length, m: bundle.requiredSkillIds.length })}
              </p>
              {!view.completion.complete && <p className="mt-1 text-xs text-subtle">{tr("Lessons viewed and activities attempted don’t complete a path on their own.")}</p>}
              {!preview && (
                <Link href={`${base}/skills`} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                  {tr("See evidence by skill")} <ArrowRight size={14} aria-hidden />
                </Link>
              )}
            </Card>
          ) : (
            <Notice tone="warn" icon={<Info size={16} />} title={tr(t.access.notIncluded)}>
              {tr("This path has an overview and one free sample activity in the prototype. Explore lessons and the remaining activities are not included.")}
            </Notice>
          )}
        </div>
      </Handles>
      </Frame>

      {view.enrolledVersion && view.enrolledVersion < view.latestVersion && !preview && (
        <Notice tone="ai" className="mt-6" title={tr("Version {n} of this path has been published", { n: view.latestVersion })} action={onMoveToLatest && <button type="button" onClick={onMoveToLatest} className="text-sm font-medium text-accent hover:underline">{tr("Move my enrollment to version {n}", { n: view.latestVersion })}</button>}>
          {tr("You are enrolled on version {n}, so your activities stay as they were when you started. Your attempts keep the version they were assessed against and are not re-evaluated. New enrollments use the latest version.", { n: view.enrolledVersion ?? 0 })}
        </Notice>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          <section aria-labelledby="skills">
            <SectionHeading id="skills" title={tr("Skills you will demonstrate")} />
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {bundle.skills.map((s, i) => {
                const p = view.progress[s.id];
                return (
                  <li key={s.id}>
                    <Card className={cn("flex h-full gap-4 p-4", p?.practiceRecommended && "border-sk-coral")}>
                      {!isPreviewPath && p ? <SkillRing index={i} progress={p} size={64} /> : <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-dashed border-line-strong text-subtle"><Circle size={14} aria-hidden /></span>}
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-lg font-extrabold leading-tight tracking-tight text-fg">{s.name}</p>
                        {!isPreviewPath && p && <div className="mt-1.5"><SkillStatusBadge status={p.status} /></div>}
                        <p className="mt-2 text-sm text-muted">{s.description}</p>
                        {!isPreviewPath && p && <p className="mt-1.5 font-mono text-xs text-subtle">{tr("{n} / {m} contexts", { n: Math.min(p.contextsMet.length, p.requiredContexts), m: p.requiredContexts })}</p>}
                        {isPreviewPath && s.criteria.length === 0 && <p className="mt-2 text-xs text-subtle">{tr(t.access.notIncluded)}</p>}
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </section>

          {bundle.activities.length > 0 && (
            <section aria-labelledby="practice">
              <SectionHeading id="practice" title={tr("Interactive practice")} eyebrow={bundle.activities.length === 1 ? tr("1 activity") : tr("{n} activities", { n: bundle.activities.length })} />
              <p className="mt-2 text-sm text-muted">{tr("Start anywhere. Alternative activities offer different contexts for the same skills.")}</p>
              <div className="-mx-4 mt-6 flex snap-x gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 2xl:grid-cols-4">
                {COLUMNS.map((col) => {
                  const items = bundle.activities.filter((a) => columnOf(a) === col.id);
                  return (
                    <section key={col.id} aria-label={tr(col.label)} className={cn("w-[78vw] shrink-0 snap-start rounded-[22px] border p-3 sm:w-auto", col.id === "reopened" ? "border-sk-coral/40 bg-bad-bg/40" : "border-line bg-surface/70")}>
                      <h3 className="mb-3 flex items-center gap-2 px-1 font-mono text-xs font-semibold" style={{ color: col.hue }}>
                        <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: col.hue }} />
                        {tr(col.label)}
                        <span className="ms-auto rounded-full bg-canvas px-2 text-subtle">{items.length}</span>
                      </h3>
                      <ul className="space-y-2.5">
                        {items.length === 0 && <li className="rounded-2xl border border-dashed border-line-strong px-3 py-4 text-center text-xs text-subtle">{tr("Nothing here")}</li>}
                        {items.map((a) => {
                          const free = meta.freeSampleActivityIds.includes(a.id);
                          const locked = !view.canAccess(a.id);
                          const ids = skillsAssessedBy(a, bundle.skills);
                          return (
                            <li key={a.id}>
                              <Link href={`${base}/practice/${a.id}`} className="block rounded-2xl border border-line bg-raised p-3.5 transition-[transform,border-color] hover:-translate-y-0.5 hover:border-brand-strong">
                                <p className="font-mono text-[11px] text-subtle">{tr(TEMPLATE[a.template])} · {tr("{n} min", { n: a.estimatedMinutes })}</p>
                                <p className="mt-1 font-display text-base font-extrabold leading-snug tracking-tight text-fg">{a.title}</p>
                                <p className="mt-0.5 text-xs text-muted">{a.contextLabel}</p>
                                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                  <span className="flex gap-1" aria-label={tr("Assesses: {names}", { names: ids.map((id) => bundle.skills.find((s) => s.id === id)?.name).join(", ") })} role="img">
                                    {ids.map((id) => <span key={id} className="h-2 w-5 rounded-full" style={{ background: skillHue(bundle.skills.findIndex((s) => s.id === id)) }} />)}
                                  </span>
                                  {a.kind === "alternative" && <Badge>{tr("Alternative")}</Badge>}
                                  {free ? <Badge tone="accent" icon={<Gift size={11} aria-hidden />}>{tr(t.access.free)}</Badge> : locked ? <Badge icon={<Lock size={11} aria-hidden />}>{tr("Subscription")}</Badge> : null}
                                </div>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  );
                })}
              </div>
            </section>
          )}

          {isPreviewPath && meta.plannedModules && (
            <section aria-labelledby="planned">
              <SectionHeading id="planned" title={tr("Planned content")} eyebrow={tr(t.access.notIncluded)} />
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {meta.plannedModules.map((m) => (
                  <li key={m} className="flex items-center gap-2 rounded-lg border border-dashed border-line-strong px-3 py-2.5 text-sm text-muted">
                    <Circle size={12} aria-hidden /> {m} <span className="ms-auto text-xs text-subtle">{tr("Not included")}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-8">
          {bundle.explore.length > 0 && (
            <section aria-labelledby="explore">
              <SectionHeading id="explore" title={tr("Explore")} level={3} eyebrow={tr("Short explanations")} />
              <ol className="mt-3 space-y-2">
                {bundle.explore.map((c, i) => {
                  const viewed = !!learner.viewedConcepts[c.id];
                  const locked = !view.canAccessConcept(c);
                  return (
                    <li key={c.id}>
                      <Link href={`${base}/explore/${c.id}`} className="flex items-start gap-3 rounded-lg border border-line bg-surface p-3 hover:border-line-strong">
                        <span className="mt-0.5 text-subtle">{viewed ? <CheckCircle2 size={16} className="text-muted" aria-label={tr("Viewed")} /> : <span className="flex h-4 w-4 items-center justify-center text-[11px]">{i + 1}</span>}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-fg">{c.title}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-subtle">
                            {tr("{n} min read", { n: c.readingMinutes })} {c.video && <span className="inline-flex items-center gap-1"><Eye size={11} aria-hidden /> {tr("video planned")}</span>}
                            {c.freeSample ? <span className="text-accent">{tr("Free")}</span> : locked ? <span className="inline-flex items-center gap-1"><Lock size={11} aria-hidden /> {tr("Subscription")}</span> : null}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-2 text-xs text-subtle">{tr("Lesson views are tracked separately and do not count as skill evidence.")}</p>
            </section>
          )}

          <section aria-labelledby="about">
            <SectionHeading id="about" title={tr("About this path")} level={3} />
            <h4 className="mt-4 text-sm font-medium text-fg">{tr("You will be able to")}</h4>
            <ul className="mt-2 space-y-1.5 text-sm text-muted">
              {meta.outcomes.map((o) => (
                <li key={o} className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-subtle" aria-hidden /> {o}</li>
              ))}
            </ul>
            <h4 className="mt-5 text-sm font-medium text-fg">{tr("Who it’s for")}</h4>
            <p className="mt-1 text-sm text-muted">{meta.audience}</p>
            <h4 className="mt-5 text-sm font-medium text-fg">{tr("Recommended prior knowledge")}</h4>
            <p className="mt-1 text-sm text-muted">{meta.prerequisites}</p>
            <h4 className="mt-5 text-sm font-medium text-fg">{tr("Free sample boundaries")}</h4>
            <p className="mt-1 text-sm text-muted">
              {tr("Free without a subscription: {list}.", { list: freeList.join(isArabic(locale) ? "، " : ", ") || tr("none") })}
              {!isPreviewPath && " " + tr("Everything else in this path is included with the subscription. Evidence from free samples is kept if you subscribe.")}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
