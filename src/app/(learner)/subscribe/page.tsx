"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { isSubscriptionActive } from "@/domain/access";
import { useApp } from "@/state/AppState";
import { PLANS } from "@/learner/plans";
import { Badge, Button, Dialog, LinkButton, Notice, cn } from "@/components/ui";

const safeReturn = (r: string | null) => (r && r.startsWith("/") && !r.startsWith("//") ? r : null);

export default function SubscribePage() {
  const { learner, dispatch } = useApp();
  const router = useRouter();
  const returnTo = safeReturn(useSearchParams().get("return"));
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [confirm, setConfirm] = useState(false);
  const active = isSubscriptionActive(learner.access);

  const upgrade = () => {
    dispatch({ type: "subscribe", billing, now: new Date().toISOString() });
    setConfirm(false);
    router.push(returnTo ?? "/account?upgraded=1");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Badge tone="warn">Simulation · placeholder pricing</Badge>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">One subscription for every path</h1>
      <p className="mt-2 max-w-2xl text-muted">
        The subscription includes all Explore lessons and practice activities across the library. Free samples stay free, and evidence you collect on them is kept when you subscribe.
      </p>

      {returnTo && !active && (
        <Notice tone="accent" className="mt-6" title="You’ll go straight back">
          After the simulated upgrade you return to the activity you were trying to open.
        </Notice>
      )}
      {active && (
        <Notice tone="ok" className="mt-6" title="You already have access" action={<LinkButton href={returnTo ?? "/"} variant="primary" size="sm">Continue</LinkButton>}>
          Your current demo access includes everything in the library.
        </Notice>
      )}

      <fieldset className="mt-8 grid gap-4 sm:grid-cols-2" disabled={active}>
        <legend className="sr-only">Choose a plan</legend>
        {(Object.keys(PLANS) as (keyof typeof PLANS)[]).map((id) => {
          const p = PLANS[id];
          const selected = billing === id;
          return (
            <label key={id} className={cn("relative cursor-pointer rounded-2xl border p-5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent", selected ? "border-accent/60 bg-accent/5" : "border-line bg-surface")}>
              <input type="radio" name="plan" value={id} checked={selected} onChange={() => setBilling(id)} className="sr-only" />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-fg">{p.label}</span>
                {selected && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-ink"><Check size={13} aria-hidden /></span>}
              </div>
              <p className="mt-3"><span className="text-3xl font-semibold text-fg">{p.price}</span> <span className="text-sm text-muted">{p.per}</span></p>
              <p className="mt-1 text-xs font-medium text-warn">Placeholder price for review</p>
              <p className="mt-3 text-sm text-muted">{p.note}</p>
            </label>
          );
        })}
      </fieldset>

      <ul className="mt-8 grid gap-2 text-sm text-muted sm:grid-cols-2">
        {["All paths, lessons and activities", "Skill evidence and history across paths", "Targeted alternative practice", "New paths as they are published"].map((x) => (
          <li key={x} className="flex items-center gap-2"><Check size={15} className="text-ok" aria-hidden /> {x}</li>
        ))}
      </ul>

      {!active && (
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button variant="primary" size="lg" onClick={() => setConfirm(true)}>Simulate {PLANS[billing].label.toLowerCase()} upgrade</Button>
          <LinkButton href={returnTo ? "/" : "/account"} variant="ghost" size="lg">Not now</LinkButton>
        </div>
      )}
      <p className="mt-4 flex items-center gap-2 text-xs text-subtle"><ShieldCheck size={13} aria-hidden /> No checkout and no payment details. This prototype only changes the demo access state in your browser.</p>

      <Dialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Simulate upgrade?"
        description={`This switches ${learner.name} (fictional) to a ${PLANS[billing].label.toLowerCase()} subscription in this browser. No payment is taken and no payment details are collected.`}
        footer={<><Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button><Button variant="primary" onClick={upgrade}>Simulate upgrade</Button></>}
      />
    </div>
  );
}
