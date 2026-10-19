"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, CircleAlert, Copy, Eye, Lock, RotateCcw } from "lucide-react";
import { recommendNext } from "@/domain/recommend";
import type { Activity, Attempt, Evaluation, Verdict } from "@/domain/types";
import { walkDecision } from "@/domain/assessment";
import { CritiqueReview } from "./CritiqueReview";
import { DecisionReview } from "./DecisionReview";
import { SkillStatusBadge } from "@/components/SkillStatus";
import { SkillRing } from "@/components/SkillRing";
import { Badge, Button, LinkButton, Notice, cn } from "@/components/ui";
import type { PathView } from "@/state/AppState";
import { useI18n } from "@/i18n";

export function FeedbackPanel({
  view,
  activity,
  attempt,
  evaluation: storedEvaluation,
  mode,
  onRetry,
  critique,
  decision,
}: {
  view: PathView;
  activity: Activity;
  attempt?: Attempt;
  evaluation: Evaluation;
  mode: "learner" | "preview";
  onRetry: () => void;
  /** Critique ship review: the learner's reviews and the element open in the review (shared with the live preview). */
  critique?: { reviews: Record<string, { verdict?: Verdict; reason?: string; note?: string }>; selected?: string; onSelect: (id: string) => void };
  /** Decision ship review: the learner's route and the decision open in the review (shared with the live preview). */
  decision?: { choices: { nodeId: string; choiceId: string }[]; selectedNodeId?: string; onSelectNode: (id: string) => void };
}) {
  const { tr, L } = useI18n();
  const { bundle } = view;
  // The evaluation may be English (fresh or stored); localise for display only.
  const evaluation = L(storedEvaluation);
  const skillName = (id: string) => bundle.skills.find((s) => s.id === id)?.name ?? id;
  const criterion = (id: string) => bundle.skills.flatMap((s) => s.criteria).find((c) => c.id === id);
  const met = evaluation.criteria.filter((c) => c.met);
  const unmet = evaluation.criteria.filter((c) => !c.met);
  const pathId = bundle.meta.id;
  const fromParam = `?from=${activity.id}`;
  const rec =
    mode === "learner" && attempt && bundle.meta.availability === "full"
      ? recommendNext({ bundle: view.rawBundle, evidence: view.pathEvidence, attempts: view.pathAttempts, canAccess: view.canAccess, after: attempt })
      : undefined;
  const conceptFor = (skillId: string) => bundle.explore.find((c) => c.skillId === skillId);
  const unmetSkills = evaluation.skills.filter((s) => !s.met).map((s) => s.skillId);
  const allMet = evaluation.skills.every((s) => s.met);
  // Headline numbers for the review hero, per activity type.
  const stat = (() => {
    if (activity.template === "critique" && critique) {
      const right = activity.hotspots.filter((h) => {
        const r = critique.reviews[h.id];
        return r?.verdict === h.verdict && !!r.reason && h.correctReasons.includes(r.reason);
      }).length;
      return { label: tr("JUDGED RIGHT"), value: right, max: activity.hotspots.length, note: tr("Verdict and reason") };
    }
    if (activity.template === "decision" && decision) {
      const steps = walkDecision(activity, { choices: decision.choices }).steps;
      const held = steps.filter((st) => activity.nodes.find((n) => n.id === st.nodeId)?.choices.find((c) => c.id === st.choiceId)?.signals.every((g) => g.met)).length;
      return { label: tr("HELD UP"), value: held, max: steps.length, note: tr("Every criterion met") };
    }
    return { label: tr("CRITERIA MET"), value: met.length, max: evaluation.criteria.length, note: tr("Across the assessed skills") };
  })();
  const pathStat = mode === "learner" && bundle.meta.availability === "full" ? { value: view.completion.mastered.length, max: bundle.requiredSkillIds.length } : undefined;
  /** Authored criterion feedback only. No generated or invented client dialogue. */
  const reviewNote = (unmet[0] ?? met[0])?.feedback;

  return (
    <div className="space-y-6 animate-rise" aria-labelledby="feedback-heading">
      <div className="flex flex-wrap items-center gap-6 rounded-[22px] bg-brand p-5 text-white">
        <div className="min-w-0 flex-1 basis-72">
        <span className={cn("animate-stamp inline-flex items-center gap-2 rounded-lg border-[2.5px] border-white px-3 py-1 font-mono text-sm font-semibold tracking-[0.12em]")}>
          {allMet ? <CheckCircle2 size={16} aria-hidden /> : <RotateCcw size={16} aria-hidden />}
          {allMet ? tr("SHIPPED") : tr("REOPENED")}
        </span>
        <h2 id="feedback-heading" tabIndex={-1} className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          {tr("{n} of {m} criteria met", { n: met.length, m: evaluation.criteria.length })}
        </h2>
        <p className="mt-1 text-sm text-[#e4e0ff]">
          {evaluation.skills.length === 1 ? tr("Across 1 skill.") : tr("Across {n} skills.", { n: evaluation.skills.length })} {allMet ? tr("Nothing to reopen.") : tr("The skills below come back in a different context.")}
        </p>
        {reviewNote && (
          <div className="mt-4 flex max-w-xl items-end gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sk-amber text-xs font-bold text-[#2b1f00]" aria-hidden>{activity.contextLabel.trim()[0]}</span>
            <div className="rounded-2xl rounded-es-sm bg-white p-3 text-sm leading-snug text-[#17152e]">
              <p className="font-mono text-[11px] text-[#5a5680]">{activity.contextLabel} · {allMet ? tr("review note") : tr("look at this")}</p>
              {reviewNote}
            </div>
          </div>
        )}
        </div>
        <div className="flex gap-3">
          <div className="w-36 rounded-[22px] bg-white p-4 text-[#17152e]">
            <p className="font-mono text-[11px] font-semibold text-[#5a5680]">{stat.label}</p>
            <p className="mt-1 font-display text-4xl font-extrabold">{stat.value}<span className="text-[#9a96b8]">/{stat.max}</span></p>
            <p className="text-xs text-[#5a5680]">{stat.note}</p>
          </div>
          {pathStat && (
            <div className="w-36 rounded-[22px] bg-white p-4 text-[#17152e]">
              <p className="font-mono text-[11px] font-semibold text-[#5a5680]">{tr("SKILLS MASTERED")}</p>
              <p className="mt-1 font-display text-4xl font-extrabold">{pathStat.value}<span className="text-[#9a96b8]">/{pathStat.max}</span></p>
              <p className="text-xs text-[#5a5680]">{tr("Path completes at {n}/{n}", { n: pathStat.max })}</p>
            </div>
          )}
        </div>
      </div>

      {mode === "preview" && <Notice tone="accent" title={tr("Preview mode")}>{tr("This evaluation uses the real assessment rules, but no evidence is recorded.")}</Notice>}
      {attempt?.duplicateOf && (
        <Notice tone="warn" icon={<Copy size={16} />} title={tr("Identical to an earlier submission")}>
          {tr("This response matches one you already submitted for this activity, so it was recorded in your history but adds no new evidence.")}
        </Notice>
      )}
      {attempt?.solutionRevealed && (
        <Notice tone="warn" icon={<Eye size={16} />} title={tr("Practice only")}>
          {tr("You revealed a solution before submitting, so this attempt is kept in your history but does not count toward mastery.")}
        </Notice>
      )}
      {attempt && attempt.hintsUsed && !attempt.solutionRevealed && !attempt.duplicateOf && (
        <Notice tone="neutral" title={tr("Counted with hints")}>
          {tr("This attempt counts as evidence, but not as an independent attempt because you used a hint.")}
        </Notice>
      )}

      {/* Per-skill result */}
      <section aria-label={tr("Results by skill")} className="space-y-2">
        {evaluation.skills.map((s) => {
          const p = view.progress[s.skillId];
          const idx = Math.max(0, bundle.skills.findIndex((x) => x.id === s.skillId));
          return (
            <div key={s.skillId} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
              {mode === "learner" && p && <SkillRing index={idx} progress={p} size={56} animateNew={s.met} />}
              <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-extrabold tracking-tight text-fg">{skillName(s.skillId)}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className={cn("inline-flex items-center gap-1.5 text-sm", s.met ? "text-ok" : "text-warn")}>
                  {s.met ? <CheckCircle2 size={15} aria-hidden /> : <CircleAlert size={15} aria-hidden />}
                  {s.met ? tr("Criteria met in this attempt") : tr("Not met yet")}
                </span>
                {mode === "learner" && p && (
                  <span className="ms-auto flex items-center gap-2">
                    <SkillStatusBadge status={p.status} />
                  </span>
                )}
              </div>
              </div>
            </div>
          );
        })}
      </section>

      {critique && activity.template === "critique" && (
        <section aria-labelledby="fb-elements" className="space-y-3">
          <h3 id="fb-elements" className="font-mono text-xs font-semibold text-accent">{tr("Element by element · tap to open")}</h3>
          <CritiqueReview activity={activity} reviews={critique.reviews} evaluation={evaluation} selected={critique.selected} onSelect={critique.onSelect} />
        </section>
      )}
      {decision && activity.template === "decision" && (
        <section aria-labelledby="fb-route" className="space-y-3">
          <h3 id="fb-route" className="font-mono text-xs font-semibold text-accent">{tr("Your route · tap a decision")}</h3>
          <DecisionReview activity={activity} choices={decision.choices} evaluation={evaluation} selectedNodeId={decision.selectedNodeId} onSelectNode={decision.onSelectNode} />
        </section>
      )}

      {met.length > 0 && (
        <section aria-labelledby="fb-worked" className="space-y-3">
          <h3 id="fb-worked" className="font-mono text-xs font-semibold text-ok">{tr("What worked")}</h3>
          {met.map((c) => (
            <CriterionCard key={c.criterionId} title={criterion(c.criterionId)?.statement ?? c.criterionId} skill={skillName(c.skillId)} result={c} tone="ok" />
          ))}
        </section>
      )}

      {unmet.length > 0 && (
        <section aria-labelledby="fb-improve" className="space-y-3">
          <h3 id="fb-improve" className="font-mono text-xs font-semibold text-bad">{tr("What needs improvement")}</h3>
          {unmet.map((c, i) => (
            <CriterionCard key={c.criterionId} title={criterion(c.criterionId)?.statement ?? c.criterionId} skill={skillName(c.skillId)} result={c} tone="warn" defaultOpen={i === 0 && !critique && !decision} />
          ))}
        </section>
      )}

      {activity.template === "decision" && (
        <section aria-labelledby="fb-debrief" className="space-y-2 rounded-xl border border-line bg-surface p-4">
          <h3 id="fb-debrief" className="text-sm font-semibold text-fg">{tr("How impact, reversibility and uncertainty shape the right interaction")}</h3>
          <dl className="space-y-2 text-sm">
            <div><dt className="font-medium text-fg">{tr("Impact")}</dt><dd className="text-muted">{activity.debrief.impact}</dd></div>
            <div><dt className="font-medium text-fg">{tr("Reversibility")}</dt><dd className="text-muted">{activity.debrief.reversibility}</dd></div>
            <div><dt className="font-medium text-fg">{tr("Uncertainty")}</dt><dd className="text-muted">{activity.debrief.uncertainty}</dd></div>
          </dl>
        </section>
      )}

      {/* Next action */}
      <section aria-labelledby="fb-next" className={cn("space-y-3 rounded-[22px] border p-5", allMet ? "border-ok/30 bg-ok-bg" : "border-sk-coral/40 bg-bad-bg")}>
        <h3 id="fb-next" className="font-display text-xl font-extrabold tracking-tight text-fg">{tr("Recommended next")}</h3>
        {rec?.type === "activity" && (() => {
          const next = bundle.activities.find((a) => a.id === rec.activityId)!;
          return (
            <div className="space-y-3">
              <div>
                <p className="font-medium text-fg">{next.title}</p>
                <p className="mt-0.5 text-sm text-muted">{L(rec.reason)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <LinkButton href={`/paths/${pathId}/practice/${next.id}`} variant="primary">
                  {rec.locked ? <Lock size={15} aria-hidden /> : null}
                  {rec.locked ? tr("View subscription activity") : tr("Start this activity")} <ArrowRight size={15} aria-hidden />
                </LinkButton>
                {unmetSkills[0] && conceptFor(unmetSkills[0]) && (
                  <LinkButton href={`/paths/${pathId}/explore/${conceptFor(unmetSkills[0])!.id}${fromParam}`} variant="secondary">
                    <BookOpen size={15} aria-hidden /> {tr("Read: {title}", { title: conceptFor(unmetSkills[0])!.title })}
                  </LinkButton>
                )}
              </div>
            </div>
          );
        })()}
        {rec?.type === "review" && (
          <div className="space-y-3">
            <p className="text-sm text-muted">{L(rec.reason)}</p>
            <div className="flex flex-wrap gap-2">
              {rec.conceptId && (
                <LinkButton href={`/paths/${pathId}/explore/${rec.conceptId}${fromParam}`} variant="primary">
                  <BookOpen size={15} aria-hidden /> {tr("Review the explanation")}
                </LinkButton>
              )}
              {rec.otherActivityId && (
                <LinkButton href={`/paths/${pathId}/practice/${rec.otherActivityId}`} variant="secondary">
                  {tr("Practise another skill")}
                </LinkButton>
              )}
            </div>
          </div>
        )}
        {rec?.type === "complete" && (
          <div className="space-y-3">
            <p className="text-sm text-fg">{tr("Every required skill is Mastered. The path is complete.")}</p>
            <LinkButton href={`/paths/${pathId}/skills`} variant="primary">{tr("See your evidence")}</LinkButton>
          </div>
        )}
        {!rec && (
          <p className="text-sm text-muted">
            {mode === "preview" ? tr("In learner mode, the recommendation engine would suggest the next activity here.") : tr("This is a sample from a path that is not fully included in this prototype.")}
          </p>
        )}
        <div className="flex flex-wrap gap-2 border-t border-line pt-3">
          <Button variant="ghost" size="sm" onClick={onRetry}>
            <RotateCcw size={14} aria-hidden /> {tr("Revise and resubmit")}
          </Button>
          {mode === "learner" && (
            <LinkButton href={`/paths/${pathId}/skills`} variant="ghost" size="sm">
              {tr("Skill progress")}
            </LinkButton>
          )}
        </div>
      </section>
    </div>
  );
}

function CriterionCard({ title, skill, result, tone, defaultOpen }: { title: string; skill: string; result: Evaluation["criteria"][number]; tone: "ok" | "warn"; defaultOpen?: boolean }) {
  const { tr } = useI18n();
  const ok = tone === "ok";
  return (
    <details open={defaultOpen} className={cn("group overflow-hidden rounded-2xl border bg-surface", ok ? "border-line" : "border-sk-coral/40")}>
      <summary className="flex cursor-pointer list-none items-center gap-3 p-3.5">
        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]", ok ? "bg-ok-bg text-ok" : "bg-bad-bg text-bad")}>
          {ok ? <CheckCircle2 size={16} aria-hidden /> : <RotateCcw size={16} aria-hidden />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-[11px] text-subtle">{skill}</span>
          <span className="block text-sm font-semibold leading-snug text-fg">{title}</span>
        </span>
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 font-mono text-xs font-semibold", ok ? "bg-ok-bg text-ok" : "bg-bad-bg text-bad")}>{ok ? tr("Closed") : tr("Reopened")}</span>
        <span aria-hidden className="text-subtle transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="space-y-3 px-4 pb-4 ps-[3.75rem]">
        <p className="text-sm leading-relaxed text-fg">{result.feedback}</p>
        {result.evidence.length > 0 && (
          <div>
            <p className="font-mono text-xs font-semibold text-subtle">{tr("In your response")}</p>
            <ul className="mt-1 space-y-1 text-sm text-muted">
              {result.evidence.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}
        {result.consequence && (
          <p className="text-sm text-muted">
            <span className="font-medium text-fg">{ok ? tr("Effect for users: ") : tr("Practical consequence: ")}</span>
            {result.consequence}
          </p>
        )}
      </div>
    </details>
  );
}
