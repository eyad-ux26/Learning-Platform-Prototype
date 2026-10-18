import { BookOpen, Compass, Eye, Layers, Network, MousePointer2, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import type { CoverId, IconId } from "@/domain/types";
import { cn } from "./ui";

export const ICONS: Record<IconId, LucideIcon> = {
  shield: ShieldCheck,
  eye: Eye,
  pointer: MousePointer2,
  layers: Layers,
  network: Network,
  compass: Compass,
  book: BookOpen,
  sparkle: Sparkles,
};

export const COVER_IDS: CoverId[] = ["rings", "grid", "steps", "nodes", "layers", "waves"];

const hue: Record<CoverId, string> = {
  rings: "#8fb3ff",
  grid: "#7fd1b9",
  steps: "#e8bd6a",
  nodes: "#c3a6ff",
  layers: "#f0a07a",
  waves: "#86c5e8",
};

/** Quiet geometric covers. Replaceable placeholders, not brand illustrations. */
export function PathCover({ cover, icon, className }: { cover: CoverId; icon: IconId; className?: string }) {
  const Icon = ICONS[icon] ?? BookOpen;
  const c = hue[cover] ?? hue.rings;
  return (
    <div className={cn("relative overflow-hidden border-b border-line bg-raised", className)} aria-hidden>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice">
        {cover === "rings" && [30, 52, 74, 96].map((r) => <circle key={r} cx="250" cy="60" r={r} fill="none" stroke={c} strokeOpacity={0.18} />)}
        {cover === "grid" &&
          Array.from({ length: 9 }).map((_, i) => (
            <g key={i}>
              <line x1={i * 40} y1="0" x2={i * 40} y2="120" stroke={c} strokeOpacity={0.12} />
              <line x1="0" y1={i * 20} x2="320" y2={i * 20} stroke={c} strokeOpacity={0.12} />
            </g>
          ))}
        {cover === "steps" && [0, 1, 2, 3, 4].map((i) => <rect key={i} x={150 + i * 30} y={90 - i * 18} width="30" height={30 + i * 18} fill={c} fillOpacity={0.06 + i * 0.03} />)}
        {cover === "nodes" &&
          [[200, 30], [260, 70], [230, 100], [290, 30], [170, 80]].map(([x, y], i, arr) => (
            <g key={i}>
              <line x1={x} y1={y} x2={arr[(i + 1) % arr.length][0]} y2={arr[(i + 1) % arr.length][1]} stroke={c} strokeOpacity={0.2} />
              <circle cx={x} cy={y} r="5" fill={c} fillOpacity={0.35} />
            </g>
          ))}
        {cover === "layers" && [0, 1, 2].map((i) => <rect key={i} x={170 + i * 20} y={20 + i * 22} width="110" height="50" rx="8" fill="none" stroke={c} strokeOpacity={0.25} />)}
        {cover === "waves" && [0, 1, 2, 3].map((i) => <path key={i} d={`M0 ${60 + i * 14} Q 80 ${30 + i * 14} 160 ${60 + i * 14} T 320 ${60 + i * 14}`} fill="none" stroke={c} strokeOpacity={0.18} />)}
      </svg>
      <div className="relative flex h-full items-center ps-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line-strong bg-canvas/70" style={{ color: c }}>
          <Icon size={22} />
        </span>
      </div>
    </div>
  );
}
