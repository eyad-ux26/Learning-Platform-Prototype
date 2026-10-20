"use client";

import { Check, Send } from "lucide-react";
import { walkDecision } from "@/domain/assessment";
import type { DecisionActivity, DecisionNode, Screen } from "@/domain/types";
import { playSfx } from "@/components/sfx";
import { Button, Kbd, cn } from "@/components/ui";
import { useI18n } from "@/i18n";
import { DockLayout, useDock } from "./dock";
import { ScreenRenderer, type HighlightMode } from "./ScreenRenderer";

type Choices = { nodeId: string; choiceId: string }[];

/** Screen blocks whose hotspot starts with this prefix show a consequence (a dialog, a banner, a list) and appear only while highlighted. */
const EFFECT_PREFIX = "fx-";

/** Fewest decisions left from this node to the end of the scenario, counting the node itself. */
function decisionsLeft(activity: DecisionActivity, nodeId: string, seen: string[] = []): number {
  const node = activity.nodes.find((n) => n.id === nodeId);
  if (!node || seen.includes(nodeId)) return 1;
  const nexts = node.choices.map((c) => c.next);
  if (nexts.some((n) => !n)) return 1;
  return 1 + Math.min(...nexts.map((n) => decisionsLeft(activity, n!, [...seen, nodeId])));
}

/** The node whose screen to show: the node's own, else the nearest earlier walked node with one, else the first one that has one. */
function screenNodeFor(activity: DecisionActivity, nodeId: string, walkedIds: string[]): DecisionNode | undefined {
  const node = activity.nodes.find((n) => n.id === nodeId);
  if (node?.screen) return node;
  const upTo = walkedIds.includes(nodeId) ? walkedIds.slice(0, walkedIds.indexOf(nodeId)) : walkedIds;
  const earlier = [...upTo].reverse().map((id) => activity.nodes.find((n) => n.id === id)).find((n) => n?.screen);
  return earlier ?? activity.nodes.find((n) => n.screen);
}

function RouteStepper({ activity, choices, onChoices, onPending, readOnly }: { activity: DecisionActivity; choices: Choices; onChoices: (c: Choices) => void; onPending?: (id: string | undefined) => void; readOnly?: boolean }) {
  const { tr } = useI18n();
  const walk = walkDecision(activity, { choices });
  const titleOf = (id: string) => activity.nodes.find((n) => n.id === id)?.title ?? "";
  const left = walk.currentNodeId ? decisionsLeft(activity, walk.currentNodeId) : 0;
  const items = [
    ...walk.steps.map((s, i) => ({ state: "done" as const, n: i + 1, title: titleOf(s.nodeId) })),
    ...(walk.currentNodeId ? [{ state: "current" as const, n: walk.steps.length + 1, title: titleOf(walk.currentNodeId) }] : []),
    ...Array.from({ length: Math.max(0, left - 1) }, (_, k) => ({ state: "todo" as const, n: walk.steps.length + 2 + k, title: "" })),
  ];
  return (
    <ol aria-label={tr("Route")} className="flex items-center rounded-2xl border border-line bg-surface px-3 py-2 lg:px-3.5 lg:py-3">
      {items.map((it, i) => {
        const dotClass = cn(
          "flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-[1.5px] font-mono text-[11px] font-semibold",
          it.state === "current" && "border-brand-strong bg-brand-strong text-white ring-4 ring-brand-strong/25",
          it.state === "done" && "border-ok bg-ok-bg text-ok",
          it.state === "todo" && "border-line-strong text-subtle",
        );
        const dot = it.state === "done" ? <Check size={13} strokeWidth={2.6} aria-hidden /> : it.n;
        const label = tr("Decision {n} · {title}", { n: it.n, title: it.title });
        return (
          <li key={i} className={cn("flex min-w-0 items-center", it.state === "todo" ? "flex-none" : "flex-1")} aria-current={it.state === "current" ? "step" : undefined}>
            {it.state === "done" && !readOnly ? (
              <button
                type="button"
                aria-label={`${label} · ${tr("Change")}`}
                title={tr("Change")}
                onClick={() => {
                  playSfx("undo");
                  onChoices(choices.slice(0, i));
                  onPending?.(undefined);
                }}
                className={cn(dotClass, "hover:bg-ok/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent")}
              >
                {dot}
              </button>
            ) : (
              <span className={dotClass} role="img" aria-label={it.state === "todo" ? tr("Decision {n}", { n: it.n }) : label}>
                {dot}
              </span>
            )}
            {it.state !== "todo" && (
              <span className={cn("mx-1.5 min-w-0 truncate font-mono text-[11.5px] font-semibold", it.state === "current" ? "text-fg" : "text-muted max-sm:hidden")} aria-hidden>
                {it.title}
              </span>
            )}
            {i < items.length - 1 && <span aria-hidden className={cn("mx-1 h-0.5 min-w-2 flex-1 rounded-full", it.state === "done" ? "bg-ok" : "bg-line")} />}
          </li>
        );
      })}
    </ol>
  );
}

