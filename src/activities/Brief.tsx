"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Check, Target } from "lucide-react";
import type { Activity, ActivityTemplate, ClientBrief } from "@/domain/types";
import { useI18n } from "@/i18n";
import { Button, cn } from "@/components/ui";

/** What the designer (the learner) answers once they have read the brief. */
const REPLY: Record<ActivityTemplate, string> = {
  "design-bench": "Got it. I’ll make the calls one at a time and check each one in the live preview.",
  critique: "Got it. I’ll go through each highlighted part and judge it.",
  decision: "Got it. I’ll make the decisions one at a time.",
};

/** Sentences of a (localised) paragraph, grouped into chat-sized bubbles of at most two sentences. */
function bubbles(text: string): string[] {
  const sentences = text.split(/(?<=[.!?؟])\s+(?=\S)/).filter(Boolean);
  const out: string[] = [];
  for (const s of sentences) {
    const last = out[out.length - 1];
    if (last !== undefined && !/[.!?؟]\s/.test(last) && last.length + s.length < 170) out[out.length - 1] = `${last} ${s}`;
    else out.push(s);
  }
  return out;
}

/** The brief to show: authored for the activity, or built from its scenario and task. `activity` is the displayed (localised) one. */
export function briefOf(activity: Activity, fallbackFrom: string): ClientBrief {
  return activity.brief ?? { from: fallbackFrom, messages: bubbles(activity.scenario), ask: activity.task };
}

const bubble = "max-w-[92%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed";

/**
 * The brief as a chat: every message is the client's, the main ask is highlighted, and the designer's reply
 * appears once the learner says they have read it. `children` continues the thread (decision steps).
 */
export function ClientChat({ activity, read, children, className }: { activity: Activity; read: boolean; children?: ReactNode; className?: string }) {
  const { tr } = useI18n();
  const brief = briefOf(activity, tr("Client"));
  return (
    <div className={cn("rounded-[22px] border-[1.5px] border-brand-strong bg-surface p-4", className)}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sk-amber text-sm font-bold text-[#2b1f00]" aria-hidden>{brief.from.trim()[0]}</span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-fg">{brief.from}</p>
          <p className="truncate font-mono text-[11px] text-subtle">{tr("Client brief")} · {activity.contextLabel}</p>
        </div>
      </div>
      <ol className="mt-3 flex flex-col gap-2" aria-label={tr("Messages from the client")}>
        {brief.messages.map((m, i) => (
          <li key={i} className="flex">
            <p className={cn(bubble, "rounded-es-sm bg-overlay text-fg")}>{m}</p>
          </li>
        ))}
        <li className="flex pt-3">
          <div className={cn(bubble, "relative rounded-es-sm border-[1.5px] border-brand-strong bg-brand-deep font-semibold text-fg")}>
            <span className="absolute -top-2.5 start-3 inline-flex items-center gap-1 rounded-md bg-brand-strong px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none text-white">
              <Target size={10} aria-hidden /> {tr("The ask")}
            </span>
            <p className="pt-1">{brief.ask}</p>
          </div>
        </li>
        {activity.constraints.length > 0 && (
          <li className="flex">
            <details className={cn(bubble, "group rounded-es-sm bg-overlay text-fg")}>
              <summary className="cursor-pointer list-none font-medium text-accent">
                {tr("Keep in mind ({n})", { n: activity.constraints.length })} <span aria-hidden className="inline-block transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <ul className="mt-1.5 list-disc space-y-1 ps-4 text-[13px] text-muted">
                {activity.constraints.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </details>
          </li>
        )}
        {read && (
          <li className="animate-rise flex flex-col items-end">
            <span className="mb-1 font-mono text-[10px] text-subtle">{tr("You · designer")}</span>
            <p className={cn(bubble, "rounded-ee-sm bg-brand font-semibold text-white")}>{tr(REPLY[activity.template])}</p>
          </li>
        )}
      </ol>
      {children && <div className="mt-2.5">{children}</div>}
    </div>
  );
}

const reducedMotion = () =>
  typeof window !== "undefined" && (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.reducedMotion === "true");

/**
 * The brief opens on its own first. When the learner says they have read it, the designer replies, then the card
 * flies to where the brief lives in the workspace (`target`): the Brief column on wide screens, the Brief tab otherwise.
 */
export function BriefIntro({ activity, title, onRead, onDone, target }: { activity: Activity; title: string; onRead: () => void; onDone: () => void; target: () => HTMLElement | null | undefined }) {
  const { tr } = useI18n();
  const [stage, setStage] = useState<"reading" | "replied" | "flying">("reading");
  const [fly, setFly] = useState<CSSProperties>();
  const cardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    buttonRef.current?.focus();
    const t = timers.current;
    return () => {
      document.body.style.overflow = prev;
      t.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const confirm = () => {
    if (stage !== "reading") return;
    setStage("replied");
    onRead();
    const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    if (reducedMotion()) {
      later(700, onDone);
      return;
    }
    later(1100, () => {
      const card = cardRef.current;
      const to = target();
      const a = card?.getBoundingClientRect();
      const b = to?.getBoundingClientRect();
      if (!card || !a || !b || b.width === 0) return onDone();
      const scale = Math.min(b.width / a.width, 1);
      setFly({
        transformOrigin: "top left",
        transform: `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${scale})`,
        opacity: b.width / a.width < 0.5 ? 0 : 0.6,
        transition: "transform 560ms cubic-bezier(0.65, 0, 0.35, 1), opacity 560ms ease-in",
      });
      setStage("flying");
      later(580, onDone);
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="brief-intro-title"
      onKeyDown={(e) => e.key === "Escape" && confirm()}
    >
      <div aria-hidden className={cn("absolute inset-0 bg-canvas/85 backdrop-blur-sm transition-opacity duration-500", stage === "flying" && "opacity-0")} />
      <div ref={cardRef} style={fly} className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-[440px] flex-col">
        <p className={cn("mb-2 flex items-center gap-2 font-mono text-xs font-semibold text-accent transition-opacity", stage === "flying" && "opacity-0")}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-strong text-[11px] text-white" aria-hidden>1</span>
          <span id="brief-intro-title" className="truncate">{tr("New brief")} · {title}</span>
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-[22px]">
          <ClientChat activity={activity} read={stage !== "reading"} className="shadow-[0_24px_64px_rgba(0,0,0,0.55)]" />
        </div>
        <div className={cn("mt-3 flex-none transition-opacity", stage === "flying" && "opacity-0")}>
          <Button ref={buttonRef} variant="primary" size="lg" className="w-full" onClick={confirm} disabled={stage !== "reading"}>
            <Check size={16} aria-hidden /> {tr("I’ve read the brief")}
          </Button>
        </div>
      </div>
    </div>
  );
}
