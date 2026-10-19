"use client";

import { Check, ChevronDown, RotateCcw } from "lucide-react";
import type { CritiqueActivity, Evaluation, Verdict } from "@/domain/types";
import { cn } from "@/components/ui";
import { playSfx } from "@/components/sfx";
import { useI18n } from "@/i18n";
import type { CritiqueReviews } from "./Critique";

/** Ship review: one expandable ticket per element, closed when verdict and reason were judged right, reopened otherwise. */
export function CritiqueReview({
  activity,
  reviews,
  selected,
  onSelect,
}: {
  activity: CritiqueActivity;
  reviews: CritiqueReviews;
  evaluation?: Evaluation;
  selected?: string;
  onSelect: (id: string) => void;
}) {
  const { tr } = useI18n();
  const reasonLabel = (id?: string) => (id ? activity.reasons.find((x) => x.id === id)?.label : undefined);
  const verdictText = (v?: Verdict) => (v ? tr(v === "acceptable" ? "acceptable" : "problematic") : tr("not reviewed"));

  return (
    <ol className="flex flex-col gap-2.5" aria-label={tr("Elements")}>
      {activity.hotspots.map((h, i) => {
        const rv = reviews[h.id];
        const ok = rv?.verdict === h.verdict && !!rv.reason && h.correctReasons.includes(rv.reason);
        const open = selected === h.id;
        const bodyId = `ticket-${h.id}`;
        const you = [verdictText(rv?.verdict), reasonLabel(rv?.reason)].filter(Boolean).join(" · ");
        const expected = [verdictText(h.verdict), reasonLabel(h.correctReasons[0])].filter(Boolean).join(" · ");
        return (
          <li key={h.id} className={cn("rounded-[18px] border-[1.5px] bg-surface", open ? "border-brand-strong" : ok ? "border-line" : "border-[#5a2f24]")}>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={bodyId}
              onClick={() => {
                playSfx("tap");
                onSelect(open ? "" : h.id);
              }}
              className="flex w-full items-center gap-3.5 rounded-[16px] bg-transparent px-4 py-3.5 text-start active:translate-y-px"
            >
              <span aria-hidden className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]", ok ? "bg-ok-bg text-ok" : "bg-bad-bg text-bad")}>
                {ok ? <Check size={16} strokeWidth={2.6} /> : <RotateCcw size={16} strokeWidth={2.6} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[11px] text-muted">{tr("Element {n}", { n: i + 1 })}</span>
                <span className="block text-[15.5px] font-semibold text-fg">{h.label}</span>
              </span>
              <span className={cn("shrink-0 rounded-full px-2.5 py-1 font-mono text-xs font-semibold", ok ? "bg-ok-bg text-ok" : "bg-bad-bg text-bad")}>{ok ? tr("Closed") : tr("Reopened")}</span>
              <ChevronDown size={16} aria-hidden className={cn("shrink-0 text-muted transition-transform duration-200", open && "rotate-180")} />
            </button>
            {open && (
              <div id={bodyId} className="flex animate-rise flex-col gap-2.5 px-4 pb-4 sm:ps-[62px]">
                <div className="flex flex-wrap gap-2 font-mono text-xs text-fg">
                  <span className="rounded-lg bg-raised px-2.5 py-1">{tr("You")} · {you}</span>
                  <span className="rounded-lg bg-raised px-2.5 py-1">{tr("Expected")} · {expected}</span>
                </div>
                <p className="leading-relaxed text-fg">{h.explanation}</p>
                <p className="leading-relaxed text-muted">
                  <span className="font-semibold text-fg">{tr("Suggested improvement.")} </span>
                  {h.improvement}
                </p>
                {rv?.note && <p className="text-xs text-subtle">{tr("Your note (stored, not assessed): “{note}”", { note: rv.note })}</p>}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
