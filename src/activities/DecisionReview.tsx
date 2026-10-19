"use client";

import { Check, ChevronDown, RotateCcw, X } from "lucide-react";
import { walkDecision } from "@/domain/assessment";
import type { DecisionActivity, DecisionChoice, Evaluation } from "@/domain/types";
import { playSfx } from "@/components/sfx";
import { cn } from "@/components/ui";
import { useI18n } from "@/i18n";

type Choices = { nodeId: string; choiceId: string }[];

const heldUp = (c: DecisionChoice) => c.signals.length > 0 && c.signals.every((s) => s.met);

/** Ship-review tickets, one per decision the learner made. The signals live on the chosen option, so `evaluation` is not needed. */
export function DecisionReview({
  activity,
  choices,
  selectedNodeId,
  onSelectNode,
}: {
  activity: DecisionActivity;
  choices: Choices;
  evaluation?: Evaluation;
  selectedNodeId?: string;
  onSelectNode: (nodeId: string) => void;
}) {
  const { tr } = useI18n();
  const walk = walkDecision(activity, { choices });
  return (
    <ol className="flex flex-col gap-2.5" aria-label={tr("Route")}>
      {walk.steps.map((s, i) => {
        const node = activity.nodes.find((n) => n.id === s.nodeId);
        const choice = node?.choices.find((c) => c.id === s.choiceId);
        if (!node || !choice) return null;
        const ok = heldUp(choice);
        const open = selectedNodeId === node.id;
        const better = node.choices.filter(heldUp).map((c) => c.label);
        const panelId = `${activity.id}-${node.id}-review`;
        return (
          <li key={node.id} className={cn("rounded-[18px] border-[1.5px] bg-surface", open ? "border-brand-strong" : ok ? "border-line" : "border-sk-coral/40")}>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => {
                playSfx("tap");
                onSelectNode(open ? "" : node.id);
              }}
              className="flex w-full items-center gap-3.5 rounded-[16px] px-4 py-3.5 text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]", ok ? "bg-ok-bg text-ok" : "bg-bad-bg text-bad")}>
                {ok ? <Check size={16} strokeWidth={2.6} aria-hidden /> : <RotateCcw size={16} strokeWidth={2.6} aria-hidden />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[11px] text-subtle">{tr("Decision {n} · {title}", { n: i + 1, title: node.title })}</span>
                <span className="block text-[15px] font-semibold leading-snug text-fg">{choice.label}</span>
              </span>
              <span className={cn("shrink-0 rounded-full px-2.5 py-1 font-mono text-xs font-semibold", ok ? "bg-ok-bg text-ok" : "bg-bad-bg text-bad")}>{ok ? tr("Held up") : tr("Reopened")}</span>
              <ChevronDown size={16} aria-hidden className={cn("shrink-0 text-subtle transition-transform", open && "rotate-180")} />
            </button>
            {open && (
              <div id={panelId} className="flex animate-rise flex-col gap-2.5 px-4 pb-4 ps-[3.875rem]">
                <p className="max-w-[32.5rem] rounded-2xl rounded-es-sm bg-overlay px-3 py-2.5 text-sm leading-snug text-fg">
                  <span className="block font-mono text-[11px] text-subtle">{tr("What happened")}</span>
                  {choice.consequence}
                </p>
                <ul className="flex flex-col gap-1.5">
                  {choice.signals.map((g, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm leading-snug text-fg">
                      <span className={cn("mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full", g.met ? "bg-ok-bg text-ok" : "bg-bad-bg text-bad")}>
                        {g.met ? <Check size={11} strokeWidth={3} aria-hidden /> : <X size={11} strokeWidth={3} aria-hidden />}
                        <span className="sr-only">{g.met ? tr("Met") : tr("Not met")}</span>
                      </span>
                      <span>{g.because}</span>
                    </li>
                  ))}
                </ul>
                {better.length > 0 && (
                  <p className="text-sm leading-relaxed text-muted">
                    <span className="font-semibold text-fg">{tr("What holds up.")} </span>
                    {better.join(" / ")}
                  </p>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
