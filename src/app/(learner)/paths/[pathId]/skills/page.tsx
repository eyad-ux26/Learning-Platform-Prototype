"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, CircleAlert, Copy, Eye, Lightbulb, Lock } from "lucide-react";
import { skillsAssessedBy } from "@/domain/assessment";
import { recommendNext } from "@/domain/recommend";
import { t } from "@/i18n/en";
import { usePathView } from "@/state/AppState";
import { EvidenceMeter, SkillStatusBadge } from "@/components/SkillStatus";
import { Badge, Card, EmptyState, LinkButton, Notice, SectionHeading } from "@/components/ui";
import { Unavailable } from "@/learner/Unavailable";

export default function SkillsPage() {
  const { pathId } = useParams<{ pathId: string }>();
  const view = usePathView(pathId);
  if (!view || !view.visible) return <Unavailable title="This path isn’t available" />;
  const { bundle } = view;
  const actTitle = (id: string) => bundle.activities.find((a) => a.id === id)?.title ?? id;
  const actContext = (id: string) => bundle.activities.find((a) => a.id === id)?.contextLabel ?? id;
  const isPreviewPath = bundle.meta.availability === "preview";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-subtle">
        <Link href={`/paths/${pathId}`} className="hover:text-fg">{bundle.meta.title}</Link> <span aria-hidden>/</span> <span className="text-muted">Skills and evidence</span>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">Skills and evidence</h1>

      {!isPreviewPath && (
        <Notice tone={view.completion.complete ? "ok" : "neutral"} className="mt-5" icon={view.completion.complete ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />} title={view.completion.complete ? "Path complete" : "Path not complete yet"}>
          {view.completion.reason}
        </Notice>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {bundle.skills.map((s) => {
            const p = view.progress[s.id];
            const rec = !isPreviewPath
              ? recommendNext({ bundle: { ...bundle, requiredSkillIds: [s.id] }, evidence: view.pathEvidence, attempts: view.pathAttempts, canAccess: view.canAccess })
              : undefined;
            const recAct = rec?.type === "activity" ? bundle.activities.find((a) => a.id === rec.activityId) : undefined;
            const eligible = bundle.activities.filter((a) => skillsAssessedBy(a, bundle.skills).includes(s.id));
            return (
              <Card key={s.id} className="p-5" as="section" aria-labelledby={`skill-${s.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 id={`skill-${s.id}`} className="text-base font-semibold text-fg">{s.name}</h2>
                  <SkillStatusBadge status={p.status} />
                </div>
                <p className="mt-1 text-sm text-muted">{s.description}</p>
                {s.criteria.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-muted">
                    {s.criteria.map((c) => <li key={c.id} className="flex gap-2"><span className="text-subtle">•</span>{c.statement}</li>)}
                  </ul>
                )}
                <div className="mt-4 grid gap-4 rounded-xl border border-line bg-raised p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Evidence required</p>
                    <p className="mt-1 text-sm text-fg">Criteria met in {p.requiredContexts} different contexts, at least {p.requiredIndependent} without hints or a revealed solution.</p>
                    <div className="mt-2"><EvidenceMeter progress={p} /></div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Evidence collected</p>
                    {p.contextsMet.length ? (
                      <ul className="mt-1 space-y-1 text-sm">
                        {p.contextsMet.map((c) => (
                          <li key={c.contextKey} className="text-fg">
                            {actContext(c.activityId)} <span className="text-xs text-subtle">· {c.independent ? "independent" : "with hints"}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-sm text-muted">None yet.</p>
                    )}
                    <p className="mt-1 text-xs text-subtle">{p.attemptsAssessed} {p.attemptsAssessed === 1 ? "attempt" : "attempts"} assessed this skill{p.practiceOnlyAttempts ? `, ${p.practiceOnlyAttempts} practice-only` : ""}.</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-fg">{p.reason}</p>
                {p.practiceRecommended && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-warn"><AlertTriangle size={14} aria-hidden /> Further practice recommended after your most recent attempt.</p>
                )}
                {recAct && (p.status !== "mastered" || p.practiceRecommended) && (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <LinkButton href={`/paths/${pathId}/practice/${recAct.id}`} variant="secondary" size="sm">
                      {rec?.type === "activity" && rec.locked && <Lock size={13} aria-hidden />} Next practice: {recAct.title}
                    </LinkButton>
                    <span className="text-xs text-subtle">{recAct.contextLabel}</span>
                  </div>
                )}
                {rec?.type === "review" && (p.status !== "mastered") && <p className="mt-3 text-sm text-muted">{rec.reason}</p>}
                {isPreviewPath && <p className="mt-3 text-xs text-subtle">{eligible.length ? "Only the free sample assesses this skill in the prototype." : t.access.notIncluded}</p>}
              </Card>
            );
          })}
        </div>

        <aside className="space-y-6">
          <Card className="p-5" as="section" aria-labelledby="rule">
            <h2 id="rule" className="text-sm font-semibold text-fg">How evidence counts</h2>
            <p className="mt-2 text-sm text-fg">{t.rule.short}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {t.rule.details.map((d) => <li key={d} className="flex gap-2"><span className="text-subtle">•</span>{d}</li>)}
            </ul>
          </Card>
        </aside>
      </div>

      <section className="mt-12" aria-labelledby="history">
        <SectionHeading id="history" title="Activity history" eyebrow={`${view.pathAttempts.length} attempts`} />
        {view.pathAttempts.length === 0 ? (
          <div className="mt-4"><EmptyState title="No attempts yet">Submitted activities appear here with the evidence they produced.</EmptyState></div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-[var(--radius-card)] border border-line">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">Submitted attempts, newest first</caption>
              <thead className="bg-surface text-start text-xs text-subtle">
                <tr>
                  <th scope="col" className="px-4 py-3 text-start font-medium">Submitted</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">Activity</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">Result by skill</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">Counts as</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {[...view.pathAttempts].reverse().map((a) => (
                  <tr key={a.id} className="align-top">
                    <td className="px-4 py-3 text-muted">{new Date(a.submittedAt).toLocaleString()}<div className="text-xs text-subtle">Content v{a.contentVersion}</div></td>
                    <td className="px-4 py-3"><Link href={`/paths/${pathId}/practice/${a.activityId}`} className="text-fg hover:underline">{actTitle(a.activityId)}</Link><div className="text-xs text-subtle">{actContext(a.activityId)}</div></td>
                    <td className="px-4 py-3">
                      <ul className="space-y-1">
                        {a.evaluation.skills.map((s) => (
                          <li key={s.skillId} className="flex items-center gap-1.5 text-xs">
                            {s.met ? <CheckCircle2 size={13} className="text-ok" aria-hidden /> : <CircleAlert size={13} className="text-warn" aria-hidden />}
                            <span className="text-muted">{bundle.skills.find((x) => x.id === s.skillId)?.name}</span>
                            <span className="sr-only">{s.met ? "met" : "not met"}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3">
                      {a.duplicateOf ? <Badge tone="warn" icon={<Copy size={11} aria-hidden />}>Duplicate · no new evidence</Badge> : a.solutionRevealed ? <Badge tone="warn" icon={<Eye size={11} aria-hidden />}>Practice only</Badge> : a.hintsUsed ? <Badge icon={<Lightbulb size={11} aria-hidden />}>Evidence · with hints</Badge> : <Badge tone="ok">Independent evidence</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
