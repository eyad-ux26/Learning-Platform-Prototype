"use client";

import { useEffect } from "react";
import { ArrowRight, Award, BookOpen, CheckCircle2, ChevronDown, CircleAlert, Copy, Eye, ListChecks, Lock, RotateCcw, Trophy } from "lucide-react";
import { recommendNext } from "@/domain/recommend";
import type { Activity, Attempt, Evaluation, Verdict } from "@/domain/types";
import { walkDecision } from "@/domain/assessment";
import { CritiqueReview } from "./CritiqueReview";
import { DecisionReview } from "./DecisionReview";
import { SkillStatusBadge } from "@/components/SkillStatus";
import { SkillRing } from "@/components/SkillRing";
import { Button, LinkButton, Notice, cn } from "@/components/ui";
import { BadgeMedal } from "@/components/BadgeMedal";
import { Confetti } from "@/components/Celebrate";
import { playSfx } from "@/components/sfx";
import { attemptRep } from "@/domain/progression";
import { useApp, type PathView } from "@/state/AppState";
import { useBadges } from "@/learner/useBadges";
import { BuildBar, type Brick } from "./BuildBar";
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
  bricks,
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
  /** The finished build, one brick per step. */
  bricks?: Brick[];
}) {
  const { tr, L } = useI18n();
  const { learner } = useApp();
  const badges = useBadges();
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
  // Headline numbers for the result, per activity type.
  const stat = (() => {
    if (activity.template === "critique" && critique) {
      const right = activity.hotspots.filter((h) => {
        const r = critique.reviews[h.id];
        return r?.verdict === h.verdict && !!r.reason && h.correctReasons.includes(r.reason);
      }).length;
      return { label: tr("JUDGED RIGHT"), headline: tr("{n} of {m} judged right", { n: right, m: activity.hotspots.length }) };
    }
    if (activity.template === "decision" && decision) {
      const steps = walkDecision(activity, { choices: decision.choices }).steps;
      const held = steps.filter((st) => activity.nodes.find((n) => n.id === st.nodeId)?.choices.find((c) => c.id === st.choiceId)?.signals.every((g) => g.met)).length;
      return { label: tr("HELD UP"), headline: tr("{n} of {m} held up", { n: held, m: steps.length }) };
    }
    return { label: tr("CRITERIA MET"), headline: tr("{n} of {m} criteria met", { n: met.length, m: evaluation.criteria.length }) };
  })();
  const pathStat = mode === "learner" && bundle.meta.availability === "full" ? { value: view.completion.mastered.length, max: bundle.requiredSkillIds.length } : undefined;
  const rep = mode === "learner" && attempt ? attemptRep(attempt, learner.evidence) : 0;
  const newBadges = attempt ? badges.filter((b) => b.attemptId === attempt.id) : [];
  // Tickets carry the detail for decisions and critiques; the criterion list is the detail for Design Bench.
  const ticketed = (activity.template === "critique" && !!critique) || (activity.template === "decision" && !!decision);

  useEffect(() => {
    if (!newBadges.length) return;
    const id = window.setTimeout(() => playSfx("badge"), 900);
    return () => window.clearTimeout(id);
    // Only when the result first shows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt?.id]);

  const criteria = (
    <>
      {met.length > 0 && (
        <section aria-labelledby="fb-worked" className="space-y-2">
          <h3 id="fb-worked" className="font-mono text-xs font-semibold text-ok">{tr("What worked")}</h3>
          {met.map((c) => (
            <CriterionCard key={c.criterionId} title={criterion(c.criterionId)?.statement ?? c.criterionId} skill={skillName(c.skillId)} result={c} tone="ok" />
          ))}
        </section>
      )}
      {unmet.length > 0 && (
        <section aria-labelledby="fb-improve" className="space-y-2">
          <h3 id="fb-improve" className="font-mono text-xs font-semibold text-bad">{tr("What needs improvement")}</h3>
          {unmet.map((c) => (
            <CriterionCard key={c.criterionId} title={criterion(c.criterionId)?.statement ?? c.criterionId} skill={skillName(c.skillId)} result={c} tone="warn" />
          ))}
        </section>
      )}
    </>
  );

  return (
    <div className="space-y-5 animate-rise" aria-labelledby="feedback-heading">
      {/* Result: verdict, the finished build, and what it earned */}
      <section className="relative rounded-[22px] bg-brand p-5 text-white">
        {allMet && <Confetti count={26} spread={170} className="[&>span]:top-10" />}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="animate-stamp inline-flex items-center gap-2 rounded-lg border-[2.5px] border-white px-3 py-1 font-mono text-sm font-semibold tracking-[0.12em]">
            {allMet ? <CheckCircle2 size={16} aria-hidden /> : <RotateCcw size={16} aria-hidden />}
            {allMet ? tr("SHIPPED") : tr("REOPENED")}
          </span>
          <span className="font-mono text-[11px] font-semibold text-[#d4cfff]">{stat.label}</span>
        </div>
        <h2 id="feedback-heading" tabIndex={-1} className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          {stat.headline}
        </h2>
        {bricks && bricks.length > 0 && (
          <div className="mt-3 rounded-xl bg-black/25 px-3 py-2.5">
            <BuildBar bricks={bricks} />
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {rep > 0 && (
            <span className="animate-pop inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-mono text-sm font-semibold text-[#5a3f00]" title={tr("Rep: prototype scoring from your own attempts")}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#e0a400" aria-hidden><path d="M12 2l10 10-10 10L2 12z" /></svg>
              {tr("+{n} Rep", { n: rep })}
            </span>
          )}
          {pathStat && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-mono text-sm font-semibold">
              <Trophy size={14} aria-hidden className="text-sk-amber" />
              {tr("{n}/{m} skills mastered", { n: pathStat.value, m: pathStat.max })}
            </span>
          )}
        </div>
        {newBadges.length > 0 && (
          <div className="mt-4 rounded-2xl bg-white/10 p-3">
            <p className="font-mono text-[11px] font-semibold text-[#e4e0ff]">{newBadges.length === 1 ? tr("New badge") : tr("New badges")}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {newBadges.map((b, i) => (
                <li key={`${b.id}-${b.pathId ?? ""}`} style={{ animationDelay: `${600 + i * 150}ms` }} className="animate-pop">
                  <BadgeMedal id={b.id} earned size={52} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

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

      {/* Per-skill result: ring, name, status */}
      <section aria-label={tr("Results by skill")} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {evaluation.skills.map((s) => {
          const p = view.progress[s.skillId];
          const idx = Math.max(0, bundle.skills.findIndex((x) => x.id === s.skillId));
          return (
            <div key={s.skillId} className="flex min-w-0 items-center gap-3 rounded-2xl border border-line bg-surface p-2.5">
              {mode === "learner" && p ? <SkillRing index={idx} progress={p} size={42} animateNew={s.met} /> : null}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-fg">{skillName(s.skillId)}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", s.met ? "text-ok" : "text-warn")}>
                    {s.met ? <CheckCircle2 size={13} aria-hidden /> : <CircleAlert size={13} aria-hidden />}
                    {s.met ? tr("Met") : tr("Not yet")}
                  </span>
                  {mode === "learner" && p && <SkillStatusBadge status={p.status} />}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {critique && activity.template === "critique" && (
        <section aria-labelledby="fb-elements" className="space-y-2.5">
          <h3 id="fb-elements" className="font-mono text-xs font-semibold text-accent">{tr("Element by element · tap to open")}</h3>
          <CritiqueReview activity={activity} reviews={critique.reviews} evaluation={evaluation} selected={critique.selected} onSelect={critique.onSelect} />
        </section>
      )}
      {decision && activity.template === "decision" && (
        <section aria-labelledby="fb-route" className="space-y-2.5">
          <h3 id="fb-route" className="font-mono text-xs font-semibold text-accent">{tr("Your route · tap a decision")}</h3>
          <DecisionReview activity={activity} choices={decision.choices} evaluation={evaluation} selectedNodeId={decision.selectedNodeId} onSelectNode={decision.onSelectNode} />
        </section>
      )}

      {ticketed ? (
        <details className="group rounded-2xl border border-line bg-surface">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-fg">
            <ListChecks size={16} aria-hidden className="text-accent" /> {tr("Criteria ({n} of {m} met)", { n: met.length, m: evaluation.criteria.length })}
            <ChevronDown size={15} aria-hidden className="ms-auto text-subtle transition-transform group-open:rotate-180" />
          </summary>
          <div className="space-y-4 px-3 pb-3">{criteria}</div>
        </details>
      ) : (
        criteria
      )}

      {activity.template === "decision" && (
        <details className="group rounded-2xl border border-line bg-surface">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-fg">
            <BookOpen size={16} aria-hidden className="text-accent" /> {tr("Learn more: impact, reversibility, uncertainty")}
            <ChevronDown size={15} aria-hidden className="ms-auto text-subtle transition-transform group-open:rotate-180" />
          </summary>
          <dl className="space-y-2 px-4 pb-4 text-sm">
            <div><dt className="font-medium text-fg">{tr("Impact")}</dt><dd className="text-muted">{activity.debrief.impact}</dd></div>
            <div><dt className="font-medium text-fg">{tr("Reversibility")}</dt><dd className="text-muted">{activity.debrief.reversibility}</dd></div>
            <div><dt className="font-medium text-fg">{tr("Uncertainty")}</dt><dd className="text-muted">{activity.debrief.uncertainty}</dd></div>
          </dl>
        </details>
      )}

      {/* Next action */}
      <section aria-labelledby="fb-next" className={cn("space-y-3 rounded-[22px] border p-5", allMet ? "border-ok/30 bg-ok-bg" : "border-sk-coral/40 bg-bad-bg")}>
        <h3 id="fb-next" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight text-fg">
          <ArrowRight size={18} aria-hidden className="text-accent" /> {tr("Recommended next")}
        </h3>
        {rec?.type === "activity" && (() => {
          const next = bundle.activities.find((a) => a.id === rec.activityId)!;
          return (
            <div className="space-y-3">
              <div>
                <p className="font-medium text-fg">{next.title}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-muted">{L(rec.reason)}</p>
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
            <p className="flex items-center gap-2 text-sm font-semibold text-fg"><Trophy size={16} className="text-sk-amber" aria-hidden /> {tr("Every required skill is Mastered. The path is complete.")}</p>
            <div className="flex flex-wrap gap-2">
              <LinkButton href={`/paths/${pathId}/certificate`} variant="primary"><Award size={15} aria-hidden /> {tr("Get your certificate")}</LinkButton>
              <LinkButton href={`/paths/${pathId}/skills`} variant="secondary">{tr("See your evidence")}</LinkButton>
            </div>
          </div>
        )}
        {!rec && (
          <p className="text-sm text-muted">
            {mode === "preview" ? tr("In learner mode, the recommendation engine would suggest the next activity here.") : tr("This is a sample from a path that is not fully included in this prototype.")}
          </p>
        )}
        <div className="flex flex-wrap gap-2 border-t border-line pt-3">
          <Button variant="ghost" size="sm" onClick={onRetry}>
            <RotateCcw size={14} aria-hidden /> {activity.template === "design-bench" ? tr("Revise and resubmit") : tr("Try again")}
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
