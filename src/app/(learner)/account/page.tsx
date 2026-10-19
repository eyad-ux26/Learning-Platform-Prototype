"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { accessLabel, isSubscriptionActive } from "@/domain/access";
import { useI18n } from "@/i18n";
import { useApp } from "@/state/AppState";
import { Badge, Button, Card, Dialog, LinkButton, Notice, SectionHeading, inputClass } from "@/components/ui";

export default function AccountPage() {
  const { learner, dispatch } = useApp();
  const { tr, L, date: fmtDate } = useI18n();
  const upgraded = useSearchParams().get("upgraded");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const a = learner.access;
  const active = isSubscriptionActive(a);
  const prefs = learner.preferences;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{tr("Account")}</h1>
      {upgraded && active && <Notice tone="ok" className="mt-5" icon={<CheckCircle2 size={16} />} title={tr("Simulated upgrade complete")}>{tr("All paths and activities are now available for this demo learner.")}</Notice>}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card className="p-5" as="section" aria-labelledby="profile">
          <SectionHeading id="profile" title={tr("Profile")} level={2} action={<Badge>{tr("Fictional")}</Badge>} />
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="text-subtle">{tr("Name")}</dt><dd className="text-fg">{learner.name}</dd></div>
            <div><dt className="text-subtle">{tr("Email")}</dt><dd className="text-fg">{learner.email}</dd></div>
            <div><dt className="text-subtle">{tr("Role at work")}</dt><dd className="text-fg">{L(learner.title)}</dd></div>
            <div><dt className="text-subtle">{tr("Prototype role")}</dt><dd className="text-fg capitalize">{L(learner.role)}</dd></div>
          </dl>
          <p className="mt-4 text-xs text-subtle">{tr("Demo profiles are fictional. No real personal data is collected or stored.")}</p>
        </Card>

        <Card className="p-5" as="section" aria-labelledby="access">
          <SectionHeading id="access" title={tr("Access")} level={2} action={<Badge tone={active ? "ok" : a.plan === "expired" ? "warn" : "neutral"}>{L(accessLabel(a))}</Badge>} />
          <div className="mt-4 space-y-3 text-sm">
            {a.plan === "free" && (
              <>
                <p className="text-fg">{tr("You’re using free samples.")}</p>
                <p className="text-muted">{tr("Free samples are selected activities in several paths, plus the first lesson of the flagship path. Your evidence on them is kept if you subscribe.")}</p>
                <LinkButton href="/subscribe" variant="primary">{tr("Review plans")}</LinkButton>
              </>
            )}
            {a.plan === "expired" && (
              <>
                <p className="text-fg">{tr("Your subscription ended on {date}.", { date: fmtDate(a.endedAt) })}</p>
                <p className="text-muted">{tr("Your evidence and history are kept. Free samples remain available.")}</p>
                <LinkButton href="/subscribe" variant="primary">{tr("Resubscribe (simulated)")}</LinkButton>
              </>
            )}
            {a.plan === "subscriber" && (
              <>
                <dl className="space-y-2">
                  <div className="flex justify-between gap-4"><dt className="text-subtle">{tr("Plan")}</dt><dd className="capitalize text-fg">{a.billing === "monthly" ? tr("monthly · placeholder pricing") : tr("annual · placeholder pricing")}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-subtle">{tr("Since")}</dt><dd className="text-fg">{fmtDate(a.since)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-subtle">{a.cancelAtPeriodEnd ? tr("Access until") : tr("Renews")}</dt><dd className="text-fg">{fmtDate(a.periodEnd)} <span className="text-xs text-subtle">{tr("(illustrative)")}</span></dd></div>
                </dl>
                {a.cancelAtPeriodEnd ? (
                  <>
                    <Notice tone="warn" title={tr("Cancellation scheduled")}>{tr("You keep full access until {date}. After that, free samples and all your evidence remain available.", { date: fmtDate(a.periodEnd) })}</Notice>
                    <Button onClick={() => dispatch({ type: "resumeSubscription" })}>{tr("Keep subscription (simulated)")}</Button>
                  </>
                ) : (
                  <Button variant="subtle" onClick={() => setCancelOpen(true)}>{tr("Cancel subscription (simulated)")}</Button>
                )}
              </>
            )}
          </div>
        </Card>

        <Card className="p-5 md:col-span-2" as="section" aria-labelledby="prefs">
          <SectionHeading id="prefs" title={tr("Learning preferences")} level={2} />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Toggle id="p-expl" label={tr("Suggest an explanation before practice")} hint={tr("When on, path overviews lead with Explore. You can always practise directly.")} checked={prefs.explanationsFirst} onChange={(v) => dispatch({ type: "setPreferences", prefs: { explanationsFirst: v } })} />
            <Toggle id="p-motion" label={tr("Reduce motion")} hint={tr("Turns off interface animation, in addition to your device setting.")} checked={prefs.reducedMotion} onChange={(v) => dispatch({ type: "setPreferences", prefs: { reducedMotion: v } })} />
            <Toggle id="p-sound" label={tr("Sound cues")} hint={tr("Short tones when you pick, apply or ship a design. Off if your device is muted.")} checked={prefs.sound !== false} onChange={(v) => dispatch({ type: "setPreferences", prefs: { sound: v } })} />
            <Toggle id="p-captions" label={tr("Show transcripts by default")} hint={tr("Applies to video lessons when they are available.")} checked={prefs.captions} onChange={(v) => dispatch({ type: "setPreferences", prefs: { captions: v } })} />
            <div>
              <label htmlFor="p-goal" className="block text-sm font-medium text-fg">{tr("Weekly practice goal")}</label>
              <select id="p-goal" value={prefs.weeklyGoalMinutes} onChange={(e) => dispatch({ type: "setPreferences", prefs: { weeklyGoalMinutes: Number(e.target.value) } })} className={`${inputClass} mt-1.5`}>
                {[30, 60, 90, 120].map((m) => <option key={m} value={m}>{tr("{n} minutes", { n: m })}</option>)}
              </select>
              <p className="mt-1 text-xs text-subtle">{tr("Used only for gentle reminders in a future version. Not tracked in this prototype.")}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 md:col-span-2" as="section" aria-labelledby="demo">
          <SectionHeading id="demo" title={tr("Demo data")} level={2} />
          <p className="mt-2 text-sm text-muted">{tr("Progress for this fictional learner is stored only in this browser. Switch learners or reset everything from")} <Link href="/demo" className="text-accent hover:underline">{tr("Demo controls")}</Link>.</p>
          <Button variant="subtle" className="mt-4" onClick={() => setResetOpen(true)}>{tr("Reset this learner to their starting scenario")}</Button>
        </Card>
      </div>

      <Dialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={tr("Cancel subscription?")}
        description={a.plan === "subscriber" ? tr("This is a simulation. Access continues until {date} (illustrative), then reverts to free samples. Your evidence is kept.", { date: fmtDate(a.periodEnd) }) : undefined}
        footer={<><Button variant="ghost" onClick={() => setCancelOpen(false)}>{tr("Keep subscription")}</Button><Button variant="danger" onClick={() => { dispatch({ type: "cancelSubscription", now: new Date().toISOString() }); setCancelOpen(false); }}>{tr("Cancel at period end")}</Button></>}
      />
      <Dialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title={tr("Reset {name}?", { name: learner.name })}
        description={tr("Attempts, evidence, unfinished work and access return to this learner’s seeded scenario. Other demo learners are not affected.")}
        footer={<><Button variant="ghost" onClick={() => setResetOpen(false)}>{tr("Cancel")}</Button><Button variant="danger" onClick={() => { dispatch({ type: "resetLearner", learnerId: learner.id }); setResetOpen(false); }}>{tr("Reset learner")}</Button></>}
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
