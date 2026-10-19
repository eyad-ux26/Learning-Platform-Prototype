"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, BookOpen, CheckCircle2, Clock, HelpCircle, Lightbulb, Lock, RotateCcw, Save, Send } from "lucide-react";
import { checkCompleteness, emptyResponse, evaluate, skillsAssessedBy } from "@/domain/assessment";
import type { Activity, ActivityResponse, Attempt, Evaluation, WorkDraft } from "@/domain/types";
import { t } from "@/i18n/en";
import { useApp, type PathView } from "@/state/AppState";
import { Badge, Button, Dialog, LinkButton, Notice, Tabs, cn } from "@/components/ui";
import { SkillStatusBadge } from "@/components/SkillStatus";
import { SkillRing } from "@/components/SkillRing";
import { playSfx } from "@/components/sfx";
import { DesignBenchControls, DesignBenchStage } from "./DesignBench";
import { CritiqueControls, CritiqueStage } from "./Critique";
import { DecisionControls, DecisionStage } from "./Decision";
import { FeedbackPanel } from "./Feedback";
import { behavioursFor, initialPreviewState, type PreviewState } from "./ProposalPreview";

const TEMPLATE_LABEL = { "design-bench": "Design Bench", critique: "Critique a Design", decision: "Decision Scenario" } as const;
const HOW_IT_WORKS = {
  "design-bench": "Choose one option for each design decision. The preview updates as you choose, and you can use it as a user would. Several combinations can meet the criteria; each option has tradeoffs.",
  critique: "Review every numbered element. Mark each as acceptable or problematic and choose the main reason. Both the judgement and the reason are assessed. Notes are saved but not assessed.",
  decision: "Work through the scenario. Each decision leads to consequences and a follow-up. You can change an earlier decision before submitting.",
} as const;

type Section = "brief" | "controls" | "stage" | "feedback";

