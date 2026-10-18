"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, RotateCcw, ShieldAlert, Trash2, UserCheck } from "lucide-react";
import { FLAGSHIP_ID } from "@/content/flagship";
import { scenarios } from "@/content/seed";
import { accessLabel, isSubscriptionActive } from "@/domain/access";
import { PRODUCT_NAME } from "@/i18n/en";
import { getPathView, useApp } from "@/state/AppState";
import { Badge, Button, Card, Dialog, Notice, SectionHeading, cn } from "@/components/ui";

export default function DemoControlsPage() {
  const { state, learner, dispatch } = useApp();
  const [resetAll, setResetAll] = useState(false);
  const [resetId, setResetId] = useState<string | null>(null);
  const learners = useMemo(() => scenarios.map((s) => Object.values(state.learners).find((l) => l.scenarioId === s.id)!).filter(Boolean), [state.learners]);
  const flagship = getPathView(state, learner, FLAGSHIP_ID);
  const active = isSubscriptionActive(learner.access);

  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg"><ArrowLeft size={15} aria-hidden /> {PRODUCT_NAME}</Link>
          <span className="text-subtle" aria-hidden>/</span>
          <span className="text-sm font-semibold text-fg">Demo controls</span>
          <Badge tone="warn" className="ms-auto">Prototype only</Badge>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Demo controls</h1>
        <p className="mt-2 max-w-2xl text-muted">Switch between seeded scenarios to review each journey. Every learner’s progress is stored separately in this browser.</p>
        <Notice tone="warn" className="mt-5" icon={<ShieldAlert size={16} />} title="Not authentication">
          Switching people and roles here is a demonstration. Production access will require real sign-in and server-side authorisation.
        </Notice>

        <section className="mt-10" aria-labelledby="scenarios">
          <SectionHeading id="scenarios" title="Scenarios" />
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {learners.map((l) => {
              const s = scenarios.find((x) => x.id === l.scenarioId)!;
              const v = getPathView(state, l, FLAGSHIP_ID);
              const current = l.id === learner.id;
              return (
                <li key={l.id}>
                  <Card className={cn("flex h-full flex-col p-4", current && "border-accent/50")}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-fg">{s.label}</p>
                        <p className="text-sm text-muted">{l.name} · <span className="capitalize">{l.role}</span></p>
                      </div>
                      {current && <Badge tone="accent">Active</Badge>}
                    </div>
                    <p className="mt-2 text-sm text-muted">{s.description}</p>
                    <p className="mt-2 text-xs text-subtle">
                      {accessLabel(l.access)} · {v ? `${v.completion.mastered.length} of ${v.bundle.requiredSkillIds.length} flagship skills Mastered` : ""} · {l.attempts.length} attempts
                    </p>
                    <div className="mt-auto flex flex-wrap gap-2 pt-4">
                      {!current && (
                        <Button size="sm" variant="primary" onClick={() => dispatch({ type: "switchLearner", learnerId: l.id })}>
                          <UserCheck size={14} aria-hidden /> Switch to {l.name.split(" ")[0]}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setResetId(l.id)}>
                        <RotateCcw size={14} aria-hidden /> Reset
                      </Button>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/" className="text-sm font-medium text-accent hover:underline">Open learner app as {learner.name}</Link>
            {learner.role !== "learner" && <><span className="text-subtle">·</span><Link href="/admin" className="text-sm font-medium text-accent hover:underline">Open admin workspace</Link></>}
          </div>
        </section>

        <section className="mt-10" aria-labelledby="inspect">
          <SectionHeading id="inspect" title="Current simulated access" />
          <Card className="mt-4 overflow-x-auto p-5">
            <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <Row k="Learner" v={`${learner.name} (${learner.id})`} />
              <Row k="Role" v={learner.role} />
              <Row k="Plan" v={learner.access.plan} />
              <Row k="Subscription active now" v={active ? "Yes" : "No"} />
              {learner.access.plan === "subscriber" && <Row k="Period end (illustrative)" v={new Date(learner.access.periodEnd).toLocaleDateString()} />}
              {learner.access.plan === "subscriber" && <Row k="Cancels at period end" v={learner.access.cancelAtPeriodEnd ? "Yes" : "No"} />}
              {learner.access.plan === "expired" && <Row k="Ended" v={new Date(learner.access.endedAt).toLocaleDateString()} />}
              <Row k="Can open admin workspace" v={learner.role === "learner" ? "No" : learner.role === "editor" ? "Yes (edit and preview; no publishing)" : "Yes (full)"} />
              <Row k="Flagship enrollment" v={learner.enrollments[FLAGSHIP_ID] ? `Version ${learner.enrollments[FLAGSHIP_ID].contentVersion}` : "Not enrolled"} />
              <Row k="Flagship activities available" v={flagship ? `${flagship.bundle.activities.filter((a) => flagship.canAccess(a.id)).length} of ${flagship.bundle.activities.length}` : "—"} />
              <Row k="Unfinished drafts" v={String(Object.keys(learner.drafts).length)} />
              <Row k="Local demo events" v={String(state.demoEvents.length)} />
            </dl>
          </Card>
        </section>

        <section className="mt-10" aria-labelledby="danger">
          <SectionHeading id="danger" title="Reset" />
          <p className="mt-2 text-sm text-muted">Restores every learner, all content (including admin edits and published versions) and clears local demo events.</p>
          <Button variant="danger" className="mt-4" onClick={() => setResetAll(true)}><Trash2 size={15} aria-hidden /> Reset all prototype data</Button>
        </section>
      </main>

      <Dialog
        open={resetAll}
        onOpenChange={setResetAll}
        title="Reset all prototype data?"
        description="All learners return to their seeded scenarios, all content edits and published versions are discarded, and local demo events are cleared. This cannot be undone."
        footer={<><Button variant="ghost" onClick={() => setResetAll(false)}>Cancel</Button><Button variant="danger" onClick={() => { dispatch({ type: "resetAll" }); setResetAll(false); }}>Reset everything</Button></>}
      />
      <Dialog
        open={!!resetId}
        onOpenChange={(o) => !o && setResetId(null)}
        title={`Reset ${resetId ? state.learners[resetId]?.name : ""}?`}
        description="This learner returns to their seeded scenario. Other learners and content are not affected."
        footer={<><Button variant="ghost" onClick={() => setResetId(null)}>Cancel</Button><Button variant="danger" onClick={() => { if (resetId) dispatch({ type: "resetLearner", learnerId: resetId }); setResetId(null); }}>Reset learner</Button></>}
      />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line pb-2">
      <dt className="text-subtle">{k}</dt>
      <dd className="text-end font-mono text-xs text-fg">{v}</dd>
    </div>
  );
}
