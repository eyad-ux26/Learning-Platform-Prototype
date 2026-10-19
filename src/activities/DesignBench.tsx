"use client";

import { useState } from "react";
import {
  ArrowLeft, ArrowRight, BadgeCheck, Ban, ClipboardCheck, Clock, Eye, FilePen, Files, GitCompare, Hash, History, Info, ListChecks, MessageSquareQuote, MousePointerClick, PenLine,
  Percent, RefreshCw, Rows3, ScanSearch, Settings, ShieldAlert, ShieldCheck, Sparkles, SquareDashed, TextCursorInput, Undo2, Zap, type LucideIcon,
} from "lucide-react";
import type { Behaviour, DesignBenchActivity, DesignDimension, Evaluation } from "@/domain/types";
import { playSfx } from "@/components/sfx";
import { Kbd, cn } from "@/components/ui";
import { ProposalPreview, type PreviewState } from "./ProposalPreview";

/** One glyph per behaviour token, so every option can be recognised at a glance. */
const ICON: Record<Behaviour, LucideIcon> = {
  "as-fact": TextCursorInput, chip: Sparkles, provisional: SquareDashed,
  none: Ban, percent: Percent, generic: ShieldAlert, specific: ScanSearch,
  tooltip: Info, quote: MessageSquareQuote, source: Files, reason: FilePen, trace: Rows3,
  regenerate: RefreshCw, "inline-edit": PenLine, alternatives: ListChecks, settings: Settings,
  auto: Zap, accept: MousePointerClick, dialog: ClipboardCheck, "on-save": BadgeCheck, review: Eye, typed: Hash,
  undo: Undo2, history: History, "undo-history": Undo2, "delayed-send": Clock, rollback: RefreshCw,
  count: Hash, sample: Eye, diff: GitCompare,
};

