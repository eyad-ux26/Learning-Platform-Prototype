"use client";

import { Check, Info, AlertTriangle, Sparkles, X } from "lucide-react";
import type { Block, BlockTone, Screen } from "@/domain/types";
import { cn } from "@/components/ui";
import { useProductI18n as useI18n } from "@/i18n";

export type HotspotMark = "unreviewed" | "acceptable" | "problematic" | "correct" | "incorrect";

export interface HotspotMode {
  selected?: string;
  onSelect: (id: string) => void;
  marks: Record<string, HotspotMark>;
  numbers: Record<string, number>;
  labels: Record<string, string>;
}

/** Non-interactive highlighting of parts of a screen by hotspot id, with a name tag on the active ones. */
export interface HighlightMode {
  /** hotspot id → tag shown on the highlighted part. */
  active: Record<string, string>;
  /** Parts that matter in this step but are not the current focus: drawn with a dashed outline. */
  related?: string[];
}

const toneBox: Record<BlockTone, string> = {
  neutral: "bg-pv-bg text-pv-fg border-pv-line",
  ai: "bg-pv-ai-bg text-pv-ai border-[#d9ccff]",
  warn: "bg-pv-warn-bg text-pv-warn border-[#f1d9a3]",
  danger: "bg-pv-danger-bg text-pv-danger border-[#f5c2bd]",
  success: "bg-pv-ok-bg text-pv-ok border-[#bfe6cf]",
  info: "bg-pv-info-bg text-pv-accent border-[#c8d8fb]",
};

const ToneIcon = ({ tone }: { tone: BlockTone }) =>
  tone === "ai" ? <Sparkles size={14} aria-hidden /> : tone === "warn" || tone === "danger" ? <AlertTriangle size={14} aria-hidden /> : <Info size={14} aria-hidden />;

const OK_HUE = "#2fb37f";
const BAD_HUE = "#e5603f";
const BRAND_HUE = "#7b6cff";

const markStyle: Record<HotspotMark, string> = {
  unreviewed: "outline-dashed outline-[1.5px] outline-[rgba(106,92,240,0.55)]",
  acceptable: "outline-solid outline-[1.5px] outline-[#2fb37f]",
  problematic: "outline-solid outline-[1.5px] outline-[#e5603f]",
  correct: "outline-solid outline-[1.5px] outline-[#2fb37f]",
  incorrect: "outline-solid outline-[1.5px] outline-[#e5603f]",
};

function MarkIcon({ mark }: { mark: HotspotMark }) {
  if (mark === "acceptable" || mark === "correct") return <Check size={12} strokeWidth={3} aria-hidden />;
  if (mark === "problematic" || mark === "incorrect") return <X size={12} strokeWidth={3} aria-hidden />;
  return null;
}

