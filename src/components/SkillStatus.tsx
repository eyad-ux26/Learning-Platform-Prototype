import { CheckCircle2, CircleDashed, CircleDot } from "lucide-react";
import { useI18n } from "@/i18n";
import type { SkillProgress, SkillStatus } from "@/domain/mastery";
import { t } from "@/i18n/en";
import { cn } from "./ui";

const style: Record<SkillStatus, { cls: string; Icon: typeof CheckCircle2 }> = {
  "not-demonstrated": { cls: "text-subtle border-line bg-raised", Icon: CircleDashed },
  developing: { cls: "text-warn border-warn/30 bg-warn-bg", Icon: CircleDot },
  mastered: { cls: "text-ok border-ok/30 bg-ok-bg", Icon: CheckCircle2 },
};

/** Status uses an icon and text, never colour alone. */
export function SkillStatusBadge({ status, className }: { status: SkillStatus; className?: string }) {
  const { tr } = useI18n();
  const { cls, Icon } = style[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium", cls, className)}>
      <Icon size={13} aria-hidden />
      {tr(t.status[status])}
    </span>
  );
}

/** Segmented evidence meter: one segment per required context, filled when met. Not a percentage. */
export function EvidenceMeter({ progress, compact }: { progress: SkillProgress; compact?: boolean }) {
  const { tr } = useI18n();
  const segments = Array.from({ length: progress.requiredContexts }, (_, i) => progress.contextsMet[i]);
  const met = Math.min(progress.contextsMet.length, progress.requiredContexts);
  const label = progress.independentContexts > 0 ? tr("{n} of {m} contexts met, including an independent attempt", { n: met, m: progress.requiredContexts }) : tr("{n} of {m} contexts met", { n: met, m: progress.requiredContexts });
  return (
    <div className="flex items-center gap-2" aria-label={label} role="img">
      <div className="flex gap-1">
        {segments.map((seg, i) => (
          <span
            key={i}
            className={cn(
              "h-2 rounded-full",
              compact ? "w-5" : "w-8",
              seg ? (seg.independent ? "bg-ok" : "bg-ok/60") : "border border-line-strong bg-canvas",
            )}
          />
        ))}
      </div>
      {!compact && <span className="text-xs text-muted">{label}</span>}
    </div>
  );
}
