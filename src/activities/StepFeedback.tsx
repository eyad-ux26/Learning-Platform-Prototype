"use client";

import type { ReactNode } from "react";
import { Check, ChevronDown, Lightbulb, Minus, UserRound, X } from "lucide-react";
import { Confetti } from "@/components/Celebrate";
import { cn } from "@/components/ui";
import { useI18n } from "@/i18n";

export type StepVerdict = "held" | "missed" | "neutral";

/**
 * Feedback right after one step: a verdict you can read at a glance, then one concrete example of what happens,
 * then (only if wanted) the reasoning. Words are kept to the example; the preview beside it shows the result.
 */
export function StepFeedback({
  verdict,
  title,
  subtitle,
  example,
  exampleLabel,
  better,
  betterLabel,
  why,
  whyLabel,
}: {
  verdict: StepVerdict;
  title: string;
  /** What the learner chose, in a few words. */
  subtitle?: string;
  /** One concrete example of the effect (a user's experience). */
  example?: ReactNode;
  exampleLabel?: string;
  /** Shown when the step missed: what would have held up, in a few words. */
  better?: ReactNode;
  betterLabel?: string;
  /** The reasoning, folded away. */
  why?: ReactNode;
  whyLabel?: string;
}) {
  const { tr } = useI18n();
  const Icon = verdict === "held" ? Check : verdict === "missed" ? X : Minus;
  return (
    <div role="status" aria-live="polite" className="animate-rise space-y-3">
      <div className="flex items-center gap-3">
        <span className="relative shrink-0">
          <span
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full",
              verdict === "held" ? "verdict-pop bg-ok text-[#06281a]" : verdict === "missed" ? "shake border-2 border-sk-coral bg-bad-bg text-bad" : "bg-raised text-muted",
            )}
          >
            <Icon size={22} strokeWidth={3} aria-hidden />
          </span>
          {verdict === "held" && <Confetti />}
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("font-display text-xl font-extrabold leading-tight tracking-tight", verdict === "held" ? "text-ok" : verdict === "missed" ? "text-bad" : "text-fg")}>{title}</p>
          {subtitle && <p className="truncate text-[13px] text-muted">{subtitle}</p>}
        </div>
      </div>

      {example && <ExampleNote label={exampleLabel ?? tr("What happens")}>{example}</ExampleNote>}

      {better && <BetterNote label={betterLabel ?? tr("Holds up:")}>{better}</BetterNote>}

      {why && <WhyDetails label={whyLabel ?? tr("Why?")}>{why}</WhyDetails>}
    </div>
  );
}

/** One concrete example of the effect, told from the user's side. */
export function ExampleNote({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="flex gap-2.5 rounded-2xl bg-overlay p-3">
      <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sk-sky/20 text-sk-sky">
        <UserRound size={15} />
      </span>
      <div className="min-w-0">
        <figcaption className="font-mono text-[10.5px] font-semibold text-subtle">{label}</figcaption>
        <p className="text-sm leading-snug text-fg">{children}</p>
      </div>
    </figure>
  );
}

export function BetterNote({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-[13px] leading-snug text-fg">
      <Lightbulb size={15} className="mt-0.5 shrink-0 text-sk-amber" aria-hidden />
      <span>
        <span className="font-semibold">{label}</span> {children}
      </span>
    </p>
  );
}

/** The reasoning, folded away until asked for. */
export function WhyDetails({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details className="group rounded-xl border border-line px-3 py-2">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[13px] font-semibold text-accent">
        {label} <ChevronDown size={14} aria-hidden className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-2 text-[13px] leading-relaxed text-muted">{children}</div>
    </details>
  );
}