function Hotspot({ id, mode, children, inset }: { id?: string; mode?: HotspotMode; children: React.ReactNode; inset?: boolean }) {
  const { tr } = useI18n();
  if (!id || !mode) return <>{children}</>;
  const mark = mode.marks[id] ?? "unreviewed";
  const selected = mode.selected === id;
  const reviewed = mark !== "unreviewed";
  const anySelected = mode.selected !== undefined && mode.selected in mode.marks;
  const good = mark === "acceptable" || mark === "correct";
  const markText = { unreviewed: tr("not reviewed"), acceptable: tr("marked acceptable"), problematic: tr("marked problematic"), correct: tr("judged correctly"), incorrect: tr("judged incorrectly") }[mark];
  const badgeHue = selected ? BRAND_HUE : good ? OK_HUE : reviewed ? BAD_HUE : undefined;
  return (
    <button
      type="button"
      onClick={() => mode.onSelect(id)}
      aria-pressed={selected}
      aria-label={tr("Element {n}: {label}, {mark}", { n: mode.numbers[id], label: mode.labels[id], mark: markText })}
      data-tag={selected && !inset ? mode.labels[id]?.replace(/[“”"]/g, "") : undefined}
      className={cn(
        "relative block w-full cursor-pointer rounded-md text-start outline-offset-[3px] transition-[opacity,background-color,outline-color]",
        inset ? "outline-offset-[-3px]" : "-m-1.5 w-[calc(100%+0.75rem)] p-1.5",
        selected ? (inset ? "outline-solid outline-2 bg-[rgba(123,108,255,0.09)] outline-[#7b6cff]" : "hl sel-snap outline-solid outline-2 bg-[rgba(123,108,255,0.09)] outline-offset-4 outline-[#7b6cff]") : markStyle[mark],
        !selected && anySelected && !reviewed && "opacity-60",
      )}
    >
      <span
        className={cn(
          inset ? "absolute end-2 top-2" : "absolute -end-3 -top-4",
          "z-10 flex h-[21px] min-w-[21px] items-center justify-center rounded-full border-[1.5px] font-mono text-[11px] font-semibold",
          badgeHue ? "text-white" : "bg-white text-[#6a5cf0]",
        )}
        style={badgeHue ? { background: badgeHue, borderColor: badgeHue } : { borderColor: "#8b84d9" }}
        aria-hidden
      >
        {reviewed && !selected ? <MarkIcon mark={mark} /> : mode.numbers[id]}
      </span>
      {children}
    </button>
  );
}

function HighlightSpot({ id, highlight, children }: { id?: string; highlight?: HighlightMode; children: React.ReactNode }) {
  if (!id || !highlight) return <>{children}</>;
  const tag = highlight.active[id];
  const anyActive = Object.keys(highlight.active).length > 0;
  const related = highlight.related?.includes(id);
  return (
    <div
      data-tag={tag}
      className={cn(
        "relative -m-1.5 rounded-lg p-1.5 transition-[opacity,background-color,outline-color]",
        tag !== undefined && "hl sel-snap bg-[rgba(123,108,255,0.09)] outline-2 outline-offset-4 outline-[#7b6cff]",
        tag === undefined && related && "outline-dashed outline-[1.5px] outline-offset-[3px] outline-[rgba(106,92,240,0.55)]",
        tag === undefined && anyActive && "opacity-60",
      )}
    >
      {children}
    </div>
  );
}

function BlockView({ block, mode, highlight }: { block: Block; mode?: HotspotMode; highlight?: HighlightMode }) {
  const { tr } = useI18n();
  const wrap = (node: React.ReactNode) =>
    mode ? (
      <Hotspot id={block.hotspot} mode={mode}>
        {node}
      </Hotspot>
    ) : (
      <HighlightSpot id={block.hotspot} highlight={highlight}>
        {node}
      </HighlightSpot>
    );
  switch (block.type) {
    case "appbar":
      return wrap(
        <div className="-mx-4 -mt-4 mb-1 flex items-center gap-3 border-b border-pv-line bg-pv-surface px-4 py-3">
          <span className="rounded bg-pv-fg px-1.5 py-0.5 text-[11px] font-bold text-white">{block.app}</span>
          <span className="truncate text-sm font-semibold text-pv-fg">{block.title}</span>
        </div>,
      );
    case "heading":
      return wrap(<h4 className="text-[15px] font-semibold text-pv-fg">{block.text}</h4>);
    case "text":
      return wrap(<p className={cn("text-sm leading-relaxed", block.muted ? "text-pv-muted" : "text-pv-fg")}>{block.text}</p>);
    case "badge":
      return wrap(
        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", toneBox[block.tone])}>
          <ToneIcon tone={block.tone} />
          {block.text}
        </span>,
      );
    case "field":
      return wrap(
        <div className="space-y-1">
          <div className="text-xs font-medium text-pv-muted">{block.label}</div>
          <div className={cn("rounded-md border px-3 py-2 text-sm", block.ai ? "border-dashed border-[#b8a3f0] bg-pv-ai-bg text-pv-fg" : "border-pv-line bg-pv-surface text-pv-fg")}>
            {block.ai && <Sparkles size={13} className="me-1.5 inline text-pv-ai" aria-label={tr("Suggested")} />}
            {block.value || <span className="text-pv-muted">{tr("Empty")}</span>}
          </div>
          {block.note && <div className={cn("text-xs", block.ai ? "text-pv-ai" : "text-pv-muted")}>{block.note}</div>}
        </div>,
      );
    case "quote":
      return wrap(
        <blockquote className="rounded-md border-s-4 border-pv-line bg-pv-surface px-3 py-2 text-sm text-pv-fg">
          {block.text}
          {block.cite && <div className="mt-1 text-xs text-pv-muted">{block.cite}</div>}
        </blockquote>,
      );
    case "list":
      return wrap(
        <ul className="divide-y divide-pv-line rounded-md border border-pv-line bg-pv-surface">
          {block.items.map((item, i) => (
            <li key={i} className="p-0">
              <Hotspot id={item.hotspot} mode={mode} inset>
                <HighlightSpot id={mode ? undefined : item.hotspot} highlight={highlight}>
                <div className={cn("flex items-start gap-3 px-3 py-2.5", item.hotspot && mode && "pe-12", item.tone === "ai" && "bg-[#faf7ff]")}>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-pv-fg">{item.primary}</div>
                    {item.secondary && <div className={cn("text-xs", item.tone === "ai" ? "text-pv-ai" : "text-pv-muted")}>{item.secondary}</div>}
                  </div>
                  {item.meta && <div className="shrink-0 text-xs text-pv-muted">{item.meta}</div>}
                </div>
                </HighlightSpot>
              </Hotspot>
            </li>
          ))}
        </ul>,
      );
    case "buttons":
      return wrap(
        <div className="flex flex-wrap justify-end gap-2">
          {block.buttons.map((b, i) => (
            <span
              key={i}
              className={cn(
                "inline-flex h-8 items-center rounded-md px-3 text-sm font-medium",
                b.variant === "primary" && "bg-pv-accent text-white",
                b.variant === "secondary" && "border border-pv-line bg-pv-surface text-pv-fg",
                b.variant === "ghost" && "text-pv-muted",
                b.variant === "danger" && "bg-pv-danger text-white",
              )}
            >
              {b.label}
            </span>
          ))}
        </div>,
      );
    case "banner":
      return wrap(
        <div className={cn("flex items-start gap-2 rounded-md border px-3 py-2 text-sm", toneBox[block.tone])}>
          <span className="mt-0.5">
            <ToneIcon tone={block.tone} />
          </span>
          <span className="text-pv-fg">{block.text}</span>
        </div>,
      );
    case "table":
      return wrap(
        <div className="overflow-x-auto rounded-md border border-pv-line bg-pv-surface">
          <table className="w-full text-start text-xs">
            <thead className="bg-pv-bg text-pv-muted">
              <tr>{block.columns.map((c) => <th key={c} scope="col" className="px-3 py-2 text-start font-medium">{c}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-pv-line text-pv-fg">
              {block.rows.map((r, i) => {
                const rid = block.rowHotspots?.[i];
                const tag = rid && highlight ? highlight.active[rid] : undefined;
                const rel = !!rid && !!highlight?.related?.includes(rid);
                return (
                  <tr key={i} className={cn(tag !== undefined && "bg-[rgba(123,108,255,0.12)] outline outline-2 -outline-offset-2 outline-[#7b6cff]", tag === undefined && rel && "outline-dashed outline-[1.5px] -outline-offset-2 outline-[rgba(106,92,240,0.55)]")}>
                    {r.map((c, j) => (
                      <td key={j} className="px-3 py-2">
                        {c}
                        {j === 0 && tag !== undefined && <span className="ms-2 rounded bg-[#7b6cff] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">{tag}</span>}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>,
      );
    case "meter":
      return wrap(
        <div className="rounded-md border border-pv-line bg-pv-surface px-3 py-2">
          <div className="flex justify-between text-xs text-pv-muted">
            <span>{block.label}</span>
            <span className="font-semibold text-pv-fg">{block.value}%</span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-pv-bg">
            <div className="h-1.5 rounded-full bg-pv-ok" style={{ width: `${block.value}%` }} />
          </div>
        </div>,
      );
    case "checkbox":
      return wrap(
        <div className="flex items-center gap-2 text-sm text-pv-fg">
          <span className={cn("flex h-4 w-4 items-center justify-center rounded border", block.checked ? "border-pv-accent bg-pv-accent text-white" : "border-pv-muted bg-pv-surface")}>{block.checked && <Check size={11} />}</span>
          {block.label}
        </div>,
      );
    case "link":
      return wrap(<span className="text-sm font-medium text-pv-accent underline underline-offset-2">{block.text}</span>);
    case "toast":
      return wrap(
        <div className="flex items-center gap-3 rounded-lg bg-pv-fg px-3 py-2.5 text-sm text-white shadow-lg">
          <span className="flex-1">{block.text}</span>
          {block.action && <span className="font-semibold text-[#9db7ff]">{block.action}</span>}
        </div>,
      );
    case "dialog":
      return wrap(
        <div className="rounded-xl border border-pv-line bg-pv-surface p-4 shadow-[0_8px_30px_rgba(15,23,42,0.12)]">
          <div className="mb-3 text-[15px] font-semibold text-pv-fg">{block.title}</div>
          <div className="space-y-3">
            {block.blocks.map((b, i) => (
              <BlockView key={i} block={b} mode={mode} highlight={highlight} />
            ))}
          </div>
        </div>,
      );
    case "group":
      return wrap(
        <div className={cn("space-y-2", block.framed && "rounded-md border border-pv-line bg-pv-surface p-3")}>
          {block.blocks.map((b, i) => (
            <BlockView key={i} block={b} mode={mode} highlight={highlight} />
          ))}
        </div>,
      );
  }
}

/** Renders a realistic, light-themed product screen from structured blocks. */
export function ScreenRenderer({ screen, mode, highlight, className, label }: { screen: Screen; mode?: HotspotMode; highlight?: HighlightMode; className?: string; label?: string }) {
  const { tr } = useI18n();
  return (
    <div className={cn("rounded-xl border border-line-strong bg-pv-bg p-1.5 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]", className)} role="group" aria-label={label ?? tr("{app}: {title} (interface preview)", { app: screen.app, title: screen.title })}>
      <div className="flex items-center gap-1.5 px-2 pb-1.5 pt-0.5" aria-hidden>
        <span className="h-2.5 w-2.5 rounded-full bg-[#d4d8e0]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#d4d8e0]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#d4d8e0]" />
      </div>
      <div className="space-y-3 rounded-lg bg-pv-bg p-4 pt-4">
        {screen.blocks.map((b, i) => (
          <BlockView key={i} block={b} mode={mode} highlight={highlight} />
        ))}
      </div>
    </div>
  );
}
