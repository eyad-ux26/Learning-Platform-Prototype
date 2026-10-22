"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, Check, ChevronLeft, CheckCircle2, Circle, CircleHelp, Clock, Gift, Inbox, Info, Lock, Play, RotateCcw, Search, ShieldCheck, Trophy, Undo2, type LucideIcon } from "lucide-react";
import { skillsAssessedBy } from "@/domain/assessment";
import { recommendNext } from "@/domain/recommend";
import type { Activity, LearnerRecord } from "@/domain/types";
import { t } from "@/i18n/en";
import { useI18n } from "@/i18n";
import { isArabic } from "@/i18n/core";
import { playSfx } from "@/components/sfx";
import { SkillGlyph, SkillRing, skillHue } from "@/components/SkillRing";
import { Badge, Frame, Kbd, LinkButton, Notice, cn } from "@/components/ui";
import { useApp, type PathView } from "@/state/AppState";
import { AccessBadge } from "./PathCard";

const COLUMNS = [
  { id: "inbox", label: "Inbox", hue: "#a3a2b3", Icon: Inbox },
  { id: "progress", label: "In progress", hue: "#7b6cff", Icon: Clock },
  { id: "reopened", label: "Reopened", hue: "#ff7d5c", Icon: RotateCcw },
  { id: "shipped", label: "Shipped", hue: "#5ee0a8", Icon: Check },
] as const;

type Column = (typeof COLUMNS)[number]["id"];

const NOTE_ICONS: { Icon: LucideIcon; bg: string }[] = [
  { Icon: BookOpen, bg: "#c9c3ff" },
  { Icon: CircleHelp, bg: "#5cc8ff" },
  { Icon: Search, bg: "#ffc94d" },
  { Icon: Undo2, bg: "#5ee0a8" },
  { Icon: ShieldCheck, bg: "#ff7d5c" },
];

const CORNERS = ["-start-1.5 -top-1.5", "-end-1.5 -top-1.5", "-start-1.5 -bottom-1.5", "-end-1.5 -bottom-1.5"];

const TEMPLATE = { "design-bench": "Design Bench", critique: "Critique", decision: "Decision Scenario" } as const;

