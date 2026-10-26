"use client";

import { Check, X } from "lucide-react";
import { useI18n } from "@/i18n";
import { cn } from "@/components/ui";

/**
 * held / missed: a step that was checked (it holds up or not). placed: a step answered with no right or wrong of its own
 * (Design Bench options are judged as a combination). current: where the learner is. todo: still to come.
 */
export type BrickState = "held" | "missed" | "placed" | "current" | "todo";
export interface Brick {
  state: BrickState;
  /** What the step is, for screen readers and the tooltip. */
  label: string;
  /** An answered step that is also where the learner is (Design Bench lets you go back to a step). */
  here?: boolean;
}

const FILL: Record<BrickState, string> = {
  held: "bg-ok text-[#06281a]",
  missed: "bg-bad-bg text-bad border-[1.5px] border-sk-coral",
  placed: "bg-brand-strong text-white",
  current: "border-[1.5px] border-dashed border-brand-strong bg-brand-deep",
  todo: "border-[1.5px] border-dashed border-line-strong",
};
const STUD: Record<BrickState, string> = {
  held: "bg-ok",
  missed: "bg-sk-coral",
  placed: "bg-brand-strong",
  current: "bg-brand-strong/60",
  todo: "bg-line-strong",
};

/**
 * The activity as a build: one brick per step. Each answered step drops a brick in, so the bar is both the progress
 * ("where am I") and the reward. Results are shown by icon as well as colour.
 */
export function BuildBar({ bricks, className }: { bricks: Brick[]; className?: string }) {
  const { tr } = useI18n();
  const cur = bricks.findIndex((b) => b.state === "current" || b.here);
  const done = bricks.filter((b) => b.state === "held" || b.state === "missed" || b.state === "placed").length;
  const label = cur >= 0 ? tr("Step {n} of {m}", { n: cur + 1, m: bricks.length }) : tr("{n} of {m} done", { n: done, m: bricks.length });
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <ol aria-label={`${tr("Your build")} · ${label}`} className="flex min-w-0 flex-1 items-end gap-1 pt-1">
        {bricks.map((b, i) => (
          <li key={i} title={b.label} className="relative min-w-2.5 flex-1" aria-current={b.state === "current" || b.here ? "step" : undefined}>
            <span key={b.state} className={cn("relative block", (b.state === "held" || b.state === "missed" || b.state === "placed") && "brick-drop")}>
              {/* Two studs on top make it read as a brick. */}
              <span aria-hidden className={cn("absolute -top-1 start-[18%] h-1 w-[22%] min-w-1 rounded-t-[2px]", STUD[b.state])} />
              <span aria-hidden className={cn("absolute -top-1 end-[18%] h-1 w-[22%] min-w-1 rounded-t-[2px]", STUD[b.state])} />
              <span className={cn("flex h-3.5 items-center justify-center rounded-[4px] lg:h-4", FILL[b.state], (b.state === "current" || b.here) && "animate-pulse-ring", b.here && "ring-2 ring-white/70")}>
                {b.state === "held" && <Check size={10} strokeWidth={3.4} aria-hidden />}
                {b.state === "missed" && <X size={10} strokeWidth={3.4} aria-hidden />}
              </span>
            </span>
            <span className="sr-only">
              {tr("Step {n}", { n: i + 1 })}: {b.state === "held" ? tr("held up") : b.state === "missed" ? tr("missed") : b.state === "placed" ? tr("done") : b.state === "current" ? tr("you are here") : tr("to do")}
            </span>
          </li>
        ))}
      </ol>
      <span aria-hidden className="shrink-0 font-mono text-[11px] font-semibold text-muted">
        <span className="text-fg">{cur >= 0 ? cur + 1 : done}</span>/{bricks.length}
      </span>
    </div>
  );
}