export function DecisionControls({
  activity,
  choices,
  onChoices,
  readOnly,
  pending,
  onPending,
}: {
  activity: DecisionActivity;
  choices: Choices;
  onChoices: (c: Choices) => void;
  readOnly?: boolean;
  /** The option being considered at the current node (owned by the parent so the preview can highlight what it touches). */
  pending?: string;
  onPending?: (optionId: string | undefined) => void;
}) {
  const { tr } = useI18n();
  const dock = useDock();
  const walk = walkDecision(activity, { choices });
  const node = activity.nodes.find((n) => n.id === walk.currentNodeId);
  const route = <RouteStepper activity={activity} choices={choices} onChoices={onChoices} onPending={onPending} readOnly={readOnly} />;
  if (readOnly) return route;

  const stepNo = walk.steps.length + 1;
  const total = walk.steps.length + (walk.currentNodeId ? decisionsLeft(activity, walk.currentNodeId) : 0);
  const picked = node?.choices.find((c) => c.id === pending)?.id;
  const pickedChoice = node?.choices.find((c) => c.id === picked);
  const pick = (id: string) => {
    playSfx("pick");
    onPending?.(id);
    // Phones: tuck the question away so the interface shows what the option touches.
    dock.setCollapsed(true);
  };
  const decide = () => {
    if (!node || !picked) return;
    playSfx("apply");
    onChoices([...choices, { nodeId: node.id, choiceId: picked }]);
    onPending?.(undefined);
    dock.setCollapsed(false);
  };

  const summary = node ? (
    <button type="button" onClick={() => dock.setCollapsed(false)} className="flex w-full items-center gap-3 rounded-2xl border border-line bg-raised px-3 py-2.5 text-start">
      <span className="shrink-0 font-mono text-[11px] font-semibold text-accent">{stepNo}/{total}</span>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">{pickedChoice ? pickedChoice.label : node.prompt}</span>
      <span className="shrink-0 text-xs font-semibold text-accent">{tr("Change")}</span>
    </button>
  ) : undefined;

  const body = node ? (
    <fieldset
      key={node.id}
      className="animate-rise space-y-3 rounded-[22px] border-[1.5px] border-brand-strong bg-surface p-4 sm:p-5 max-lg:rounded-none max-lg:border-0 max-lg:bg-transparent max-lg:p-0 lg:space-y-4"
      onKeyDown={(e) => {
        if (!(e.target as HTMLElement).matches("input[type=radio]")) return;
        if (e.key === "Enter") {
          if (picked) {
            e.preventDefault();
            decide();
          }
          return;
        }
        const n = Number(e.key);
        if (!(n >= 1 && n <= node.choices.length)) return;
        e.preventDefault();
        pick(node.choices[n - 1].id);
      }}
    >
      <legend className="sr-only">{node.prompt}</legend>
      <div>
        <p className="font-mono text-xs font-semibold text-accent">{tr("Decision {n} of {m} · {title}", { n: stepNo, m: total, title: node.title })}</p>
        <p className="mt-1 font-display text-xl font-extrabold leading-[1.1] tracking-tight text-fg lg:mt-1.5 lg:text-2xl" aria-hidden>
          {node.prompt}
        </p>
      </div>
      {node.facts && (
        <dl className="flex flex-wrap gap-2">
          {node.facts.map((f) => (
            <div key={f.label} className="rounded-xl border border-line bg-raised px-2.5 py-1.5">
              <dt className="font-mono text-[10.5px] text-muted">{f.label}</dt>
              <dd className="text-[13.5px] font-semibold text-fg">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="space-y-2">
        {node.choices.map((c, i) => {
          const checked = picked === c.id;
          return (
            <label
              key={c.id}
              className={cn(
                "flex cursor-pointer flex-col gap-1.5 rounded-2xl border-[1.5px] p-3 transition-[transform,border-color,background-color] hover:-translate-y-0.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent lg:gap-2 lg:p-3.5",
                checked ? "border-brand-strong bg-brand-deep" : "border-line bg-raised hover:border-line-strong",
              )}
            >
              <input type="radio" className="sr-only" name={`${activity.id}-${node.id}`} value={c.id} checked={checked} onChange={() => pick(c.id)} />
              <span className="flex items-start justify-between gap-2.5">
                <span className="text-start text-[14.5px] font-semibold leading-snug text-fg">{c.label}</span>
                <Kbd className={cn("hidden shrink-0 sm:inline", checked && "border-white/40 text-white")}>{i + 1}</Kbd>
              </span>
              <span className={cn("font-mono text-[11.5px]", checked ? "text-accent-strong" : "text-muted")}>{c.detail}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  ) : walk.finished ? (
    <p className="rounded-lg border border-ok/30 bg-ok-bg p-3 text-sm text-fg">{tr("You reached the end of the scenario. Submit your decisions, or change any of them above.")}</p>
  ) : null;

  const foot = node ? (
    <>
      <Button variant="primary" size="lg" className="w-full max-lg:h-11" disabled={!picked} onClick={decide}>
        {tr("Decide")}
        <span aria-hidden className="rounded-md bg-black/20 px-1.5 font-mono text-xs font-semibold max-sm:hidden">↵</span>
      </Button>
    </>
  ) : walk.finished ? (
    <Button variant="primary" size="lg" className="h-11 w-full lg:hidden" onClick={() => dock.submit?.()}>
      <Send size={15} aria-hidden /> {tr("Submit response")}
    </Button>
  ) : undefined;

  return <DockLayout head={route} summary={summary} body={body} foot={foot} />;
}

/** Chat thread for the Brief column: the situation, the learner's pick and its consequence for every step, then the current situation. */
export function DecisionThread({ activity, choices }: { activity: DecisionActivity; choices: Choices }) {
  const { tr } = useI18n();
  const walk = walkDecision(activity, { choices });
  const nodeOf = (id: string) => activity.nodes.find((n) => n.id === id);
  const bubble = "max-w-[92%] rounded-2xl px-3 py-2.5 leading-snug";
  const items: { key: string; tag?: string; side?: "l" | "r" | "c"; text?: string }[] = [];
  const addNode = (node: DecisionNode, k: number) => {
    if (k > 0) items.push({ key: `tag-${k}`, tag: tr("Decision {n} · {title}", { n: k + 1, title: node.title }) });
    items.push({ key: `sit-${k}`, side: "l", text: node.situation });
  };
  walk.steps.forEach((s, k) => {
    const node = nodeOf(s.nodeId);
    const choice = node?.choices.find((c) => c.id === s.choiceId);
    if (!node || !choice) return;
    addNode(node, k);
    items.push({ key: `pick-${k}`, side: "r", text: choice.label });
    items.push({ key: `fx-${k}`, side: "c", text: `↳ ${choice.consequence}` });
  });
  const current = walk.currentNodeId ? nodeOf(walk.currentNodeId) : undefined;
  if (current) addNode(current, walk.steps.length);

  return (
    <ol className="flex flex-col gap-2.5" aria-live="polite" aria-label={tr("Decisions so far")}>
      {items.map((it) => (
        <li key={it.key} className={cn("animate-rise flex", it.side === "r" && "justify-end")}>
          {it.tag !== undefined ? (
            <span className="pt-1.5 font-mono text-[11px] font-semibold text-accent">{it.tag}</span>
          ) : it.side === "l" ? (
            <p className={cn(bubble, "rounded-es-sm bg-overlay text-sm text-fg")}>{it.text}</p>
          ) : it.side === "r" ? (
            <p className={cn(bubble, "rounded-ee-sm bg-brand text-sm font-semibold text-white")}>{it.text}</p>
          ) : (
            <p className={cn(bubble, "rounded-xl border border-line bg-raised py-2 text-[13px] text-muted")}>{it.text}</p>
          )}
        </li>
      ))}
    </ol>
  );
}

/** The product screen of a node with the parts touched by `choiceId` highlighted. Effect blocks (hotspot "fx-…") show only while highlighted. */
function HighlightedScreen({ node, choiceId, own, className }: { node: DecisionNode; choiceId?: string; own: boolean; className?: string }) {
  const screen = node.screen as Screen;
  const choice = node.choices.find((c) => c.id === choiceId);
  const active: Record<string, string> = Object.fromEntries((choice?.affects ?? []).map((a) => [a.hotspot, a.tag]));
  const related = own ? [...new Set(node.choices.flatMap((c) => (c.affects ?? []).map((a) => a.hotspot)))] : [];
  const highlight: HighlightMode = { active, related };
  const shown: Screen = { ...screen, blocks: screen.blocks.filter((b) => !b.hotspot?.startsWith(EFFECT_PREFIX) || b.hotspot in active) };
  return <ScreenRenderer screen={shown} highlight={highlight} className={className} />;
}

export function DecisionStage({ activity, choices, pending, reviewNodeId }: { activity: DecisionActivity; choices: Choices; pending?: string; reviewNodeId?: string }) {
  const { tr } = useI18n();
  const walk = walkDecision(activity, { choices });
  const walkedIds = walk.steps.map((s) => s.nodeId);
  const review = reviewNodeId && walkedIds.includes(reviewNodeId);
  // The node being looked at: the one under review, else the current one, else (finished) the last one decided.
  const nodeId = review ? reviewNodeId : walk.currentNodeId ?? walkedIds[walkedIds.length - 1] ?? activity.start;
  const screenNode = screenNodeFor(activity, nodeId, walkedIds);
  const own = screenNode?.id === nodeId;
  const decided = walk.steps.find((s) => s.nodeId === nodeId)?.choiceId;
  const choiceId = review || !walk.currentNodeId ? decided : pending;
  const considering = !review && !!walk.currentNodeId && screenNode?.choices.some((c) => c.affects?.length);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-fg max-lg:hidden">{tr("Situation")}</h3>
        {own && screenNode?.choices.some((c) => c.affects?.length) && (
          <p className="font-mono text-xs text-subtle">{considering ? tr("Pick an option to see what it touches.") : tr("What your choice touched")}</p>
        )}
      </div>
      {screenNode?.screen && <HighlightedScreen node={screenNode} choiceId={own ? choiceId : undefined} own={own} />}
    </div>
  );
}