export function PathOverview({ view, learner, preview, onMoveToLatest }: { view: PathView; learner: LearnerRecord; preview?: boolean; onMoveToLatest?: () => void }) {
  const { tr, L, locale } = useI18n();
  const router = useRouter();
  const { state } = useApp();
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
  const columnOf = (a: Activity): Column => {
    if (learner.drafts[a.id]) return "progress";
    const attempts = view.pathAttempts.filter((x) => x.activityId === a.id);
    if (!attempts.length) return "inbox";
    return attempts[attempts.length - 1].evaluation.skills.every((s) => s.met) ? "shipped" : "reopened";
  };


  const [selId, setSelId] = useState<string>();
  const defaultSel = draftActivity ?? recActivity ?? firstSample ?? bundle.activities[0];
  const selected = bundle.activities.find((a) => a.id === selId) ?? defaultSel;
  const selColumn = selected ? columnOf(selected) : "inbox";
  const selCta = selColumn === "shipped" ? tr("Replay") : selColumn === "reopened" ? tr("Fix the ticket") : selColumn === "progress" ? tr("Resume") : tr("Open brief");
  const selHref = selected ? `${base}/practice/${selected.id}` : undefined;
  useEffect(() => {
    if (!selHref) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.metaKey && !e.ctrlKey && !e.altKey && e.target === document.body) router.push(selHref);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selHref, router]);

  const index = state.catalog.order.indexOf(meta.id);
  const pathCode = `SP-${String(Math.max(0, index) + 1).padStart(2, "0")}`;
  const codeOf = (a: Activity) => `BR-${String(bundle.activities.indexOf(a) + 1).padStart(2, "0")}`;
  const chipsOf = (a: Activity) => skillsAssessedBy(a, bundle.skills).map((id) => {
    const i = bundle.skills.findIndex((s) => s.id === id);
    return { id, i, name: bundle.skills[i]?.name ?? id };
  });
  const sep = isArabic(locale) ? "، " : ", ";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <nav aria-label={tr("Breadcrumb")} className="flex items-center gap-3.5 font-mono text-[13px] text-muted">
        <Link href={preview ? "/admin/paths" : "/"} aria-label={preview ? tr("Paths") : tr("Back to HQ")} className="press flex h-10 w-10 items-center justify-center rounded-[10px] border border-line text-[#d4d3de]">
          <ChevronLeft size={18} aria-hidden />
        </Link>
        <span>
          {preview ? tr("Paths") : tr("HQ")} / <span className="text-fg">{pathCode}</span>
        </span>
      </nav>

      {/* Path hero with the skill rings */}
      <Frame name={`${pathCode} · ${isPreviewPath ? tr("Sample") : tr("Specialism")}`} tagClassName="text-accent" className="mt-10">
        <section aria-labelledby="path-title" className="flex flex-wrap items-center gap-[30px] rounded-[28px] bg-brand p-6 sm:p-[30px]">
          <div className="min-w-0 flex-1 basis-72 text-white">
            <div className="mb-3 flex flex-wrap gap-2">
              <AccessBadge view={view} access={learner.access} />
              {view.enrolledVersion && view.enrolledVersion < view.latestVersion && !preview && <Badge tone="ai">{tr("Your enrollment: version {n}", { n: view.enrolledVersion })}</Badge>}
            </div>
            <h1 id="path-title" className="mb-3.5 text-[34px] font-extrabold leading-none tracking-[-0.03em] sm:text-[44px]">{meta.title}</h1>
            <p className="mb-3 max-w-xl text-sm leading-relaxed text-[#e4e0ff]">{meta.summary}</p>
            {!isPreviewPath && (
              <div className="flex items-center gap-2.5 font-semibold">
                <Trophy size={20} className="shrink-0 text-sk-amber" aria-hidden />
                {view.completion.complete ? tr("Complete. Every required skill is Mastered.") : tr("Complete when all {n} skills are Mastered", { n: bundle.requiredSkillIds.length })}
              </div>
            )}
            <p className="mt-2.5 font-mono text-xs text-[#dcd8ff]">
              {meta.topic} · {L(meta.level)} · {tr("about {n} hours (estimate; varies)", { n: meta.estimatedHours })}
              {bundle.activities.length > 0 && <> · {bundle.activities.length === 1 ? tr("1 activity") : tr("{n} activities", { n: bundle.activities.length })}</>}
            </p>
            {primary && (
              <div className="mt-5 flex flex-wrap gap-2">
                <LinkButton href={primary.href} variant="primary" size="lg" className="!h-auto max-w-full !whitespace-normal !bg-white py-3 text-start !text-[#2b2370] hover:!bg-[#eeedff]">
                  <Play size={16} fill="currentColor" aria-hidden /> {primary.label}
                </LinkButton>
                {bundle.explore.length > 0 && !explainFirst && (
                  <LinkButton href={`${base}/explore/${bundle.explore[0].id}`} size="lg" className="!border-white/40 !bg-white/10 !text-white hover:!bg-white/20">
                    <BookOpen size={18} aria-hidden /> {tr("Explore first")}
                  </LinkButton>
                )}
                {explainFirst && firstSample && (
                  <LinkButton href={`${base}/practice/${firstSample.id}`} size="lg" className="!border-white/40 !bg-white/10 !text-white hover:!bg-white/20">
                    {tr("Go straight to practice")}
                  </LinkButton>
                )}
              </div>
            )}
            {!isPreviewPath && !preview && <p className="mt-3 max-w-xl text-xs text-[#dcd8ff]">{tr("You don’t need to finish Explore before practising. If you already know the topic, go straight to practice.")}</p>}
            {!isPreviewPath && (
              <p className="mt-3 max-w-xl text-xs text-[#dcd8ff]">
                {tr(t.rule.short)} {!view.completion.complete && tr("Lessons viewed and activities attempted don’t complete a path on their own.")}{" "}
                {!preview && (
                  <Link href={`${base}/skills`} className="font-semibold text-white underline underline-offset-2 hover:text-white">
                    {tr("See evidence by skill")}
                  </Link>
                )}
              </p>
            )}
          </div>

          {!isPreviewPath ? (
            <ul aria-label={tr("Skills you will demonstrate")} className="grid min-w-0 flex-1 basis-[420px] grid-cols-2 gap-3 sm:grid-cols-4">
              {bundle.skills.map((s, i) => {
                const p = view.progress[s.id];
                const met = p ? Math.min(p.contextsMet.length, p.requiredContexts) : 0;
                const mastered = p?.status === "mastered";
                const hue = skillHue(i);
                return (
                  <li key={s.id} title={s.description} className={cn("flex flex-col items-center gap-2 rounded-[20px] bg-white px-2 py-3.5 text-center text-[#17152e]", p?.practiceRecommended && "ring-2 ring-sk-coral ring-offset-2 ring-offset-brand")}>
                    {p && <SkillRing index={i} progress={p} size={72} tone="light" animateIn />}
                    <span className="text-sm font-bold">{s.name}</span>
                    <span
                      className="rounded-full px-2.5 py-[3px] font-mono text-[11px] font-semibold"
                      style={{ background: mastered ? hue : p?.practiceRecommended ? "#ffe3dc" : "#f1effc", color: mastered ? "#101014" : p?.practiceRecommended ? "#8a2f18" : "#5a5680" }}
                    >
                      {mastered ? tr("Mastered") : p?.practiceRecommended ? tr("Practise again") : met > 0 && p ? tr("{n} of {m}", { n: met, m: p.requiredContexts }) : tr("Not yet")}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Notice tone="warn" icon={<Info size={16} />} title={tr(t.access.notIncluded)} className="min-w-0 flex-1 basis-72">
              {tr("This path has an overview and one free sample activity in the prototype. Explore lessons and the remaining activities are not included.")}
            </Notice>
          )}
        </section>
      </Frame>

      {view.enrolledVersion && view.enrolledVersion < view.latestVersion && !preview && (
        <Notice tone="ai" className="mt-6" title={tr("Version {n} of this path has been published", { n: view.latestVersion })} action={onMoveToLatest && <button type="button" onClick={onMoveToLatest} className="text-sm font-medium text-accent hover:underline">{tr("Move my enrollment to version {n}", { n: view.latestVersion })}</button>}>
          {tr("You are enrolled on version {n}, so your activities stay as they were when you started. Your attempts keep the version they were assessed against and are not re-evaluated. New enrollments use the latest version.", { n: view.enrolledVersion ?? 0 })}
        </Notice>
      )}

      <div className="mt-12 flex flex-wrap items-start gap-x-6 gap-y-12">
        {/* Board */}
        {bundle.activities.length > 0 && (
          <section aria-label={tr("Interactive practice")} className="-mx-4 flex min-w-0 snap-x gap-3.5 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:flex-[999_1_640px] sm:grid-cols-[repeat(auto-fit,minmax(190px,1fr))] sm:overflow-visible sm:px-0 sm:pb-0">
            {COLUMNS.map((col) => {
              const items = bundle.activities.filter((a) => columnOf(a) === col.id);
              return (
                <div key={col.id} role="group" aria-label={tr(col.label)} className="flex w-[78vw] shrink-0 snap-start flex-col gap-3 rounded-[20px] border border-[#24242d] bg-[#15151a] p-3 sm:w-auto">
                  <h3 className="flex items-center gap-2 px-1 py-0.5 text-sm font-semibold">
                    <col.Icon size={16} strokeWidth={2.2} style={{ color: col.hue }} aria-hidden />
                    {tr(col.label)}
                    <span className="ms-auto font-mono text-xs text-muted">{items.length}</span>
                  </h3>
                  {items.length === 0 && <p className="rounded-2xl border border-dashed border-line-strong px-3 py-4 text-center text-xs text-subtle">{tr("Nothing here")}</p>}
                  <div className="-m-1.5 flex max-h-[620px] flex-col gap-3 overflow-y-auto p-1.5">
                  {items.map((a) => {
                    const on = selected?.id === a.id;
                    const locked = !view.canAccess(a.id) && !meta.freeSampleActivityIds.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => {
                          playSfx(on ? "undo" : "pick");
                          setSelId(a.id);
                        }}
                        className={cn(
                          "press relative flex w-full flex-col gap-2.5 rounded-2xl border-[1.5px] p-3.5 text-start",
                          on ? "border-brand-strong bg-[#202028]" : col.id === "reopened" ? "border-[#5a3328] bg-[#1b1b21]" : "border-line bg-[#1b1b21]",
                          col.id === "shipped" && !on && "opacity-80",
                        )}
                      >
                        {on && CORNERS.map((c) => <span key={c} aria-hidden className={cn("absolute h-[9px] w-[9px] rounded-sm border-[1.5px] border-brand-strong bg-white", c)} />)}
                        <span className="flex justify-between font-mono text-[11px] text-muted"><span>{codeOf(a)}</span><span>{tr("{n} min", { n: a.estimatedMinutes })}</span></span>
                        <span className="font-display text-[17px] font-extrabold leading-[1.15] text-fg">{a.title}</span>
                        <span className="flex items-center gap-[5px]">
                          {chipsOf(a).map((c) => (
                            <span key={c.id} title={c.name} className="flex h-6 w-6 items-center justify-center rounded-lg text-[#101014]" style={{ background: skillHue(c.i) }}>
                              <SkillGlyph index={c.i} size={13} strokeWidth={2.4} />
                              <span className="sr-only">{c.name}</span>
                            </span>
                          ))}
                          {locked && <Lock size={15} className="ms-auto text-[#6f6e7f]" aria-label={tr("Subscription")} role="img" />}
                        </span>
                      </button>
                    );
                  })}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Detail and field notes */}
        <aside className="flex min-w-0 flex-[1_1_290px] flex-col gap-10">
          {selected && selHref && (
            <Frame name={`${codeOf(selected)} · ${tr("selected")}`} tagClassName="text-accent">
              <div key={selected.id} aria-live="polite" className="slide-in flex flex-col gap-4 rounded-[22px] border-[1.5px] border-brand-strong bg-surface p-[22px]">
                <h2 className="font-display text-[26px] font-extrabold leading-[1.05]">{selected.title}</h2>
                <div className="flex items-end gap-2">
                  <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-sk-amber text-xs font-bold text-[#2b1f00]" aria-hidden>{(selected.brief?.from ?? selected.contextLabel).trim()[0]}</span>
                  <span className="line-clamp-3 rounded-[14px] rounded-es-sm bg-overlay px-3 py-[9px] text-sm leading-snug">{selected.brief?.ask ?? selected.task}</span>
                </div>
                <p className="font-mono text-[11px] text-muted">{selected.contextLabel} · {tr(TEMPLATE[selected.template])} · {tr("{n} min", { n: selected.estimatedMinutes })}</p>
                <div className="flex flex-wrap gap-1.5">
                  {chipsOf(selected).map((c) => (
                    <span key={c.id} className="inline-flex items-center gap-[5px] rounded-full bg-[#202028] px-2.5 py-1 text-xs font-semibold" style={{ color: skillHue(c.i) }}>
                      <SkillGlyph index={c.i} size={13} strokeWidth={2.2} />
                      {c.name}
                    </span>
                  ))}
                  {selected.kind === "alternative" && <Badge>{tr("Alternative")}</Badge>}
                  {meta.freeSampleActivityIds.includes(selected.id) ? <Badge tone="accent" icon={<Gift size={11} aria-hidden />}>{tr(t.access.free)}</Badge> : !view.canAccess(selected.id) ? <Badge icon={<Lock size={11} aria-hidden />}>{tr("Subscription")}</Badge> : null}
                </div>
                <Link href={selHref} className="press flex items-center justify-between rounded-[14px] bg-brand-strong px-4 py-3.5 font-bold text-white hover:text-white">
                  <span className="flex items-center gap-2.5"><Play size={16} fill="currentColor" aria-hidden />{selCta}</span>
                  <Kbd className="border-white/45 py-px text-xs text-white">↵</Kbd>
                </Link>
              </div>
            </Frame>
          )}

          {bundle.explore.length > 0 && (
            <Frame name={`${tr("Field notes")} · ${tr("optional")}`} tagClassName="text-muted">
              <section id="field-notes" aria-label={tr("Field notes")} className="scroll-mt-24">
                <ol className="flex flex-col gap-2">
                  {bundle.explore.map((c, i) => {
                    const viewed = !!learner.viewedConcepts[c.id];
                    const locked = !view.canAccessConcept(c);
                    const { Icon, bg } = NOTE_ICONS[i % NOTE_ICONS.length];
                    return (
                      <li key={c.id}>
                        <Link href={`${base}/explore/${c.id}`} className="press flex items-center gap-3 rounded-[14px] border border-line bg-surface px-3 py-2.5 text-sm text-fg hover:text-fg">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[#101014]" style={{ background: bg }} aria-hidden>
                            <Icon size={16} strokeWidth={2.2} />
                          </span>
                          <span className="min-w-0 flex-1 font-medium">{c.title}</span>
                          <span className="font-mono text-[11px] text-muted">{tr("{n} min", { n: c.readingMinutes })}</span>
                          {viewed ? <Check size={16} strokeWidth={2.4} className="text-ok" role="img" aria-label={tr("Viewed")} /> : c.freeSample ? <span className="font-mono text-[11px] text-accent">{tr("Free")}</span> : locked ? <Lock size={14} className="text-subtle" role="img" aria-label={tr("Subscription")} /> : null}
                        </Link>
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-2 text-xs text-subtle">{tr("Lesson views are tracked separately and do not count as skill evidence.")}</p>
              </section>
            </Frame>
          )}
        </aside>
      </div>

      {isPreviewPath && meta.plannedModules && (
        <Frame name={tr("Planned content")} className="mt-12" tagClassName="text-muted">
          <section aria-label={tr("Planned content")}>
            <p className="mb-3 text-xs text-subtle">{tr(t.access.notIncluded)}</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {meta.plannedModules.map((m) => (
                <li key={m} className="flex items-center gap-2 rounded-lg border border-dashed border-line-strong px-3 py-2.5 text-sm text-muted">
                  <Circle size={12} aria-hidden /> {m} <span className="ms-auto text-xs text-subtle">{tr("Not included")}</span>
                </li>
              ))}
            </ul>
          </section>
        </Frame>
      )}

      <Frame name={tr("About this path")} className="mt-12" tagClassName="text-muted">
        <section aria-label={tr("About this path")} className="grid gap-8 rounded-[22px] border border-line bg-surface p-6 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-fg">{tr("You will be able to")}</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-muted">
              {meta.outcomes.map((o) => (
                <li key={o} className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-subtle" aria-hidden /> {o}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-fg">{tr("Who it’s for")}</h3>
            <p className="mt-1 text-sm text-muted">{meta.audience}</p>
            <h3 className="mt-5 text-sm font-semibold text-fg">{tr("Recommended prior knowledge")}</h3>
            <p className="mt-1 text-sm text-muted">{meta.prerequisites}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-fg">{tr("Free sample boundaries")}</h3>
            <p className="mt-1 text-sm text-muted">
              {tr("Free without a subscription: {list}.", { list: freeList.join(sep) || tr("none") })}
              {!isPreviewPath && " " + tr("Everything else in this path is included with the subscription. Evidence from free samples is kept if you subscribe.")}
            </p>
          </div>
        </section>
      </Frame>
    </div>
  );
}
