"use client";

import type { DesignBenchActivity, Evaluation } from "@/domain/types";
import { cn } from "@/components/ui";
import { ProposalPreview, type PreviewState } from "./ProposalPreview";

export function DesignBenchControls({
  activity,
  selections,
  onSelect,
  readOnly,
  evaluation,
}: {
  activity: DesignBenchActivity;
  selections: Record<string, string>;
  onSelect: (decisionId: string, optionId: string) => void;
  readOnly?: boolean;
  evaluation?: Evaluation;
}) {
  const done = activity.decisions.filter((d) => selections[d.id]).length;
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted" aria-live="polite">
        {done} of {activity.decisions.length} decisions made. Each choice updates the preview.
      </p>
      {activity.decisions.map((d, i) => (
        <fieldset key={d.id} className="space-y-2" disabled={readOnly}>
          <legend className="mb-2 flex items-baseline gap-2 text-sm font-semibold text-fg">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-raised text-[11px] text-muted">{i + 1}</span>
            {d.prompt}
          </legend>
          <div className="space-y-2">
            {d.options.map((o) => {
              const checked = selections[d.id] === o.id;
              return (
                <label
                  key={o.id}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent",
                    checked ? "border-accent/60 bg-accent/5" : "border-line bg-surface hover:border-line-strong",
                    readOnly && "cursor-default",
                  )}
                >
                  <input type="radio" name={`${activity.id}-${d.id}`} value={o.id} checked={checked} onChange={() => onSelect(d.id, o.id)} className="mt-1 h-4 w-4 shrink-0 accent-[#8fb3ff]" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-fg">{o.label}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted">{o.tradeoff}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
      {evaluation && <p className="text-xs text-subtle">Your submitted choices are shown. Use “Revise and resubmit” to change them.</p>}
    </div>
  );
}

export function DesignBenchStage({
  activity,
  selections,
  preview,
  onPreview,
  readOnly,
}: {
  activity: DesignBenchActivity;
  selections: Record<string, string>;
  preview: PreviewState;
  onPreview: (s: PreviewState) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-fg">Interface preview</h3>
        <p className="text-xs text-subtle">Interactive. Try it the way a user would.</p>
      </div>
      <ProposalPreview activity={activity} selections={selections} state={preview} onChange={onPreview} readOnly={readOnly} />
    </div>
  );
}
