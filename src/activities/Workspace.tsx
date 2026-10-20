"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronDown, Clock, HelpCircle, Lightbulb, Lock, RotateCcw, Save, Send } from "lucide-react";
import { checkCompleteness, emptyResponse, evaluate, skillsAssessedBy, walkDecision } from "@/domain/assessment";
import type { Activity, ActivityResponse, Attempt, DesignDimension, Evaluation, WorkDraft } from "@/domain/types";
import { t } from "@/i18n/en";
import { useI18n } from "@/i18n";
import { useApp, type PathView } from "@/state/AppState";
import { Badge, Button, Dialog, LinkButton, Notice, Tabs, cn } from "@/components/ui";
import { SkillStatusBadge } from "@/components/SkillStatus";
import { SkillRing } from "@/components/SkillRing";
import { playSfx } from "@/components/sfx";
import { DesignBenchControls, DesignBenchStage } from "./DesignBench";
import { CritiqueControls, CritiqueStage, critiqueMarks } from "./Critique";
import { DecisionControls, DecisionStage, DecisionThread } from "./Decision";
import { DockContext } from "./dock";
import { FeedbackPanel } from "./Feedback";
import { behavioursFor, initialPreviewState, type PreviewState } from "./ProposalPreview";

const TEMPLATE_LABEL = { "design-bench": "Design Bench", critique: "Critique a Design", decision: "Decision Scenario" } as const;
const HOW_IT_WORKS = {
  "design-bench": "Choose one option for each design decision. The preview updates as you choose, and you can use it as a user would. Several combinations can meet the criteria; each option has tradeoffs.",
  critique: "Review every numbered element. Mark each as acceptable or problematic and choose the main reason. Both the judgement and the reason are assessed. Notes are saved but not assessed.",
  decision: "Work through the scenario. Each decision leads to consequences and a follow-up. You can change an earlier decision before submitting.",
} as const;

/** "controls" is kept for stored state compatibility; below lg the controls live in a bottom sheet, so it maps to "stage". */
type Section = "brief" | "controls" | "stage" | "feedback";

