"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, CircleAlert, Copy, Eye, Lock, RotateCcw } from "lucide-react";
import { recommendNext } from "@/domain/recommend";
import type { Activity, Attempt, Evaluation } from "@/domain/types";
import { SkillStatusBadge, EvidenceMeter } from "@/components/SkillStatus";
import { Badge, Button, LinkButton, Notice, cn } from "@/components/ui";
import type { PathView } from "@/state/AppState";

export function FeedbackPanel({
  view,
  activity,
  attempt,
  evaluation,
  mode,
  onRetry,
}: {
  view: PathView;
  activity: Activity;
  attempt?: Attempt;
  evaluation: Evaluation;
  mode: "learner" | "preview";
  onRetry: () => void;
}) {
  const { bundle } = view;
  const skillName = (id: string) => bundle.skills.find((s) => s.id === id)?.name ?? id;
  const criterion = (id: string) => bundle.skills.flatMap((s) => s.criteria).find((c) => c.id === id);
  const met = evaluation.criteria.filter((c) => c.met);
  const unmet = evaluation.criteria.filter((c) => !c.met);
  const pathId = bundle.meta.id;
  const fromParam = `?from=${activity.id}`;
  const rec =
    mode === "learner" && attempt && bundle.meta.availability === "full"
      ? recommendNext({ bundle, evidence: view.pathEvidence, attempts: view.pathAttempts, canAccess: view.canAccess, after: attempt })
      : undefined;
  const conceptFor = (skillId: string) => bundle.explore.find((c) => c.skillId === skillId);
  const unmetSkills = evaluation.skills.filter((s) => !s.met).map((s) => s.skillId);

  return (
    <div className="space-y-6 animate-rise" aria-labelledby="feedback-heading">
      <div>
        <h2 id="feedback-heading" tabIndex={-1} className="text-xl font-semibold tracking-tight text-fg">
          Feedback
        </h2>
        <p className="mt-1 text-sm text-muted">
          {met.length} of {evaluation.criteria.length} criteria met across {evaluation.skills.length} {evaluation.skills.length === 1 ? "skill" : "skills"}.
        </p>
      </div>

      {mode === "preview" && <Notice tone="accent" title="Preview mode">This evaluation uses the real assessment rules, but no evidence is recorded.</Notice>}
      {attempt?.duplicateOf && (
        <Notice tone="warn" icon={<Copy size={16} />} title="Identical to an earlier submission">
          This response matches one you already submitted for this activity, so it was recorded in your history but adds no new evidence.
        </Notice>
      )}
      {attempt?.solutionRevealed && (
        <Notice tone="warn" icon={<Eye size={16} />} title="Practice only">
          You revealed a solution before submitting, so this attempt is kept in your history but does not count toward mastery.
        </Notice>
      )}
      {attempt && attempt.hintsUsed && !attempt.solutionRevealed && !attempt.duplicateOf && (
        <Notice tone="neutral" title="Counted with hints">
          This attempt counts as evidence, but not as an independent attempt because you used a hint.
        </Notice>
      )}

      {/* Per-skill result */}
      <section aria-label="Results by skill" className="space-y-2">
        {evaluation.skills.map((s) => {
          const p = view.progress[s.skillId];
          return (
            <div key={s.skillId} className="rounded-xl border border-line bg-surface p-3">
              <p className="text-sm font-medium text-fg">{skillName(s.skillId)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className={cn("inline-flex items-center gap-1.5 text-sm", s.met ? "text-ok" : "text-warn")}>
                  {s.met ? <CheckCircle2 size={15} aria-hidden /> : <CircleAlert size={15} aria-hidden />}
                  {s.met ? "Criteria met in this attempt" : "Not met yet"}
                </span>
                {mode === "learner" && p && (
                  <span className="ms-auto flex items-center gap-2">
                    <EvidenceMeter progress={p} compact />
                    <SkillStatusBadge status={p.status} />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {met.length > 0 && (
        <section aria-labelledby="fb-worked" className="space-y-3">
          <h3 id="fb-worked" className="text-sm font-semibold uppercase tracking-wide text-ok">What worked</h3>
          {met.map((c) => (
            <CriterionCard key={c.criterionId} title={criterion(c.criterionId)?.statement ?? c.criterionId} skill={skillName(c.skillId)} result={c} tone="ok" />
          ))}
        </section>
      )}

      {unmet.length > 0 && (
        <section aria-labelledby="fb-improve" className="space-y-3">
          <h3 id="fb-improve" className="text-sm font-semibold uppercase tracking-wide text-warn">What needs improvement</h3>
          {unmet.map((c) => (
            <CriterionCard key={c.criterionId} title={criterion(c.criterionId)?.statement ?? c.criterionId} skill={skillName(c.skillId)} result={c} tone="warn" />
          ))}
        </section>
      )}

      {evaluation.detail?.kind === "critique" && activity.template === "critique" && <CritiqueSummary activity={activity} detail={evaluation.detail} />}
      {activity.template === "decision" && (
        <section aria-labelledby="fb-debrief" className="space-y-2 rounded-xl border border-line bg-surface p-4">
          <h3 id="fb-debrief" className="text-sm font-semibold text-fg">How impact, reversibility and uncertainty shape the right interaction</h3>
          <dl className="space-y-2 text-sm">
            <div><dt className="font-medium text-fg">Impact</dt><dd className="text-muted">{activity.debrief.impact}</dd></div>
            <div><dt className="font-medium text-fg">Reversibility</dt><dd className="text-muted">{activity.debrief.reversibility}</dd></div>
            <div><dt className="font-medium text-fg">Uncertainty</dt><dd className="text-muted">{activity.debrief.uncertainty}</dd></div>
          </dl>
        </section>
      )}

      {/* Next action */}
      <section aria-labelledby="fb-next" className="space-y-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
        <h3 id="fb-next" className="text-sm font-semibold text-fg">Recommended next</h3>
        {rec?.type === "activity" && (() => {
          const next = bundle.activities.find((a) => a.id === rec.activityId)!;
          return (
            <div className="space-y-3">
              <div>
                <p className="font-medium text-fg">{next.title}</p>
                <p className="mt-0.5 text-sm text-muted">{rec.reason}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <LinkButton href={`/paths/${pathId}/practice/${next.id}`} variant="primary">
                  {rec.locked ? <Lock size={15} aria-hidden /> : null}
                  {rec.locked ? "View subscription activity" : "Start this activity"} <ArrowRight size={15} aria-hidden />
                </LinkButton>
                {unmetSkills[0] && conceptFor(unmetSkills[0]) && (
                  <LinkButton href={`/paths/${pathId}/explore/${conceptFor(unmetSkills[0])!.id}${fromParam}`} variant="secondary">
                    <BookOpen size={15} aria-hidden /> Read: {conceptFor(unmetSkills[0])!.title}
                  </LinkButton>
                )}
              </div>
            </div>
          );
        })()}
        {rec?.type === "review" && (
          <div className="space-y-3">
            <p className="text-sm text-muted">{rec.reason}</p>
            <div className="flex flex-wrap gap-2">
              {rec.conceptId && (
                <LinkButton href={`/paths/${pathId}/explore/${rec.conceptId}${fromParam}`} variant="primary">
                  <BookOpen size={15} aria-hidden /> Review the explanation
                </LinkButton>
              )}
              {rec.otherActivityId && (
                <LinkButton href={`/paths/${pathId}/practice/${rec.otherActivityId}`} variant="secondary">
                  Practise another skill
                </LinkButton>
              )}
            </div>
          </div>
        )}
        {rec?.type === "complete" && (
          <div className="space-y-3">
            <p className="text-sm text-fg">Every required skill is Mastered. The path is complete.</p>
            <LinkButton href={`/paths/${pathId}/skills`} variant="primary">See your evidence</LinkButton>
          </div>
        )}
        {!rec && (
          <p className="text-sm text-muted">
            {mode === "preview" ? "In learner mode, the recommendation engine would suggest the next activity here." : "This is a sample from a path that is not fully included in this prototype."}
          </p>
        )}
        <div className="flex flex-wrap gap-2 border-t border-line pt-3">
          <Button variant="ghost" size="sm" onClick={onRetry}>
            <RotateCcw size={14} aria-hidden /> Revise and resubmit
          </Button>
          {mode === "learner" && (
            <LinkButton href={`/paths/${pathId}/skills`} variant="ghost" size="sm">
              Skill progress
            </LinkButton>
          )}
        </div>
      </section>
    </div>
  );
}

function CriterionCard({ title, skill, result, tone }: { title: string; skill: string; result: Evaluation["criteria"][number]; tone: "ok" | "warn" }) {
  return (
    <article className={cn("rounded-xl border p-4", tone === "ok" ? "border-ok/25 bg-ok-bg/40" : "border-warn/25 bg-warn-bg/40")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-semibold text-fg">{title}</p>
        <Badge>{skill}</Badge>
      </div>
      <p className="mt-2 text-sm text-fg">{result.feedback}</p>
      {result.evidence.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-subtle">In your response</p>
          <ul className="mt-1 space-y-1 text-sm text-muted">
            {result.evidence.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}
      {result.consequence && (
        <p className="mt-3 text-sm text-muted">
          <span className="font-medium text-fg">{tone === "ok" ? "Effect for users: " : "Practical consequence: "}</span>
          {result.consequence}
        </p>
      )}
    </article>
  );
}

function CritiqueSummary({ activity, detail }: { activity: Extract<Activity, { template: "critique" }>; detail: NonNullable<Evaluation["detail"]> & { kind: "critique" } }) {
  const h = (id: string) => activity.hotspots.find((x) => x.id === id)!;
  const groups: { title: string; ids: string[]; tone: string }[] = [
    { title: "Issues correctly identified", ids: detail.correctlyIdentified, tone: "text-ok" },
    { title: "Acceptable elements correctly recognised", ids: detail.correctlyAccepted, tone: "text-ok" },
    { title: "Issues missed", ids: detail.missed, tone: "text-bad" },
    { title: "Acceptable elements incorrectly flagged", ids: detail.wronglyFlagged, tone: "text-bad" },
    { title: "Right judgement, different reason expected", ids: detail.wrongReason, tone: "text-warn" },
  ];
  return (
    <section aria-labelledby="fb-critique" className="space-y-3">
      <h3 id="fb-critique" className="text-sm font-semibold uppercase tracking-wide text-subtle">Element by element</h3>
      {groups.filter((g) => g.ids.length).map((g) => (
        <div key={g.title} className="rounded-xl border border-line bg-surface p-4">
          <p className={cn("text-sm font-semibold", g.tone)}>{g.title} ({g.ids.length})</p>
          <ul className="mt-2 space-y-3">
            {g.ids.map((id) => (
              <li key={id} className="text-sm">
                <p className="font-medium text-fg">{h(id).label}</p>
                <p className="text-muted">{h(id).explanation}</p>
                <p className="mt-0.5 text-muted"><span className="text-fg">Improvement: </span>{h(id).improvement}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
