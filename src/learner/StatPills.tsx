"use client";

import { useI18n } from "@/i18n";
import type { DayState, Progression } from "@/domain/progression";
import { cn } from "@/components/ui";

const BAR: Record<DayState, string> = { done: "#ff7d5c", freeze: "#5cc8ff", none: "#3a3a46" };

/** Seven bars, oldest first: coral = practised, sky = freeze, grey = none. Also stated in text. */
export function StreakPill({ p, className }: { p: Progression; className?: string }) {
  const { tr } = useI18n();
  const label = p.freezesUsed ? tr("Practice streak: {n} days, {f} freeze used", { n: p.streakDays, f: p.freezesUsed }) : tr("Practice streak: {n} days", { n: p.streakDays });
  return (
    <div title={label} role="img" aria-label={label} className={cn("flex items-center gap-2 rounded-full border border-line bg-raised px-3 py-1.5", className)}>
      <span className="flex items-end gap-[3px]" aria-hidden>
        {p.last7.map((d, i) => (
          <span key={i} className="w-1.5 rounded-[3px]" style={{ height: 10 + (i % 3) * 3, background: BAR[d] }} />
        ))}
      </span>
      <span className="font-mono text-[13px]">{p.streakDays}d</span>
    </div>
  );
}

export function RepPill({ p, className }: { p: Progression; className?: string }) {
  const { tr } = useI18n();
  return (
    <div title={tr("Rep: prototype scoring from your own attempts")} className={cn("flex items-center gap-1.5 rounded-full bg-warn-bg px-3 py-[7px] font-mono text-sm font-semibold text-sk-amber", className)}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2l10 10-10 10L2 12z" /></svg>
      <span aria-label={tr("{n} Rep", { n: p.rep.toLocaleString("en-US") })}>{p.rep.toLocaleString("en-US")}</span>
    </div>
  );
}

export function RankRing({ p, showText = true, className }: { p: Progression; showText?: boolean; className?: string }) {
  const { tr } = useI18n();
  const pct = Math.round(p.rankProgress * 100);
  const label = p.next ? tr("Rank: {rank}, {pct}% of the way to {next}", { rank: tr(p.rank.name), pct, next: tr(p.next.name) }) : tr("Rank: {rank}, the top rank", { rank: tr(p.rank.name) });
  const c = 2 * Math.PI * 16;
  return (
    <div title={label} role="img" aria-label={label} className={cn("flex items-center gap-2", className)}>
      <span className="relative h-10 w-10 shrink-0">
        <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
          <circle cx="20" cy="20" r="16" fill="none" stroke="#2c2c36" strokeWidth="4" />
          <circle cx="20" cy="20" r="16" fill="none" stroke="#7b6cff" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${p.rankProgress * c} ${c}`} transform="rotate(-90 20 20)" style={{ transition: "stroke-dasharray .4s ease" }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[11px] font-semibold">R{p.rankIndex + 1}</span>
      </span>
      {showText && (
        <span className="flex flex-col leading-[1.15]">
          <span className="text-[13px] font-semibold">{tr(p.rank.name)}</span>
          <span className="font-mono text-[11px] text-muted">{p.next ? `→ ${tr(p.next.name)}` : tr("Top rank")}</span>
        </span>
      )}
    </div>
  );
}
