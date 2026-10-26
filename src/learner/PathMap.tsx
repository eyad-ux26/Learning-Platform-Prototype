"use client";

import Link from "next/link";
import { Check, GitFork, Layers, Lock, Play, RotateCcw, ScanSearch, Trophy, type LucideIcon } from "lucide-react";
import type { ActivityTemplate, LearnerRecord } from "@/domain/types";
import { useI18n } from "@/i18n";
import { cn } from "@/components/ui";
import type { PathView } from "@/state/AppState";
import { activityState } from "./whereAmI";

const TEMPLATE_ICON: Record<ActivityTemplate, LucideIcon> = { "design-bench": Layers, critique: ScanSearch, decision: GitFork };
/** Sideways offsets that make the column wind like a path. */
const WIND = [0, 46, 70, 46, 0, -46, -70, -46];

/**
 * The path as a winding map: one node per activity, the learner's place marked "You're here", and the certificate at
 * the end. Every state has its own icon as well as colour. `window` shows only the nodes around the current one (Home).
 */
export function PathMap({ view, learner, currentId, window: win, className }: { view: PathView; learner: LearnerRecord; currentId?: string; window?: number; className?: string }) {
  const { tr } = useI18n();
  const { bundle } = view;
  const base = `/paths/${bundle.meta.id}`;
  const all = bundle.activities;
  const curIndex = Math.max(0, all.findIndex((a) => a.id === currentId));
  const from = win ? Math.max(0, Math.min(curIndex - 1, all.length - win)) : 0;
  const to = win ? Math.min(all.length, from + win) : all.length;
  const shown = all.slice(from, to);
  const complete = view.completion.complete;
  const isPreview = bundle.meta.availability === "preview";

  return (
    <ol aria-label={tr("Path map")} className={cn("flex flex-col items-center gap-3 py-2", className)}>
      {from > 0 && <li aria-hidden className="h-6 w-1 rounded-full bg-[repeating-linear-gradient(to_bottom,#3a3a46_0_6px,transparent_6px_12px)]" />}
      {shown.map((a, k) => {
        const i = from + k;
        const state = activityState(view, learner, a);
        const here = a.id === currentId;
        const locked = !view.canAccess(a.id) && !bundle.meta.freeSampleActivityIds.includes(a.id);
        const Icon = state === "shipped" ? Check : state === "reopened" ? RotateCcw : locked ? Lock : here ? Play : TEMPLATE_ICON[a.template];
        const stateText = state === "shipped" ? tr("Shipped") : state === "reopened" ? tr("Reopened") : state === "progress" ? tr("In progress") : locked ? tr("Subscription") : tr("Not started");
        return (
          <li key={a.id} className="path-node flex w-full justify-center" style={{ ["--x" as string]: `${WIND[i % WIND.length]}px` }}>
            <Link
              href={`${base}/practice/${a.id}`}
              aria-current={here ? "step" : undefined}
              aria-label={`${tr("Activity {n} of {m}", { n: i + 1, m: all.length })}: ${a.title} · ${here ? tr("You’re here") : stateText}`}
              className="group flex w-40 flex-col items-center gap-1.5 text-center"
            >
              {here && (
                <span className="here-bob relative mb-1 rounded-xl bg-white px-3 py-1 font-mono text-[11px] font-bold text-[#2b2370] shadow">
                  {state === "progress" ? tr("Resume") : view.pathAttempts.length === 0 ? tr("Start") : tr("You’re here")}
                  <span aria-hidden className="absolute -bottom-1 start-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-white rtl:translate-x-1/2" />
                </span>
              )}
              <span
                className={cn(
                  "flex items-center justify-center rounded-full transition-transform group-hover:-translate-y-0.5 group-active:translate-y-0.5",
                  here ? "h-[74px] w-[74px] animate-pulse-ring" : "h-16 w-16",
                  state === "shipped" && "bg-ok text-[#06281a] shadow-[0_5px_0_#2f9e70]",
                  state === "reopened" && "bg-sk-coral text-[#2b0f06] shadow-[0_5px_0_#b9502f]",
                  (state === "progress" || (here && state === "todo")) && "bg-brand-strong text-white shadow-[0_5px_0_#4a3fb8]",
                  state === "todo" && !here && "border-2 border-line-strong bg-raised text-muted shadow-[0_5px_0_#24242d]",
                )}
              >
                <Icon size={here ? 30 : 24} strokeWidth={2.6} aria-hidden fill={Icon === Play ? "currentColor" : "none"} />
              </span>
              <span className={cn("line-clamp-2 text-[12.5px] leading-tight", here ? "font-bold text-fg" : "font-medium text-muted")}>{a.title}</span>
            </Link>
          </li>
        );
      })}
      {to < all.length && <li aria-hidden className="h-6 w-1 rounded-full bg-[repeating-linear-gradient(to_bottom,#3a3a46_0_6px,transparent_6px_12px)]" />}
      {!isPreview && to === all.length && (
        <li className="flex w-full justify-center pt-1">
          <Link href={`${base}/certificate`} className="group flex w-40 flex-col items-center gap-1.5 text-center" aria-label={complete ? tr("Certificate: earned") : tr("Certificate: master every skill to earn it")}>
            <span className="relative flex h-[72px] w-[72px] items-center justify-center transition-transform group-hover:-translate-y-0.5" aria-hidden>
              <svg viewBox="0 0 56 56" width="72" height="72" className="absolute inset-0">
                <path d="M28 3 L50 15.5 V40.5 L28 53 L6 40.5 V15.5 Z" fill={complete ? "#ffc94d" : "#1c1c23"} stroke={complete ? "#fff" : "#3a3a46"} strokeWidth="2" strokeDasharray={complete ? undefined : "4 3"} strokeLinejoin="round" />
              </svg>
              <Trophy size={28} className={cn("relative", complete ? "text-[#2b1f00]" : "text-subtle")} />
              {!complete && <Lock size={13} className="absolute bottom-2.5 end-2.5 text-muted" />}
            </span>
            <span className={cn("text-[12.5px] font-semibold leading-tight", complete ? "text-sk-amber" : "text-muted")}>{tr("Certificate")}</span>
          </Link>
        </li>
      )}
    </ol>
  );
}
