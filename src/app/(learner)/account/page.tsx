"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { accessLabel, isSubscriptionActive } from "@/domain/access";
import { useApp } from "@/state/AppState";
import { Badge, Button, Card, Dialog, LinkButton, Notice, SectionHeading, inputClass } from "@/components/ui";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

export default function AccountPage() {
  const { learner, dispatch } = useApp();
  const upgraded = useSearchParams().get("upgraded");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const a = learner.access;
  const active = isSubscriptionActive(a);
  const prefs = learner.preferences;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">Account</h1>
      {upgraded && active && <Notice tone="ok" className="mt-5" icon={<CheckCircle2 size={16} />} title="Simulated upgrade complete">All paths and activities are now available for this demo learner.</Notice>}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card className="p-5" as="section" aria-labelledby="profile">
          <SectionHeading id="profile" title="Profile" level={2} action={<Badge>Fictional</Badge>} />
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="text-subtle">Name</dt><dd className="text-fg">{learner.name}</dd></div>
            <div><dt className="text-subtle">Email</dt><dd className="text-fg">{learner.email}</dd></div>
            <div><dt className="text-subtle">Role at work</dt><dd className="text-fg">{learner.title}</dd></div>
            <div><dt className="text-subtle">Prototype role</dt><dd className="text-fg capitalize">{learner.role}</dd></div>
          </dl>
          <p className="mt-4 text-xs text-subtle">Demo profiles are fictional. No real personal data is collected or stored.</p>
        </Card>

        <Card className="p-5" as="section" aria-labelledby="access">
          <SectionHeading id="access" title="Access" level={2} action={<Badge tone={active ? "ok" : a.plan === "expired" ? "warn" : "neutral"}>{accessLabel(a)}</Badge>} />
          <div className="mt-4 space-y-3 text-sm">
            {a.plan === "free" && (
              <>
                <p className="text-fg">You’re using free samples.</p>
                <p className="text-muted">Free samples are selected activities in several paths, plus the first lesson of the flagship path. Your evidence on them is kept if you subscribe.</p>
                <LinkButton href="/subscribe" variant="primary">Review plans</LinkButton>
              </>
            )}
            {a.plan === "expired" && (
              <>
                <p className="text-fg">Your subscription ended on {fmtDate(a.endedAt)}.</p>
                <p className="text-muted">Your evidence and history are kept. Free samples remain available.</p>
                <LinkButton href="/subscribe" variant="primary">Resubscribe (simulated)</LinkButton>
              </>
            )}
            {a.plan === "subscriber" && (
              <>
                <dl className="space-y-2">
                  <div className="flex justify-between gap-4"><dt className="text-subtle">Plan</dt><dd className="capitalize text-fg">{a.billing} · placeholder pricing</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-subtle">Since</dt><dd className="text-fg">{fmtDate(a.since)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-subtle">{a.cancelAtPeriodEnd ? "Access until" : "Renews"}</dt><dd className="text-fg">{fmtDate(a.periodEnd)} <span className="text-xs text-subtle">(illustrative)</span></dd></div>
                </dl>
                {a.cancelAtPeriodEnd ? (
                  <>
                    <Notice tone="warn" title="Cancellation scheduled">You keep full access until {fmtDate(a.periodEnd)}. After that, free samples and all your evidence remain available.</Notice>
                    <Button onClick={() => dispatch({ type: "resumeSubscription" })}>Keep subscription (simulated)</Button>
                  </>
                ) : (
                  <Button variant="subtle" onClick={() => setCancelOpen(true)}>Cancel subscription (simulated)</Button>
                )}
              </>
            )}
          </div>
        </Card>

        <Card className="p-5 md:col-span-2" as="section" aria-labelledby="prefs">
          <SectionHeading id="prefs" title="Learning preferences" level={2} />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Toggle id="p-expl" label="Suggest an explanation before practice" hint="When on, path overviews lead with Explore. You can always practise directly." checked={prefs.explanationsFirst} onChange={(v) => dispatch({ type: "setPreferences", prefs: { explanationsFirst: v } })} />
            <Toggle id="p-motion" label="Reduce motion" hint="Turns off interface animation, in addition to your device setting." checked={prefs.reducedMotion} onChange={(v) => dispatch({ type: "setPreferences", prefs: { reducedMotion: v } })} />
            <Toggle id="p-sound" label="Sound cues" hint="Short tones when you pick, apply or ship a design. Off if your device is muted." checked={prefs.sound !== false} onChange={(v) => dispatch({ type: "setPreferences", prefs: { sound: v } })} />
            <Toggle id="p-captions" label="Show transcripts by default" hint="Applies to video lessons when they are available." checked={prefs.captions} onChange={(v) => dispatch({ type: "setPreferences", prefs: { captions: v } })} />
            <div>
              <label htmlFor="p-goal" className="block text-sm font-medium text-fg">Weekly practice goal</label>
              <select id="p-goal" value={prefs.weeklyGoalMinutes} onChange={(e) => dispatch({ type: "setPreferences", prefs: { weeklyGoalMinutes: Number(e.target.value) } })} className={`${inputClass} mt-1.5`}>
                {[30, 60, 90, 120].map((m) => <option key={m} value={m}>{m} minutes</option>)}
              </select>
              <p className="mt-1 text-xs text-subtle">Used only for gentle reminders in a future version. Not tracked in this prototype.</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 md:col-span-2" as="section" aria-labelledby="demo">
          <SectionHeading id="demo" title="Demo data" level={2} />
          <p className="mt-2 text-sm text-muted">Progress for this fictional learner is stored only in this browser. Switch learners or reset everything from <Link href="/demo" className="text-accent hover:underline">Demo controls</Link>.</p>
          <Button variant="subtle" className="mt-4" onClick={() => setResetOpen(true)}>Reset this learner to their starting scenario</Button>
        </Card>
      </div>

      <Dialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel subscription?"
        description={a.plan === "subscriber" ? `This is a simulation. Access continues until ${fmtDate(a.periodEnd)} (illustrative), then reverts to free samples. Your evidence is kept.` : undefined}
        footer={<><Button variant="ghost" onClick={() => setCancelOpen(false)}>Keep subscription</Button><Button variant="danger" onClick={() => { dispatch({ type: "cancelSubscription", now: new Date().toISOString() }); setCancelOpen(false); }}>Cancel at period end</Button></>}
      />
      <Dialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title={`Reset ${learner.name}?`}
        description="Attempts, evidence, unfinished work and access return to this learner’s seeded scenario. Other demo learners are not affected."
        footer={<><Button variant="ghost" onClick={() => setResetOpen(false)}>Cancel</Button><Button variant="danger" onClick={() => { dispatch({ type: "resetLearner", learnerId: learner.id }); setResetOpen(false); }}>Reset learner</Button></>}
      />
    </div>
  );
}

function Toggle({ id, label, hint, checked, onChange }: { id: string; label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-fg">{label}</label>
        {hint && <p className="mt-0.5 text-xs text-subtle">{hint}</p>}
      </div>
      <button id={id} type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors ${checked ? "border-accent bg-accent" : "border-line-strong bg-raised"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-fg transition-all ${checked ? "start-[22px] bg-accent-ink" : "start-0.5"}`} />
      </button>
    </div>
  );
}