export function Workspace({ view, activity, mode, backHref }: { view: PathView; activity: Activity; mode: "learner" | "preview"; backHref: string }) {
  const { learner, dispatch, submit } = useApp();
  const router = useRouter();
  const version = view.version.version;
  const saved = mode === "learner" ? learner.drafts[activity.id] : undefined;
  const usableDraft = saved && saved.contentVersion === version && saved.response.template === activity.template ? saved : undefined;

  const [response, setResponse] = useState<ActivityResponse>(() => usableDraft?.response ?? emptyResponse(activity));
  const [ui, setUi] = useState<Record<string, unknown>>(() => usableDraft?.ui ?? {});
  const [hintsShown, setHintsShown] = useState(() => (usableDraft?.hintsUsed ? 1 : 0));
  const [solutionRevealed, setSolutionRevealed] = useState(() => !!usableDraft?.solutionRevealed);
  const [phase, setPhase] = useState<"working" | "feedback">("working");
  const [result, setResult] = useState<{ attempt?: Attempt; evaluation: Evaluation } | null>(null);
  const [missing, setMissing] = useState<string[] | null>(null);
  const [section, setSection] = useState<Section>(usableDraft ? "controls" : "brief");
  const [helpOpen, setHelpOpen] = useState(false);
  const [confirmReveal, setConfirmReveal] = useState(false);
  const [confirmHint, setConfirmHint] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [savedAt, setSavedAt] = useState<string | undefined>(usableDraft?.updatedAt);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const hintsUsed = hintsShown > 0;

  // Record enrollment and where the learner is, for "Continue learning".
  useEffect(() => {
    if (mode !== "learner") return;
    const now = new Date().toISOString();
    dispatch({ type: "enroll", pathId: view.bundle.meta.id, version, now });
    dispatch({ type: "setLocation", href: `/paths/${view.bundle.meta.id}/practice/${activity.id}`, label: activity.title, now });
  }, [mode, activity.id, activity.title, view.bundle.meta.id, version, dispatch]);

  // Autosave unfinished work locally (learner mode only).
  const persist = useCallback(
    (next: { response?: ActivityResponse; ui?: Record<string, unknown>; hintsUsed?: boolean; solutionRevealed?: boolean }) => {
      if (mode !== "learner") return;
      const now = new Date().toISOString();
      const draft: WorkDraft = {
        activityId: activity.id,
        contentVersion: version,
        response: next.response ?? response,
        ui: next.ui ?? ui,
        hintsUsed: next.hintsUsed ?? hintsUsed,
        solutionRevealed: next.solutionRevealed ?? solutionRevealed,
        updatedAt: now,
      };
      dispatch({ type: "saveWork", draft });
      setSavedAt(now);
    },
    [mode, activity.id, version, response, ui, hintsUsed, solutionRevealed, dispatch],
  );

  const updateResponse = (r: ActivityResponse, uiPatch?: Record<string, unknown>) => {
    setResponse(r);
    const nextUi = uiPatch ? { ...ui, ...uiPatch } : ui;
    if (uiPatch) setUi(nextUi);
    setMissing(null);
    persist({ response: r, ui: nextUi });
  };
  const updateUi = (patch: Record<string, unknown>) => {
    const nextUi = { ...ui, ...patch };
    setUi(nextUi);
    persist({ ui: nextUi });
  };

  // ---------- Template wiring ----------
  const preview = useMemo<PreviewState | undefined>(() => {
    if (activity.template !== "design-bench" || response.template !== "design-bench") return undefined;
    return (ui.preview as PreviewState | undefined) ?? initialPreviewState(activity, behavioursFor(activity, response.selections));
  }, [activity, response, ui.preview]);

  let controls: React.ReactNode = null;
  let stage: React.ReactNode = null;
  let controlsLabel = "Your response";
  const readOnly = phase === "feedback";
  const evaluation = phase === "feedback" ? result?.evaluation : undefined;

  if (activity.template === "design-bench" && response.template === "design-bench") {
    controlsLabel = "Decisions";
    const onSelect = (decisionId: string, optionId: string) => {
      const selections = { ...response.selections, [decisionId]: optionId };
      const fresh = initialPreviewState(activity, behavioursFor(activity, selections));
      updateResponse({ template: "design-bench", selections }, { preview: { ...fresh, sourceOpen: preview?.sourceOpen } });
    };
    controls = <DesignBenchControls activity={activity} selections={response.selections} onSelect={onSelect} readOnly={readOnly} evaluation={evaluation} />;
    stage = <DesignBenchStage activity={activity} selections={response.selections} preview={preview!} onPreview={(s) => updateUi({ preview: s })} readOnly={false} />;
  } else if (activity.template === "critique" && response.template === "critique") {
    controlsLabel = "Review";
    const selected = (ui.selected as string | undefined) ?? undefined;
    const onSelect = (id: string) => {
      updateUi({ selected: id });
      setSection((s) => (s === "stage" ? "controls" : s));
    };
    const onReview = (id: string, patch: (typeof response.reviews)[string]) => updateResponse({ template: "critique", reviews: { ...response.reviews, [id]: patch } });
    controls = <CritiqueControls activity={activity} reviews={response.reviews} selected={selected} onSelect={onSelect} onReview={onReview} readOnly={readOnly} evaluation={evaluation} />;
    stage = <CritiqueStage activity={activity} reviews={response.reviews} selected={selected} onSelect={onSelect} evaluation={evaluation} />;
  } else if (activity.template === "decision" && response.template === "decision") {
    controlsLabel = "Decisions";
    controls = <DecisionControls activity={activity} choices={response.choices} onChoices={(choices) => updateResponse({ template: "decision", choices })} readOnly={readOnly} />;
    stage = <DecisionStage activity={activity} choices={response.choices} />;
  }

  // ---------- Actions ----------
  const doSubmit = () => {
    const c = checkCompleteness(activity, response);
    if (!c.complete) {
      setMissing(c.missing);
      setSection("controls");
      return;
    }
    if (mode === "learner") {
      const attempt = submit({ bundle: view.bundle, version, activity, response, hintsUsed, solutionRevealed });
      playSfx(attempt.evaluation.skills.every((x) => x.met) ? "ship" : "reopen");
      setResult({ attempt, evaluation: attempt.evaluation });
    } else {
      setResult({ evaluation: evaluate(activity, response, view.bundle.skills) });
    }
    setPhase("feedback");
    setSection("feedback");
    window.scrollTo({ top: 0, behavior: "smooth" });
    requestAnimationFrame(() => document.getElementById("feedback-heading")?.focus());
  };

  const retry = () => {
    setPhase("working");
    setResult(null);
    setSection("controls");
    // A new attempt starts unassisted unless help is used again.
    setHintsShown(0);
    setSolutionRevealed(false);
    persist({ hintsUsed: false, solutionRevealed: false });
  };

  const reset = () => {
    const r = emptyResponse(activity);
    setResponse(r);
    setUi({});
    setMissing(null);
    setPhase("working");
    setResult(null);
    if (mode === "learner") dispatch({ type: "discardWork", activityId: activity.id });
    setSavedAt(undefined);
    setConfirmReset(false);
  };

  const showHint = () => {
    setHintsShown((n) => Math.min(activity.hints.length, n + 1));
    persist({ hintsUsed: true });
    setConfirmHint(false);
  };

  const reveal = () => {
    setSolutionRevealed(true);
    persist({ solutionRevealed: true });
    setConfirmReveal(false);
  };

  // ---------- Layout ----------
  const skillIds = skillsAssessedBy(activity, view.bundle.skills);
  const tabs: { id: Section; label: string }[] = [
    { id: "brief", label: "Brief" },
    { id: "controls", label: controlsLabel },
    { id: "stage", label: activity.template === "decision" ? "Situation" : "Interface" },
    ...(phase === "feedback" ? [{ id: "feedback" as const, label: "Feedback" }] : []),
  ];
  const lastAttempt = mode === "learner" ? [...view.pathAttempts].reverse().find((a) => a.activityId === activity.id) : undefined;

  const brief = (
    <div className="space-y-4">
      <div className="rounded-[22px] border-[1.5px] border-brand-strong bg-surface p-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sk-amber text-sm font-bold text-[#2b1f00]" aria-hidden>{activity.contextLabel.trim()[0]}</span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-fg">Client brief</p>
            <p className="font-mono text-[11px] text-subtle">{activity.contextLabel}</p>
          </div>
        </div>
        <p className="mt-3 rounded-2xl rounded-es-sm bg-overlay p-3 text-sm leading-relaxed text-fg">{activity.scenario}</p>
        <p className="mt-2 ms-auto w-fit rounded-2xl rounded-ee-sm bg-brand px-3 py-2 text-sm font-semibold text-white">{activity.task}</p>
      </div>
      <details className="group rounded-2xl border border-line bg-surface">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-mono text-xs font-semibold text-accent">
          Constraints ({activity.constraints.length})
          <span aria-hidden className="transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <ul className="list-disc space-y-1 px-4 pb-3 ps-8 text-sm text-muted">
          {activity.constraints.map((c) => <li key={c}>{c}</li>)}
        </ul>
      </details>
      <div>
        <p className="font-mono text-xs font-semibold text-accent">{t.practice.targetSkills}</p>
        <ul className="mt-2 space-y-2">
          {skillIds.map((id) => {
            const idx = Math.max(0, view.bundle.skills.findIndex((s) => s.id === id));
            const skill = view.bundle.skills[idx];
            const p = view.progress[id];
            const contextUsed = p?.contextsMet.some((c) => c.contextKey === activity.contextKey);
            return (
              <li key={id} className="rounded-2xl border border-line bg-surface p-3">
                <div className="flex items-start gap-3">
                  {mode === "learner" && p ? <SkillRing index={idx} progress={p} size={44} /> : null}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-snug text-fg">{skill.name}</p>
                    {mode === "learner" && p && <SkillStatusBadge status={p.status} className="mt-1.5" />}
                  </div>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-subtle hover:text-fg">What is assessed</summary>
                  <ul className="mt-1.5 space-y-0.5 text-xs text-muted">
                    {skill.criteria.filter((c) => activity.criteria.includes(c.id)).map((c) => <li key={c.id}>• {c.statement}</li>)}
                  </ul>
                </details>
                {mode === "learner" && contextUsed && <p className="mt-1.5 text-xs text-subtle">Already met in this context. Retrying is good practice but won’t add a new context.</p>}
              </li>
            );
          })}
        </ul>
      </div>
      {lastAttempt && phase === "working" && (
        <p className="text-xs text-subtle">
          Last submitted {new Date(lastAttempt.submittedAt).toLocaleString()} ·{" "}
          <button type="button" className="text-accent hover:underline" onClick={() => { setResult({ attempt: lastAttempt, evaluation: lastAttempt.evaluation }); setResponse(lastAttempt.response); setPhase("feedback"); setSection("feedback"); }}>
            view that feedback
          </button>
        </p>
      )}
    </div>
  );

  const sig = JSON.stringify(response).length;
  // < lg: one section at a time. lg: Brief alone, or response + interface side by side. xl: all three columns.
  const vis = (s: Section) => (section === s ? "block" : "hidden");
  const work = section !== "brief" ? "lg:block" : "";

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-28 pt-4 sm:px-6 lg:pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3">
        <Link href={backHref} className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted hover:text-fg" aria-label="Back">
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-accent">
            <span>{TEMPLATE_LABEL[activity.template]}</span>
            <span aria-hidden>·</span>
            <span>{activity.contextLabel}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden /> about {activity.estimatedMinutes} min</span>
            {view.bundle.meta.freeSampleActivityIds.includes(activity.id) && <Badge tone="accent">{t.access.free}</Badge>}
            {activity.kind === "alternative" && <Badge>Alternative practice</Badge>}
            {mode === "preview" && <Badge tone="ai">Admin preview · v{version}</Badge>}
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-fg sm:text-3xl">{activity.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {mode === "learner" && (
            <span className="hidden items-center gap-1.5 text-xs text-subtle md:inline-flex" aria-live="polite">
              <CheckCircle2 size={13} aria-hidden /> {savedAt ? t.practice.savedLocally : "Not started"}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={() => setHelpOpen(true)} aria-haspopup="dialog">
            <HelpCircle size={15} aria-hidden /> {t.practice.help}
          </Button>
        </div>
      </div>

      {(hintsUsed || solutionRevealed) && phase === "working" && (
        <p className="mt-3 text-xs text-warn">
          {solutionRevealed ? "Solution revealed: this attempt will be practice-only." : "Hint used: this attempt will count, but not as independent."}
        </p>
      )}

      {/* Mobile and tablet section tabs */}
      <div className="sticky top-16 z-30 -mx-4 mt-4 bg-canvas/95 px-4 py-2 xl:hidden">
        <Tabs label="Workspace sections" tabs={tabs} value={section} onChange={setSection} />
      </div>

      <div className={cn("mt-4 grid gap-6", "lg:grid-cols-[minmax(320px,400px)_1fr] xl:grid-cols-[300px_minmax(340px,400px)_1fr]")}>
        <aside className={cn(vis("brief"), "lg:col-span-2 xl:col-span-1 xl:block")} aria-label="Brief">
          <div className="xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto xl:pe-1"><ColumnTag n={1} pulse={phase === "working" && !hintsUsed}>Read first</ColumnTag>{brief}</div>
        </aside>

        <section className={cn(phase === "feedback" ? vis("feedback") : vis("controls"), work, "xl:block")} aria-label={phase === "feedback" ? "Feedback" : controlsLabel}>
          <ColumnTag n={2}>{phase === "feedback" ? "Ship review" : controlsLabel}</ColumnTag>
          {phase === "feedback" && result ? (
            <div ref={feedbackRef}>
              <FeedbackPanel view={view} activity={activity} attempt={result.attempt} evaluation={result.evaluation} mode={mode} onRetry={retry} />
            </div>
          ) : (
            <div className="space-y-4">
              {missing && (
                <Notice tone="warn" title={t.practice.incomplete}>
                  <ul className="list-disc space-y-0.5 ps-4">
                    {missing.slice(0, 6).map((m) => <li key={m}>{m}</li>)}
                    {missing.length > 6 && <li>and {missing.length - 6} more</li>}
                  </ul>
                </Notice>
              )}
              {controls}
            </div>
          )}
        </section>

        <section className={cn(vis("stage"), work, "xl:block")} aria-label="Interface">
          <div className="lg:sticky lg:top-20">
            <ColumnTag n={3}>Live</ColumnTag>
            <div className="relative p-3">
              <span key={sig} aria-hidden className="sel-snap pointer-events-none absolute inset-0 z-10 hidden rounded-[22px] outline outline-2 outline-offset-4 outline-brand-strong/70 lg:block" />
              {stage}
            </div>
            {phase === "feedback" && activity.template === "critique" && <div className="mt-4">{controls}</div>}
          </div>
        </section>
      </div>

      {/* Action bar */}
      {phase === "working" && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 backdrop-blur lg:static lg:mt-8 lg:border-0 lg:bg-transparent">
          <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-4 py-3 sm:px-6 lg:justify-end lg:px-0">
            <Button variant="ghost" onClick={() => setConfirmReset(true)}>
              <RotateCcw size={15} aria-hidden /> <span className="hidden sm:inline">{t.practice.reset}</span>
            </Button>
            {mode === "learner" && (
              <Button variant="secondary" onClick={() => { persist({}); router.push(backHref); }}>
                <Save size={15} aria-hidden /> <span className="hidden sm:inline">{t.practice.saveExit}</span><span className="sm:hidden">Save</span>
              </Button>
            )}
            <Button variant="primary" onClick={doSubmit} className="ms-auto lg:ms-0">
              <Send size={15} aria-hidden /> {t.practice.submit} <span className="ms-1 hidden rounded-md bg-black/20 px-1.5 font-mono text-[11px] sm:inline" aria-hidden>↵</span>
            </Button>
          </div>
        </div>
      )}

      {/* Help */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen} title="Help for this activity" wide>
        <div className="space-y-5 text-sm">
          <section>
            <h3 className="font-semibold text-fg">How this activity works</h3>
            <p className="mt-1 text-muted">{HOW_IT_WORKS[activity.template]}</p>
          </section>
          <section>
            <h3 className="font-semibold text-fg">How evidence counts</h3>
            <p className="mt-1 text-muted">{t.rule.short}</p>
          </section>
          <section>
            <h3 className="font-semibold text-fg">Related explanations</h3>
            <ul className="mt-1 space-y-1">
              {activity.relatedConcepts.map((id) => {
                const c = view.bundle.explore.find((x) => x.id === id);
                if (!c) return null;
                const href = mode === "learner" ? `/paths/${view.bundle.meta.id}/explore/${c.id}?from=${activity.id}` : undefined;
                return (
                  <li key={id}>
                    {href ? (
                      <Link href={href} onClick={() => persist({})} className="inline-flex items-center gap-1.5 text-accent hover:underline">
                        <BookOpen size={14} aria-hidden /> {c.title}
                      </Link>
                    ) : (
                      <span className="text-muted">{c.title}</span>
                    )}
                  </li>
                );
              })}
              {activity.relatedConcepts.length === 0 && <li className="text-muted">No Explore content is included for this sample.</li>}
            </ul>
            <p className="mt-1 text-xs text-subtle">Your response is saved, and the explanation links back here. Reading does not affect how this attempt counts.</p>
          </section>
          <section>
            <h3 className="font-semibold text-fg">Hints</h3>
            {hintsShown > 0 ? (
              <ol className="mt-1 list-decimal space-y-1 ps-5 text-muted">
                {activity.hints.slice(0, hintsShown).map((h) => <li key={h}>{h}</li>)}
              </ol>
            ) : (
              <p className="mt-1 text-muted">Hints are available. Using one means this attempt still counts as evidence, but not as an independent attempt.</p>
            )}
            {hintsShown < activity.hints.length && (
              <Button size="sm" className="mt-2" onClick={() => (hintsShown === 0 ? setConfirmHint(true) : showHint())}>
                <Lightbulb size={14} aria-hidden /> {hintsShown === 0 ? t.practice.showHint : "Show another hint"}
              </Button>
            )}
          </section>
          <section>
            <h3 className="font-semibold text-fg">Solution</h3>
            {solutionRevealed ? (
              <p className="mt-1 rounded-lg border border-warn/30 bg-warn-bg p-3 text-fg">{activity.solution}</p>
            ) : (
              <>
                <p className="mt-1 text-muted">Revealing a solution makes this attempt practice-only: it stays in your history but does not count toward mastery.</p>
                <Button size="sm" variant="subtle" className="mt-2" onClick={() => setConfirmReveal(true)}>
                  {t.practice.revealSolution}
                </Button>
              </>
            )}
          </section>
        </div>
      </Dialog>

      <Dialog
        open={confirmHint}
        onOpenChange={setConfirmHint}
        title="Use a hint?"
        description="This attempt will still count as evidence, but not as an independent attempt. Each skill needs at least one independent context."
        footer={<><Button variant="ghost" onClick={() => setConfirmHint(false)}>Cancel</Button><Button variant="primary" onClick={showHint}>Show hint</Button></>}
      />
      <Dialog
        open={confirmReveal}
        onOpenChange={setConfirmReveal}
        title="Reveal a solution?"
        description="This attempt will become practice-only and will not count toward mastery. You can still submit it to see feedback."
        footer={<><Button variant="ghost" onClick={() => setConfirmReveal(false)}>Cancel</Button><Button variant="primary" onClick={reveal}>Reveal solution</Button></>}
      />
      <Dialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset this activity?"
        description="Your unfinished response for this activity will be cleared. Submitted attempts stay in your history."
        footer={<><Button variant="ghost" onClick={() => setConfirmReset(false)}>Cancel</Button><Button variant="danger" onClick={reset}>Reset response</Button></>}
      />
    </div>
  );
}

