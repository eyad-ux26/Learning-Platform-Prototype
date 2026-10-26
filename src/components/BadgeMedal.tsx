"use client";

import { Award, Flame, Lock, Rocket, Send, Sparkles, Trophy, Undo2, type LucideIcon } from "lucide-react";
import type { BadgeId } from "@/domain/badges";
import { BADGES } from "@/domain/badges";
import { useI18n } from "@/i18n";
import { cn } from "./ui";

export const BADGE_LOOK: Record<BadgeId, { Icon: LucideIcon; hue: string }> = {
  "first-brief": { Icon: Send, hue: "#5cc8ff" },
  "first-ship": { Icon: Rocket, hue: "#7b6cff" },
  "clean-run": { Icon: Sparkles, hue: "#5ee0a8" },
  comeback: { Icon: Undo2, hue: "#ff7d5c" },
  "streak-3": { Icon: Flame, hue: "#ff7d5c" },
  "first-mastery": { Icon: Award, hue: "#ffc94d" },
  "path-complete": { Icon: Trophy, hue: "#ffc94d" },
};

/** A hexagonal medal. Earned medals are filled in their hue; locked ones are an outline with a lock, so state never rests on colour. */
export function BadgeMedal({ id, earned, size = 56, pop, showName = true, className }: { id: BadgeId; earned: boolean; size?: number; pop?: boolean; showName?: boolean; className?: string }) {
  const { tr } = useI18n();
  const def = BADGES.find((b) => b.id === id)!;
  const { Icon, hue } = BADGE_LOOK[id];
  const label = `${tr(def.name)}: ${earned ? tr(def.detail) : tr("Not earned yet")}`;
  return (
    <span className={cn("inline-flex w-[76px] flex-col items-center gap-1.5 text-center", className)} title={label}>
      <span role="img" aria-label={label} className={cn("relative flex items-center justify-center", pop && "animate-pop")} style={{ width: size, height: size }}>
        <svg viewBox="0 0 56 56" width={size} height={size} aria-hidden className="absolute inset-0">
          <path
            d="M28 3 L50 15.5 V40.5 L28 53 L6 40.5 V15.5 Z"
            fill={earned ? hue : "transparent"}
            stroke={earned ? "rgba(255,255,255,.55)" : "#3a3a46"}
            strokeWidth={earned ? 2 : 2}
            strokeDasharray={earned ? undefined : "4 3"}
            strokeLinejoin="round"
          />
        </svg>
        {earned ? <Icon size={size * 0.4} strokeWidth={2.4} className="relative text-[#101014]" aria-hidden /> : <Lock size={size * 0.3} className="relative text-subtle" aria-hidden />}
      </span>
      {showName && <span className={cn("text-[11.5px] font-semibold leading-tight", earned ? "text-fg" : "text-subtle")}>{tr(def.name)}</span>}
    </span>
  );
}