/** Dimensions map to the same four hues as the path's skills. */
const DIMENSION: Record<DesignDimension, { label: string; hue: string }> = {
  presentation: { label: "Look", hue: "#5cc8ff" },
  uncertainty: { label: "Doubt", hue: "#5cc8ff" },
  evidence: { label: "Proof", hue: "#ffc94d" },
  explanation: { label: "Reason", hue: "#ffc94d" },
  correction: { label: "Fix", hue: "#5ee0a8" },
  recovery: { label: "Undo", hue: "#5ee0a8" },
  commitment: { label: "Commit", hue: "#ff7d5c" },
  scope: { label: "Scope", hue: "#ff7d5c" },
};

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
  const total = activity.decisions.length;
  const done = activity.decisions.filter((d) => selections[d.id]).length;
  const firstOpen = Math.max(0, activity.decisions.findIndex((d) => !selections[d.id]));
  const [picked, setPicked] = useState<number | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const step = Math.min(total - 1, picked ?? firstOpen);
  const d = activity.decisions[step];
  const dim = DIMENSION[d.dimension];
  const go = (i: number) => {
    playSfx("tap");
    setPicked(Math.max(0, Math.min(total - 1, i)));
    setTip(null);
  };
  const choose = (optionId: string) => {
    if (readOnly) return;
    playSfx("pick");
    onSelect(d.id, optionId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between font-mono text-xs text-muted" aria-live="polite">
        <span>{done} of {total} decisions made</span>
        <span className="flex gap-1" aria-hidden>
          {activity.decisions.map((x, i) => (
            <span key={x.id} className={cn("h-1.5 rounded-full transition-all", i === step ? "w-5" : "w-1.5", selections[x.id] ? "bg-brand-strong" : "bg-line-strong")} />
          ))}
        </span>
      </div>

      {/* Layers panel: every decision, what you chose, jump to any. */}
      <ol aria-label="Decisions" className="overflow-hidden rounded-2xl border border-line bg-surface">
        {activity.decisions.map((x, i) => {
          const chosen = x.options.find((o) => o.id === selections[x.id]);
          const dm = DIMENSION[x.dimension];
          const Icon = chosen ? ICON[chosen.behaviour] : SquareDashed;
          return (
            <li key={x.id} className="border-b border-line last:border-b-0">
              <button
                type="button"
                onClick={() => go(i)}
                aria-current={i === step ? "step" : undefined}
                className={cn("flex w-full items-center gap-3 px-3 py-2 text-start text-sm transition-colors", i === step ? "bg-brand-deep text-white" : "text-muted hover:bg-raised hover:text-fg")}
              >
                <span className="font-mono text-[11px] text-subtle">{i + 1}</span>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ color: dm.hue, background: `${dm.hue}1f` }}><Icon size={14} aria-hidden /></span>
                <span className="font-mono text-xs" style={{ color: dm.hue }}>{dm.label}</span>
                <span className="min-w-0 flex-1 truncate text-end text-xs">{chosen ? chosen.label : "Not chosen"}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <fieldset
        key={d.id}
        disabled={readOnly}
        className="animate-rise space-y-3"
        onKeyDown={(e) => {
          const n = Number(e.key);
          if (!(e.target as HTMLElement).matches("input[type=radio]") || !(n >= 1 && n <= d.options.length)) return;
          e.preventDefault();
          choose(d.options[n - 1].id);
        }}
      >
        <legend className="font-mono text-xs font-semibold" style={{ color: dim.hue }}>{dim.label} · step {step + 1} of {total}</legend>
        <h3 className="font-display text-2xl font-extrabold leading-tight tracking-tight text-fg">{d.prompt}</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {d.options.map((o, i) => {
            const checked = selections[d.id] === o.id;
            const Icon = ICON[o.behaviour];
            return (
              <div key={o.id} className="relative">
                <label
                  className={cn(
                    "flex min-h-28 cursor-pointer flex-col justify-between gap-3 rounded-2xl border-[1.5px] p-3 transition-[transform,border-color,background-color] hover:-translate-y-0.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent",
                    checked ? "border-brand-strong bg-brand-deep text-white" : "border-line bg-surface text-fg hover:border-line-strong",
                    readOnly && "cursor-default hover:translate-y-0",
                  )}
                >
                  <input type="radio" className="sr-only" name={`${activity.id}-${d.id}`} value={o.id} checked={checked} onChange={() => choose(o.id)} />
                  <span className="flex items-center justify-between">
                    <Icon size={22} aria-hidden style={{ color: checked ? "#fff" : dim.hue }} />
                    <Kbd className={cn("hidden sm:inline", checked && "border-white/40 text-white")}>{i + 1}</Kbd>
                  </span>
                  <span className="text-sm font-semibold leading-snug">{o.label}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setTip(tip === o.id ? null : o.id)}
                  aria-expanded={tip === o.id}
                  aria-label={`Trade-offs: ${o.label}`}
                  className="absolute bottom-2 end-2 flex h-6 w-6 items-center justify-center rounded-md border border-line-strong bg-canvas/60 font-mono text-xs text-muted hover:text-fg"
                >
                  ±
                </button>
              </div>
            );
          })}
        </div>
        {tip && (
          <p className="animate-rise rounded-xl border border-line-strong bg-raised p-3 text-sm leading-relaxed text-muted" role="note">
            <span className="font-semibold text-fg">{d.options.find((o) => o.id === tip)?.label}. </span>
            {d.options.find((o) => o.id === tip)?.tradeoff}
          </p>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={() => go(step - 1)} disabled={step === 0} aria-label="Previous decision" className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-raised text-muted hover:text-fg disabled:opacity-40">
            <ArrowLeft size={16} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => go(step + 1)}
            disabled={step === total - 1 || !selections[d.id]}
            className={cn("flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors", selections[d.id] && step < total - 1 ? "bg-brand text-white hover:bg-brand-strong" : "bg-line text-subtle")}
          >
            {step === total - 1 ? "Last decision" : "Next decision"} <ArrowRight size={15} aria-hidden />
          </button>
        </div>
      </fieldset>
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