function ColumnTag({ n, children, pulse }: { n: number; children: React.ReactNode; pulse?: boolean }) {
  return (
    <p className="mb-3 hidden items-center gap-2 font-mono text-xs font-semibold text-accent lg:flex">
      <span className={cn("flex h-5 w-5 items-center justify-center rounded-full bg-brand-strong text-[11px] text-white", pulse && "animate-pulse-ring")} aria-hidden>{n}</span>
      {children}
    </p>
  );
}

export function LockedActivity({ activity, pathId, returnHref }: { activity: Activity; pathId: string; returnHref: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-raised text-muted"><Lock size={20} aria-hidden /></span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-fg">{activity.title}</h1>
        <p className="mt-1 text-sm text-muted">{activity.contextLabel} · about {activity.estimatedMinutes} min</p>
        <p className="mt-4 text-sm leading-relaxed text-fg">{activity.scenario}</p>
        <Notice tone="accent" className="mt-6" title={t.access.locked}>
          This activity is part of the subscription. Free samples are marked in the path, and your progress on them is kept when you subscribe.
        </Notice>
        <div className="mt-6 flex flex-wrap gap-2">
          <LinkButton href={`/subscribe?return=${encodeURIComponent(returnHref)}`} variant="primary">Review subscription</LinkButton>
          <LinkButton href={`/paths/${pathId}`} variant="ghost">Back to path</LinkButton>
        </div>
      </div>
    </div>
  );
}