export function Workspace({ view, activity, mode, backHref }: { view: PathView; activity: Activity; mode: "learner" | "preview"; backHref: string }) {
  const { learner, dispatch, submit } = useApp();
  const { tr, L, dateTime } = useI18n();
  const router = useRouter();
  // Assessment always runs on the stored English activity; the `activity` prop is what is displayed.
  const rawActivity = (view.rawBundle.activities.find((a) => a.id === activity.id) ?? activity) as Activity;
  const version = view.version.version;
  const saved = mode === "learner" ? learner.drafts[activity.id] : undefined;
  const usableDraft = saved && saved.contentVersion === version && saved.response.template === rawActivity.template ? saved : undefined;

  const [response, setResponse] = useState<ActivityResponse>(() => usableDraft?.response ?? emptyResponse(rawActivity));
  const [ui, setUi] = useState<Record<string, unknown>>(() => usableDraft?.ui ?? {});
  const [hintsShown, setHintsShown] = useState(() => (usableDraft?.hintsUsed ? 1 : 0));
  const [solutionRevealed, setSolutionRevealed] = useState(() => !!usableDraft?.solutionRevealed);
  const [phase, setPhase] = useState<"working" | "feedback">("working");
  const [result, setResult] = useState<{ attempt?: Attempt; evaluation: Evaluation } | null>(null);
  const [missing, setMissing] = useState<string[] | null>(null);
  const [section, setSection] = useState<Section>(usableDraft ? "stage" : "brief");
  const [helpOpen, setHelpOpen] = useState(false);
  // Shared between the controls and the live preview so the preview can show what the current question touches.
  const [benchDim, setBenchDim] = useState<DesignDimension | undefined>();
  const [pending, setPending] = useState<string | undefined>();
  const [reviewNode, setReviewNode] = useState<string | undefined>();
  const [collapsed, setCollapsed] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
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
    if (rawActivity.template !== "design-bench" || response.template !== "design-bench") return undefined;
    return (ui.preview as PreviewState | undefined) ?? initialPreviewState(rawActivity, behavioursFor(rawActivity, response.selections));
  }, [rawActivity, response, ui.preview]);

  let controls: React.ReactNode = null;
  let stage: React.ReactNode = null;
  let controlsLabel = "Your response";
  const readOnly = phase === "feedback";
  const evaluation = phase === "feedback" ? result?.evaluation : undefined;

  if (activity.template === "design-bench" && response.template === "design-bench") {
    controlsLabel = "Decisions";
    const onSelect = (decisionId: string, optionId: string) => {
      const selections = { ...response.selections, [decisionId]: optionId };
      const raw = rawActivity as typeof activity;
      const fresh = initialPreviewState(raw, behavioursFor(raw, selections));
      updateResponse({ template: "design-bench", selections }, { preview: { ...fresh, sourceOpen: preview?.sourceOpen } });
    };
    controls = <DesignBenchControls activity={activity} selections={response.selections} onSelect={onSelect} onStep={setBenchDim} readOnly={readOnly} evaluation={evaluation} />;
    stage = <DesignBenchStage activity={activity} selections={response.selections} preview={preview!} onPreview={(s) => updateUi({ preview: s })} readOnly={false} activeDimension={phase === "working" ? benchDim : undefined} />;
  } else if (activity.template === "critique" && response.template === "critique") {
    controlsLabel = "Review";
    const selected = (ui.selected as string | undefined) ?? undefined;
    const onSelect = (id: string) => {
      updateUi({ selected: id || undefined });
      // Picking an element in the preview brings up its question (the dock, below lg).
      if (id && phase === "working") setCollapsed(false);
    };
    const onReview = (id: string, patch: (typeof response.reviews)[string]) => updateResponse({ template: "critique", reviews: { ...response.reviews, [id]: patch } });
    controls = <CritiqueControls activity={activity} reviews={response.reviews} selected={selected} onSelect={onSelect} onReview={onReview} readOnly={readOnly} />;
    stage = <CritiqueStage activity={activity} reviews={response.reviews} selected={selected} onSelect={onSelect} evaluation={evaluation} />;
  } else if (activity.template === "decision" && response.template === "decision") {
    controlsLabel = "Decisions";
    controls = <DecisionControls activity={activity} choices={response.choices} onChoices={(choices) => updateResponse({ template: "decision", choices })} readOnly={readOnly} pending={pending} onPending={setPending} />;
    stage = <DecisionStage activity={activity} choices={response.choices} pending={phase === "working" ? pending : undefined} reviewNodeId={phase === "feedback" ? reviewNode : undefined} />;
  }

  // ---------- Actions ----------
  const doSubmit = () => {
    const c = checkCompleteness(rawActivity, response);
    if (!c.complete) {
      setMissing(c.missing);
      setSection("stage");
      setCollapsed(false);
      stageRef.current?.scrollTo({ top: 0 });
      return;
    }
    let ev: Evaluation;
    if (mode === "learner") {
      const attempt = submit({ bundle: view.rawBundle, version, activity: rawActivity, response, hintsUsed, solutionRevealed });
      playSfx(attempt.evaluation.skills.every((x) => x.met) ? "ship" : "reopen");
      setResult({ attempt, evaluation: attempt.evaluation });
      ev = attempt.evaluation;
    } else {
      ev = evaluate(rawActivity, response, view.rawBundle.skills);
      setResult({ evaluation: ev });
    }
    // The ship review opens on the first thing worth looking at.
    if (rawActivity.template === "critique" && response.template === "critique") {
      const marks = critiqueMarks(rawActivity, response.reviews, ev);
      const first = rawActivity.hotspots.find((h) => marks[h.id] === "incorrect") ?? rawActivity.hotspots[0];
      updateUi({ selected: first?.id });
    } else if (rawActivity.template === "decision" && response.template === "decision") {
      const walk = walkDecision(rawActivity, { choices: response.choices });
      const reopened = walk.steps.find((st) => rawActivity.nodes.find((n) => n.id === st.nodeId)?.choices.find((c) => c.id === st.choiceId)?.signals.some((g) => !g.met));
      setReviewNode((reopened ?? walk.steps[0])?.nodeId);
    }
    setPhase("feedback");
    setSection("feedback");
    window.scrollTo({ top: 0, behavior: "smooth" });
    requestAnimationFrame(() => document.getElementById("feedback-heading")?.focus());
  };

  const retry = () => {
    setPhase("working");
    setResult(null);
    setSection("stage");
    setReviewNode(undefined);
    // A new attempt starts unassisted unless help is used again.
    setHintsShown(0);
    setSolutionRevealed(false);
    persist({ hintsUsed: false, solutionRevealed: false });
  };

  const reset = () => {
    const r = emptyResponse(rawActivity);
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
  const skillIds = skillsAssessedBy(rawActivity, view.rawBundle.skills);
  // Below lg the questions live in a bottom sheet, so there is no separate tab for them while working.
  const tabs: { id: Section; label: string; className?: string }[] = [
    { id: "brief", label: tr("Brief") },
    ...(phase === "feedback" ? [{ id: "feedback" as const, label: tr("Ship review") }] : [{ id: "controls" as const, label: tr(controlsLabel), className: "hidden lg:flex" }]),
    { id: "stage", label: activity.template === "decision" ? tr("Situation") : tr("Live") },
  ];
  const lastAttempt = mode === "learner" ? [...view.pathAttempts].reverse().find((a) => a.activityId === activity.id) : undefined;

  const brief = (
    <div className="space-y-4">
      <div className="rounded-[22px] border-[1.5px] border-brand-strong bg-surface p-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sk-amber text-sm font-bold text-[#2b1f00]" aria-hidden>{activity.contextLabel.trim()[0]}</span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-fg">{tr("Client brief")}</p>
            <p className="font-mono text-[11px] text-subtle">{activity.contextLabel}</p>
          </div>
        </div>
        <p className="mt-3 rounded-2xl rounded-es-sm bg-overlay p-3 text-sm leading-relaxed text-fg">{activity.scenario}</p>
        <p className="mt-2 ms-auto w-fit rounded-2xl rounded-ee-sm bg-brand px-3 py-2 text-sm font-semibold text-white">{activity.task}</p>
        {activity.template === "decision" && response.template === "decision" && <DecisionThread activity={activity} choices={response.choices} />}
      </div>
      <details className="group rounded-2xl border border-line bg-surface">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-mono text-xs font-semibold text-accent">
          {tr("Constraints ({n})", { n: activity.constraints.length })}
          <span aria-hidden className="transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <ul className="list-disc space-y-1 px-4 pb-3 ps-8 text-sm text-muted">
          {activity.constraints.map((c) => <li key={c}>{c}</li>)}
        </ul>
      </details>
      <div>
        <p className="font-mono text-xs font-semibold text-accent">{tr(t.practice.targetSkills)}</p>
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
                  <summary className="cursor-pointer text-xs text-subtle hover:text-fg">{tr("What is assessed")}</summary>
                  <ul className="mt-1.5 space-y-0.5 text-xs text-muted">
                    {skill.criteria.filter((c) => activity.criteria.includes(c.id)).map((c) => <li key={c.id}>• {c.statement}</li>)}
                  </ul>
                </details>
                {mode === "learner" && contextUsed && <p className="mt-1.5 text-xs text-subtle">{tr("Already met in this context. Retrying is good practice but won’t add a new context.")}</p>}
              </li>
            );
          })}
        </ul>
      </div>
      {lastAttempt && phase === "working" && (
        <p className="text-xs text-subtle">
          {tr("Last submitted {when}", { when: dateTime(lastAttempt.submittedAt) })} ·{" "}
          <button type="button" className="text-accent hover:underline" onClick={() => { setResult({ attempt: lastAttempt, evaluation: lastAttempt.evaluation }); setResponse(lastAttempt.response); setPhase("feedback"); setSection("feedback"); }}>
            {tr("view that feedback")}
          </button>
        </p>
      )}
    </div>
  );

  const sig = JSON.stringify(response).length;
  // < lg: one section at a time. lg: Brief alone, or response + interface side by side. xl: all three columns.
  const vis = (s: Section) => (section === s ? "block" : "hidden");
  const work = section !== "brief" ? "lg:block" : "";
  // Below lg, while working, the workspace is a fixed-height app screen: top bar, tabs, the interface, and a dock with the current question.
  const app = phase === "working";
  const dock = { collapsed, setCollapsed, submit: doSubmit };
  // Below lg the incomplete-response notice goes above the interface, from lg it stays with the questions.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Keep what the current question is about in view inside the scrolling interface (below lg only).
  useEffect(() => {
    if (!app || section === "brief" || typeof window === "undefined" || !window.matchMedia("(max-width: 1023px)").matches) return;
    const id = requestAnimationFrame(() => stageRef.current?.querySelector<HTMLElement>(".hl")?.scrollIntoView({ block: "center", behavior: "smooth" }));
    return () => cancelAnimationFrame(id);
  }, [app, section, benchDim, ui.selected, pending, collapsed]);

  const missingNotice = missing && (
    <Notice tone="warn" title={tr(t.practice.incomplete)}>
      <ul className="list-disc space-y-0.5 ps-4">
        {L(missing).slice(0, 6).map((m, i) => <li key={i}>{m}</li>)}
        {missing.length > 6 && <li>{tr("and {n} more", { n: missing.length - 6 })}</li>}
      </ul>
    </Notice>
  );

  return (
    <div className={cn("mx-auto max-w-[1440px] px-4 sm:px-6", app ? "flex h-[calc(100dvh-3.9rem)] flex-col overflow-hidden pt-2 lg:block lg:h-auto lg:overflow-visible lg:pb-10 lg:pt-4" : "pb-28 pt-4 lg:pb-10")}>
      {/* Header: a compact one-line bar below lg while working */}
      <div className="flex items-start gap-3 max-lg:items-center max-lg:gap-2 lg:flex-wrap">
        <Link href={backHref} className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-muted hover:text-fg max-lg:mt-0" aria-label={tr("Back")}>
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-accent max-lg:flex-nowrap max-lg:overflow-hidden max-lg:whitespace-nowrap max-lg:text-[11px]">
            <span>{tr(TEMPLATE_LABEL[activity.template])}</span>
            <span aria-hidden className="max-lg:hidden">·</span>
            <span className="max-lg:hidden">{activity.contextLabel}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden className="max-lg:hidden" /> {tr("about {n} min", { n: activity.estimatedMinutes })}</span>
            {view.bundle.meta.freeSampleActivityIds.includes(activity.id) && <Badge tone="accent" className="max-lg:hidden">{tr(t.access.free)}</Badge>}
            {activity.kind === "alternative" && <Badge className="max-lg:hidden">{tr("Alternative practice")}</Badge>}
            {mode === "preview" && <Badge tone="ai">{tr("Admin preview · v{version}", { version })}</Badge>}
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-fg sm:text-3xl max-lg:mt-0 max-lg:truncate max-lg:text-[17px] max-lg:leading-tight">{activity.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {mode === "learner" && (
            <span className="hidden items-center gap-1.5 text-xs text-subtle md:inline-flex" aria-live="polite">
              <CheckCircle2 size={13} aria-hidden /> {savedAt ? tr(t.practice.savedLocally) : tr("Not started")}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={() => setHelpOpen(true)} aria-haspopup="dialog" className={cn(app && "max-lg:hidden")}>
            <HelpCircle size={15} aria-hidden /> {tr(t.practice.help)}
          </Button>
          {app && (
            <div className="flex items-center gap-1.5 lg:hidden">
              <button type="button" onClick={() => setHelpOpen(true)} aria-haspopup="dialog" aria-label={tr(t.practice.help)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted hover:text-fg">
                <HelpCircle size={16} aria-hidden />
              </button>
              <button type="button" onClick={() => setConfirmReset(true)} aria-label={tr(t.practice.reset)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted hover:text-fg">
                <RotateCcw size={15} aria-hidden />
              </button>
              {mode === "learner" && (
                <button type="button" onClick={() => { persist({}); router.push(backHref); }} aria-label={tr(t.practice.saveExit)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted hover:text-fg">
                  <Save size={15} aria-hidden />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {(hintsUsed || solutionRevealed) && phase === "working" && (
        <p className="mt-1 truncate text-[11px] text-warn lg:mt-3 lg:whitespace-normal lg:text-xs">
          {solutionRevealed ? tr("Solution revealed: this attempt will be practice-only.") : tr("Hint used: this attempt will count, but not as independent.")}
        </p>
      )}

      {/* Mobile and tablet section tabs */}
      <div className={cn("sticky top-16 z-30 -mx-4 mt-4 bg-canvas/95 px-4 py-2 xl:hidden", app && "max-lg:static max-lg:mt-1 max-lg:py-1.5")}>
        <Tabs numbered label={tr("Workspace sections")} tabs={tabs} value={section} onChange={setSection} />
      </div>

      <div className={cn("mt-4 grid gap-6", "lg:grid-cols-[minmax(320px,400px)_1fr] xl:grid-cols-[300px_minmax(340px,400px)_1fr]", app && "max-lg:mt-1 max-lg:flex max-lg:min-h-0 max-lg:flex-1 max-lg:flex-col max-lg:gap-0")}>
        <aside className={cn(vis("brief"), "lg:col-span-2 xl:col-span-1 xl:block", app && "max-lg:min-h-0 max-lg:flex-1 max-lg:overflow-y-auto max-lg:pt-2")} aria-label={tr("Brief")}>
          <div className="xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto xl:pe-1"><ColumnTag n={1} pulse={phase === "working" && !hintsUsed}>{tr("Read first")}</ColumnTag>{brief}</div>
          {app && (
            <div className="sticky bottom-0 -mx-4 mt-4 bg-gradient-to-t from-canvas via-canvas to-transparent px-4 pb-3 pt-6 lg:hidden">
              <Button variant="primary" size="lg" className="w-full" onClick={() => setSection("stage")}>
                {tr("Continue")} <ArrowRight size={16} aria-hidden />
              </Button>
            </div>
          )}
        </aside>

        <section
          className={cn(
            phase === "feedback"
              ? cn(vis("feedback"), work, "xl:block")
              : cn(
                  // Working: a dock under the interface below lg, a plain column from lg.
                  "max-lg:order-3 max-lg:-mx-4 max-lg:flex max-lg:max-h-[min(50dvh,24rem)] max-lg:flex-none max-lg:flex-col max-lg:rounded-t-3xl max-lg:border-t-[1.5px] max-lg:border-brand-strong max-lg:bg-surface max-lg:px-4 max-lg:pb-[max(0.75rem,env(safe-area-inset-bottom))] max-lg:pt-1 max-lg:shadow-[0_-12px_32px_rgba(0,0,0,0.45)] sm:max-lg:-mx-6 sm:max-lg:px-6",
                  section === "brief" && "max-lg:hidden lg:hidden",
                  "xl:block",
                ),
          )}
          aria-label={phase === "feedback" ? tr("Feedback") : tr(controlsLabel)}
        >
          {phase === "working" && (
            <button
              type="button"
              onClick={() => setCollapsed((o) => !o)}
              aria-expanded={!collapsed}
              className="mx-auto mb-0.5 flex w-full flex-none flex-col items-center gap-0.5 py-1 lg:hidden"
            >
              <span aria-hidden className="h-1 w-10 rounded-full bg-line-strong" />
              <span className="flex items-center gap-1 font-mono text-[11px] font-semibold text-accent">
                {tr(controlsLabel)} <ChevronDown size={12} aria-hidden className={cn("transition-transform", collapsed && "rotate-180")} />
              </span>
            </button>
          )}
          <div className={cn(phase === "working" && "max-lg:flex max-lg:min-h-0 max-lg:flex-1 max-lg:flex-col")}>
            <ColumnTag n={2}>{phase === "feedback" ? tr("Ship review") : tr(controlsLabel)}</ColumnTag>
            {phase === "feedback" && result ? (
              <div ref={feedbackRef}>
                <FeedbackPanel
                  view={view}
                  activity={activity}
                  attempt={result.attempt}
                  evaluation={result.evaluation}
                  mode={mode}
                  onRetry={retry}
                  critique={response.template === "critique" ? { reviews: response.reviews, selected: ui.selected as string | undefined, onSelect: (id) => updateUi({ selected: id || undefined }) } : undefined}
                  decision={response.template === "decision" ? { choices: response.choices, selectedNodeId: reviewNode, onSelectNode: (id) => setReviewNode(id || undefined) } : undefined}
                />
              </div>
            ) : (
              <div className="space-y-4 max-lg:flex max-lg:min-h-0 max-lg:flex-1 max-lg:flex-col max-lg:space-y-0">
                {missingNotice && !narrow && <div>{missingNotice}</div>}
                <DockContext.Provider value={dock}>{controls}</DockContext.Provider>
              </div>
            )}
          </div>
        </section>

        <section
          ref={stageRef}
          className={cn(section === "brief" ? "hidden xl:block" : phase === "feedback" && section === "feedback" ? "hidden lg:block" : "block", app && "max-lg:order-2 max-lg:min-h-0 max-lg:flex-1 max-lg:overflow-y-auto max-lg:overscroll-contain max-lg:pb-3")}
          aria-label={tr("Interface")}
        >
          <div className="lg:sticky lg:top-20">
            <ColumnTag n={3}>{tr("Live")}</ColumnTag>
            {missingNotice && narrow && <div className="mb-3">{missingNotice}</div>}
            <div className="relative p-3 max-lg:px-0 max-lg:py-2">
              <span key={sig} aria-hidden className="sel-snap pointer-events-none absolute inset-0 z-10 hidden rounded-[22px] outline outline-2 outline-offset-4 outline-brand-strong/70 lg:block" />
              {stage}
            </div>
          </div>
        </section>
      </div>

      {/* Action bar (lg and up; below lg the dock carries Next / Decide / Submit) */}
      {phase === "working" && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 backdrop-blur max-lg:hidden lg:static lg:mt-8 lg:border-0 lg:bg-transparent">
          <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-4 py-3 sm:px-6 lg:justify-end lg:px-0">
            <Button variant="ghost" onClick={() => setConfirmReset(true)}>
              <RotateCcw size={15} aria-hidden /> <span className="hidden sm:inline">{tr(t.practice.reset)}</span>
            </Button>
            {mode === "learner" && (
              <Button variant="secondary" onClick={() => { persist({}); router.push(backHref); }}>
                <Save size={15} aria-hidden /> <span className="hidden sm:inline">{tr(t.practice.saveExit)}</span><span className="sm:hidden">{tr("Save")}</span>
              </Button>
            )}
            <Button variant="primary" onClick={doSubmit} className="ms-auto lg:ms-0">
              <Send size={15} aria-hidden /> {tr(t.practice.submit)} <span className="ms-1 hidden rounded-md bg-black/20 px-1.5 font-mono text-[11px] sm:inline" aria-hidden>↵</span>
            </Button>
          </div>
        </div>
      )}

      {/* Help */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen} title={tr("Help for this activity")} wide>
        <div className="space-y-5 text-sm">
          <section>
            <h3 className="font-semibold text-fg">{tr("How this activity works")}</h3>
            <p className="mt-1 text-muted">{tr(HOW_IT_WORKS[activity.template])}</p>
          </section>
          <section>
            <h3 className="font-semibold text-fg">{tr("How evidence counts")}</h3>
            <p className="mt-1 text-muted">{tr(t.rule.short)}</p>
          </section>
          <section>
            <h3 className="font-semibold text-fg">{tr("Related explanations")}</h3>
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
              {activity.relatedConcepts.length === 0 && <li className="text-muted">{tr("No Explore content is included for this sample.")}</li>}
            </ul>
            <p className="mt-1 text-xs text-subtle">{tr("Your response is saved, and the explanation links back here. Reading does not affect how this attempt counts.")}</p>
          </section>
          <section>
            <h3 className="font-semibold text-fg">{tr("Hints")}</h3>
            {hintsShown > 0 ? (
              <ol className="mt-1 list-decimal space-y-1 ps-5 text-muted">
                {activity.hints.slice(0, hintsShown).map((h) => <li key={h}>{h}</li>)}
              </ol>
            ) : (
              <p className="mt-1 text-muted">{tr("Hints are available. Using one means this attempt still counts as evidence, but not as an independent attempt.")}</p>
            )}
            {hintsShown < activity.hints.length && (
              <Button size="sm" className="mt-2" onClick={() => (hintsShown === 0 ? setConfirmHint(true) : showHint())}>
                <Lightbulb size={14} aria-hidden /> {hintsShown === 0 ? tr(t.practice.showHint) : tr("Show another hint")}
              </Button>
            )}
          </section>
          <section>
            <h3 className="font-semibold text-fg">{tr("Solution")}</h3>
            {solutionRevealed ? (
              <p className="mt-1 rounded-lg border border-warn/30 bg-warn-bg p-3 text-fg">{activity.solution}</p>
            ) : (
              <>
                <p className="mt-1 text-muted">{tr("Revealing a solution makes this attempt practice-only: it stays in your history but does not count toward mastery.")}</p>
                <Button size="sm" variant="subtle" className="mt-2" onClick={() => setConfirmReveal(true)}>
                  {tr(t.practice.revealSolution)}
                </Button>
              </>
            )}
          </section>
        </div>
      </Dialog>

      <Dialog
        open={confirmHint}
        onOpenChange={setConfirmHint}
        title={tr("Use a hint?")}
        description={tr("This attempt will still count as evidence, but not as an independent attempt. Each skill needs at least one independent context.")}
        footer={<><Button variant="ghost" onClick={() => setConfirmHint(false)}>{tr("Cancel")}</Button><Button variant="primary" onClick={showHint}>{tr("Show hint")}</Button></>}
      />
      <Dialog
        open={confirmReveal}
        onOpenChange={setConfirmReveal}
        title={tr("Reveal a solution?")}
        description={tr("This attempt will become practice-only and will not count toward mastery. You can still submit it to see feedback.")}
        footer={<><Button variant="ghost" onClick={() => setConfirmReveal(false)}>{tr("Cancel")}</Button><Button variant="primary" onClick={reveal}>{tr("Reveal solution")}</Button></>}
      />
      <Dialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title={tr("Reset this activity?")}
        description={tr("Your unfinished response for this activity will be cleared. Submitted attempts stay in your history.")}
        footer={<><Button variant="ghost" onClick={() => setConfirmReset(false)}>{tr("Cancel")}</Button><Button variant="danger" onClick={reset}>{tr("Reset response")}</Button></>}
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
  const { tr } = useI18n();
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-raised text-muted"><Lock size={20} aria-hidden /></span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-fg">{activity.title}</h1>
        <p className="mt-1 text-sm text-muted">{activity.contextLabel} · {tr("about {n} min", { n: activity.estimatedMinutes })}</p>
        <p className="mt-4 text-sm leading-relaxed text-fg">{activity.scenario}</p>
        <Notice tone="accent" className="mt-6" title={tr(t.access.locked)}>
          {tr("This activity is part of the subscription. Free samples are marked in the path, and your progress on them is kept when you subscribe.")}
        </Notice>
        <div className="mt-6 flex flex-wrap gap-2">
          <LinkButton href={`/subscribe?return=${encodeURIComponent(returnHref)}`} variant="primary">{tr("Review subscription")}</LinkButton>
          <LinkButton href={`/paths/${pathId}`} variant="ghost">{tr("Back to path")}</LinkButton>
        </div>
      </div>
    </div>
  );
}
