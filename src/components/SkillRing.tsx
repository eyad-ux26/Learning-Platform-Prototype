import { BadgeCheck, Eye, PenLine, Search, ShieldCheck, type LucideIcon } from "lucide-react";
"use client";

import { useI18n } from "@/i18n";
import type { SkillProgress } from "@/domain/mastery";
import { cn } from "./ui";

/** Each skill in a path gets its own hue and glyph, by position. Status is also stated in text wherever a ring appears. */
const HUES = ["#5cc8ff", "#ffc94d", "#5ee0a8", "#ff7d5c"];
const GLYPHS: LucideIcon[] = [Eye, Search, PenLine, ShieldCheck, BadgeCheck];
export const skillHue = (index: number) => HUES[index % HUES.length];
export const SkillGlyph = ({ index, size = 20 }: { index: number; size?: number }) => {
  const G = GLYPHS[index % GLYPHS.length];
  return <G size={size} aria-hidden />;
};

const R = 26;
const CIRC = 2 * Math.PI * R;
const GAP = 8;

/**
 * Segmented ring: one arc per required context, filled when that context is met.
 * Hints-assisted contexts are drawn lighter. This is not a percentage.
 */
export function SkillRing({ index, progress, size = 72, className, animateNew }: { index: number; progress: SkillProgress; size?: number; className?: string; animateNew?: boolean }) {
  const { tr } = useI18n();
  const n = Math.max(1, progress.requiredContexts);
  const seg = CIRC / n - GAP;
  const hue = skillHue(index);
  const met = Math.min(progress.contextsMet.length, n);
  const label = progress.independentContexts > 0 ? tr("{n} of {m} contexts met, including an independent attempt", { n: met, m: n }) : tr("{n} of {m} contexts met", { n: met, m: n });
  return (
    <span className={cn("relative inline-block shrink-0", className)} style={{ width: size, height: size, color: hue }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
        {Array.from({ length: n }, (_, i) => {
          const ctx = progress.contextsMet[i];
          const rot = -90 + (360 / n) * i + (GAP / CIRC) * 180;
          const common = { cx: 32, cy: 32, r: R, fill: "none", strokeWidth: 6, strokeDasharray: `${seg} ${CIRC - seg}`, transform: `rotate(${rot} 32 32)` };
          return (
            <g key={i}>
              <circle {...common} stroke="#2c2c36" />
              {ctx && (
                <circle
                  {...common}
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeOpacity={ctx.independent ? 1 : 0.55}
                  className={animateNew && i === met - 1 ? "ring-seg-new" : undefined}
                />
              )}
            </g>
          );
        })}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        <SkillGlyph index={index} size={Math.round(size / 3)} />
      </span>
    </span>
  );
}

/** Single-value ring for counters such as "skills mastered". */
export function CountRing({ value, max, size = 44, label, className }: { value: number; max: number; size?: number; label: string; className?: string }) {
  const c = 2 * Math.PI * 18;
  const f = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <span className={cn("relative inline-block shrink-0", className)} style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden>
        <circle cx="22" cy="22" r="18" fill="none" stroke="#2c2c36" strokeWidth="4" />
        <circle cx="22" cy="22" r="18" fill="none" stroke="#7b6cff" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${f * c} ${c}`} transform="rotate(-90 22 22)" style={{ transition: "stroke-dasharray .35s ease" }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-semibold text-fg">{value}/{max}</span>
    </span>
  );
}
