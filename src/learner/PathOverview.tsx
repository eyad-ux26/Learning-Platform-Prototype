"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Circle, Clock, Eye, Gift, Info, Lock, PlayCircle, Target } from "lucide-react";
import { skillsAssessedBy } from "@/domain/assessment";
import { recommendNext } from "@/domain/recommend";
import type { Activity, LearnerRecord } from "@/domain/types";
import { t } from "@/i18n/en";
import { PathCover } from "@/components/PathArt";
import { EvidenceMeter, SkillStatusBadge } from "@/components/SkillStatus";
import { Badge, Card, LinkButton, Notice, SectionHeading, cn } from "@/components/ui";
import type { PathView } from "@/state/AppState";
import { AccessBadge } from "./PathCard";

const TEMPLATE = { "design-bench": "Design Bench", critique: "Critique", decision: "Decision Scenario" } as const;

export function PathOverview({ view, learner, preview, onMoveToLatest }: { view: PathView; learner: LearnerRecord; preview?: boolean; onMoveToLatest?: () => void }) {
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
      ? { href: `${base}/explore/${bundle.explore[0].id}`, label: "Start with Explore" }
    : draftActivity
      ? { href: `${base}/practice/${draftActivity.id}`, label: `Resume: ${draftActivity.title}` }
      : recActivity
        ? { href: `${base}/practice/${recActivity.id}`, label: started ? `Continue: ${recActivity.title}` : "Start with practice" }
        : firstSample
          ? { href: `${base}/practice/${firstSample.id}`, label: isPreviewPath ? "Try the free sample" : "Start with practice" }
          : undefined;

  const activityStatus = (a: Activity) => {
    const attempts = view.pathAttempts.filter((x) => x.activityId === a.id);
    if (learner.drafts[a.id]) return { label: "In progress", tone: "warn" as const };
    if (!attempts.length) return null;
    const last = attempts[attempts.length - 1];
    return last.evaluation.skills.every((s) => s.met) ? { label: "All criteria met", tone: "ok" as const } : { label: "Attempted", tone: "neutral" as const };
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-subtle">
        <Link href={preview ? "/admin/paths" : "/"} className="hover:text-fg">{preview ? "Paths" : "Library"}</Link> <span aria-hidden>/</span> <span className="text-muted">{meta.title}</span>
      </nav>

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
        <PathCover cover={meta.cover} icon={meta.icon} className="h-28 sm:h-32" />
        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex flex-wrap gap-2">
              <AccessBadge view={view} access={learner.access} />
              <Badge>{meta.topic}</Badge>
              {view.enrolledVersion && view.enrolledVersion < view.latestVersion && !preview && <Badge tone="ai">Your enrollment: version {view.enrolledVersion}</Badge>}
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{meta.title}</h1>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted">{meta.summary}</p>
            <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div><dt className="text-subtle">Level</dt><dd className="text-fg">{meta.level}</dd></div>
              <div><dt className="text-subtle">Estimated time</dt><dd className="flex items-center gap-1 text-fg"><Clock size={14} aria-hidden /> about {meta.estimatedHours} hours (estimate; varies)</dd></div>
              <div><dt className="text-subtle">Skills</dt><dd className="text-fg">{bundle.skills.length} to demonstrate</dd></div>
            </dl>
            {primary && (
              <div className="mt-6 flex flex-wrap gap-2">
                <LinkButton href={primary.href} variant="primary" size="lg">
                  <PlayCircle size={18} aria-hidden /> {primary.label}
                </LinkButton>
                {bundle.explore.length > 0 && !explainFirst && (
                  <LinkButton href={`${base}/explore/${bundle.explore[0].id}`} size="lg">
                    <BookOpen size={18} aria-hidden /> Explore first
                  </LinkButton>
                )}
                {explainFirst && firstSample && (
                  <LinkButton href={`${base}/practice/${firstSample.id}`} size="lg">
                    Go straight to practice
                  </LinkButton>
                )}
              </div>
            )}
            {!isPreviewPath && !preview && <p className="mt-3 text-sm text-subtle">You don’t need to finish Explore before practising. If you already know the topic, go straight to practice.</p>}
          </div>

          {!isPreviewPath ? (
            <Card className="h-fit bg-raised p-5" as="aside" aria-labelledby="completion">
              <h2 id="completion" className="flex items-center gap-2 text-sm font-semibold text-fg"><Target size={16} aria-hidden /> What completion requires</h2>
              <p className="mt-2 text-sm text-muted">{t.rule.short}</p>
              <p className={cn("mt-3 text-sm", view.completion.complete ? "text-ok" : "text-fg")}>
                {view.completion.complete ? "Complete. Every required skill is Mastered." : `${view.completion.mastered.length} of ${bundle.requiredSkillIds.length} skills Mastered.`}
              </p>
              {!view.completion.complete && <p className="mt-1 text-xs text-subtle">Lessons viewed and activities attempted don’t complete a path on their own.</p>}
              {!preview && (
                <Link href={`${base}/skills`} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                  See evidence by skill <ArrowRight size={14} aria-hidden />
                </Link>
              )}
            </Card>
          ) : (
            <Notice tone="warn" icon={<Info size={16} />} title={t.access.notIncluded}>
              This path has an overview and one free sample activity in the prototype. Explore lessons and the remaining activities are not included.
            </Notice>
          )}
        </div>
      </div>

      {view.enrolledVersion && view.enrolledVersion < view.latestVersion && !preview && (
        <Notice tone="ai" className="mt-6" title={`Version ${view.latestVersion} of this path has been published`} action={onMoveToLatest && <button type="button" onClick={onMoveToLatest} className="text-sm font-medium text-accent hover:underline">Move my enrollment to version {view.latestVersion}</button>}>
          You are enrolled on version {view.enrolledVersion}, so your activities stay as they were when you started. Your attempts keep the version they were assessed against and are not re-evaluated. New enrollments use the latest version.
        </Notice>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          <section aria-labelledby="skills">
            <SectionHeading id="skills" title="Skills you will demonstrate" />
            <ul className="mt-4 space-y-3">
              {bundle.skills.map((s) => {
                const p = view.progress[s.id];
                return (
                  <li key={s.id}>
                    <Card className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-fg">{s.name}</p>
                          <p className="mt-1 text-sm text-muted">{s.description}</p>
                        </div>
                        {!isPreviewPath && p && <SkillStatusBadge status={p.status} />}
                      </div>
                      {!isPreviewPath && p && (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <EvidenceMeter progress={p} />
                        </div>
                      )}
                      {isPreviewPath && s.criteria.length === 0 && <p className="mt-2 text-xs text-subtle">{t.access.notIncluded}</p>}
                    </Card>
                  </li>
                );
              })}
            </ul>
          </section>

          {bundle.activities.length > 0 && (
            <section aria-labelledby="practice">
              <SectionHeading id="practice" title="Interactive practice" eyebrow={`${bundle.activities.length} ${bundle.activities.length === 1 ? "activity" : "activities"}`} />
              <p className="mt-2 text-sm text-muted">Start anywhere. Alternative activities offer different contexts for the same skills.</p>
              <ul className="mt-4 divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
                {bundle.activities.map((a) => {
                  const free = meta.freeSampleActivityIds.includes(a.id);
                  const locked = !view.canAccess(a.id);
                  const st = activityStatus(a);
                  return (
                    <li key={a.id}>
                      <Link href={`${base}/practice/${a.id}`} className="flex flex-col gap-2 p-4 hover:bg-raised sm:flex-row sm:items-center sm:gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-subtle">
                            <span>{TEMPLATE[a.template]}</span>
                            <span aria-hidden>·</span>
                            <span>{a.contextLabel}</span>
                            {a.kind === "alternative" && <Badge>Alternative</Badge>}
                          </div>
                          <p className="mt-1 font-medium text-fg">{a.title}</p>
                          <p className="mt-1 text-xs text-muted">Assesses: {skillsAssessedBy(a, bundle.skills).map((id) => bundle.skills.find((s) => s.id === id)?.name).join(" · ")}</p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          {st && <Badge tone={st.tone}>{st.label}</Badge>}
                          {free ? <Badge tone="accent" icon={<Gift size={11} aria-hidden />}>{t.access.free}</Badge> : locked ? <Badge icon={<Lock size={11} aria-hidden />}>Subscription</Badge> : null}
                          <span className="text-xs text-subtle">{a.estimatedMinutes} min</span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {isPreviewPath && meta.plannedModules && (
            <section aria-labelledby="planned">
              <SectionHeading id="planned" title="Planned content" eyebrow={t.access.notIncluded} />
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {meta.plannedModules.map((m) => (
                  <li key={m} className="flex items-center gap-2 rounded-lg border border-dashed border-line-strong px-3 py-2.5 text-sm text-muted">
                    <Circle size={12} aria-hidden /> {m} <span className="ms-auto text-xs text-subtle">Not included</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-8">
          {bundle.explore.length > 0 && (
            <section aria-labelledby="explore">
              <SectionHeading id="explore" title="Explore" level={3} eyebrow="Short explanations" />
              <ol className="mt-3 space-y-2">
                {bundle.explore.map((c, i) => {
                  const viewed = !!learner.viewedConcepts[c.id];
                  const locked = !view.canAccessConcept(c);
                  return (
                    <li key={c.id}>
                      <Link href={`${base}/explore/${c.id}`} className="flex items-start gap-3 rounded-lg border border-line bg-surface p-3 hover:border-line-strong">
                        <span className="mt-0.5 text-subtle">{viewed ? <CheckCircle2 size={16} className="text-muted" aria-label="Viewed" /> : <span className="flex h-4 w-4 items-center justify-center text-[11px]">{i + 1}</span>}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-fg">{c.title}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-subtle">
                            {c.readingMinutes} min read {c.video && <span className="inline-flex items-center gap-1"><Eye size={11} aria-hidden /> video planned</span>}
                            {c.freeSample ? <span className="text-accent">Free</span> : locked ? <span className="inline-flex items-center gap-1"><Lock size={11} aria-hidden /> Subscription</span> : null}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-2 text-xs text-subtle">Lesson views are tracked separately and do not count as skill evidence.</p>
            </section>
          )}

          <section aria-labelledby="about">
            <SectionHeading id="about" title="About this path" level={3} />
            <h4 className="mt-4 text-sm font-medium text-fg">You will be able to</h4>
            <ul className="mt-2 space-y-1.5 text-sm text-muted">
              {meta.outcomes.map((o) => (
                <li key={o} className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-subtle" aria-hidden /> {o}</li>
              ))}
            </ul>
            <h4 className="mt-5 text-sm font-medium text-fg">Who it’s for</h4>
            <p className="mt-1 text-sm text-muted">{meta.audience}</p>
            <h4 className="mt-5 text-sm font-medium text-fg">Recommended prior knowledge</h4>
            <p className="mt-1 text-sm text-muted">{meta.prerequisites}</p>
            <h4 className="mt-5 text-sm font-medium text-fg">Free sample boundaries</h4>
            <p className="mt-1 text-sm text-muted">
              Free without a subscription:{" "}
              {[...bundle.activities.filter((a) => meta.freeSampleActivityIds.includes(a.id)).map((a) => `“${a.title}”`), ...bundle.explore.filter((c) => c.freeSample).map((c) => `the lesson “${c.title}”`)].join(", ") || "none"}.
              {!isPreviewPath && " Everything else in this path is included with the subscription. Evidence from free samples is kept if you subscribe."}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
