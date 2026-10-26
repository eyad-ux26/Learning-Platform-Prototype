"use client";

import { useState } from "react";
import { ArrowRight, Check, Send, X } from "lucide-react";
import { walkDecision } from "@/domain/assessment";
import { applyAffects, changesLayout } from "@/domain/preview";
import type { Affect, DecisionActivity, DecisionChoice, DecisionNode, Screen } from "@/domain/types";
import { playSfx } from "@/components/sfx";
import { Button, Kbd, cn } from "@/components/ui";
import { useI18n } from "@/i18n";
import { DockLayout, useDock } from "./dock";
import { ScreenRenderer, type HighlightMode } from "./ScreenRenderer";
import type { Brick } from "./BuildBar";
import { StepFeedback, type StepVerdict } from "./StepFeedback";

type Choices = { nodeId: string; choiceId: string }[];

/** Screen blocks whose hotspot starts with this prefix show a consequence (a dialog, a banner, a list) and appear only while highlighted. */
const EFFECT_PREFIX = "fx-";

/** Fewest decisions left from this node to the end of the scenario, counting the node itself. */
export function decisionsLeft(activity: DecisionActivity, nodeId: string, seen: string[] = []): number {
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

/** Whether an option holds up: every criterion it signals is met. Options without signals are neither. */
export function choiceVerdict(c: DecisionChoice): StepVerdict {
  if (!c.signals.length) return "neutral";
  return c.signals.every((g) => g.met) ? "held" : "missed";
}

/** The route as bricks: one per decision made (held up or missed), the current one, and the fewest still to come. */
export function decisionBricks(activity: DecisionActivity, choices: Choices, feedbackNodeId?: string): Brick[] {
  const walk = walkDecision(activity, { choices });
  const nodeOf = (id: string) => activity.nodes.find((n) => n.id === id);
  const bricks: Brick[] = walk.steps.map((s) => {
    const node = nodeOf(s.nodeId);
    const choice = node?.choices.find((c) => c.id === s.choiceId);
    const v = choice ? choiceVerdict(choice) : "neutral";
    return { state: v === "held" ? "held" : v === "missed" ? "missed" : "placed", label: node?.title ?? "" };
  });
  if (walk.currentNodeId) {
    const left = decisionsLeft(activity, walk.currentNodeId);
    // While a step's feedback is open, the next decision is not yet "here".
    bricks.push({ state: feedbackNodeId ? "todo" : "current", label: nodeOf(walk.currentNodeId)?.title ?? "" });
    for (let k = 1; k < left; k++) bricks.push({ state: "todo", label: "" });
  }
  return bricks;
}

export function DecisionControls({
  activity,
  choices,
  onChoices,
  readOnly,
  pending,
  onPending,
  feedbackNodeId,
  onFeedback,
}: {
  activity: DecisionActivity;
  choices: Choices;
  onChoices: (c: Choices) => void;
  readOnly?: boolean;
  /** The option being considered at the current node (owned by the parent so the preview can highlight what it touches). */
  pending?: string;
  onPending?: (optionId: string | undefined) => void;
  /** The decision whose feedback is open. Decisions are final once made: the feedback shows whether they held up. */
  feedbackNodeId?: string;
  onFeedback?: (nodeId: string | undefined) => void;
}) {
  const { tr } = useI18n();
  const dock = useDock();
  const walk = walkDecision(activity, { choices });
  if (readOnly) return null;
  const node = activity.nodes.find((n) => n.id === walk.currentNodeId);
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
    if (!node || !pickedChoice) return;
    playSfx(choiceVerdict(pickedChoice) === "missed" ? "miss" : "correct");
    onChoices([...choices, { nodeId: node.id, choiceId: pickedChoice.id }]);
    onPending?.(undefined);
    onFeedback?.(node.id);
    dock.setCollapsed(false);
  };

  // Feedback for the decision just made.
  const fbIndex = feedbackNodeId ? walk.steps.findIndex((s) => s.nodeId === feedbackNodeId) : -1;
  const fbNode = fbIndex >= 0 ? activity.nodes.find((n) => n.id === feedbackNodeId) : undefined;
  const fbChoice = fbNode?.choices.find((c) => c.id === walk.steps[fbIndex].choiceId);
  if (fbNode && fbChoice) {
    const v = choiceVerdict(fbChoice);
    const better = v === "missed" ? fbNode.choices.filter((c) => choiceVerdict(c) === "held").map((c) => c.label) : [];
    const title = v === "held" ? tr("Holds up") : v === "missed" ? tr("Doesn’t hold up") : tr("Noted");
    const next = () => {
      playSfx("tap");
      onFeedback?.(undefined);
      if (walk.finished) dock.submit?.();
    };
    return (
      <DockLayout
        bodyKey={`fb-${fbNode.id}`}
        summary={
          <button type="button" onClick={() => dock.setCollapsed(false)} className="flex w-full items-center gap-3 rounded-2xl border border-line bg-raised px-3 py-2.5 text-start">
            <span className={cn("shrink-0 font-mono text-[11px] font-semibold", v === "held" ? "text-ok" : v === "missed" ? "text-bad" : "text-accent")}>{title}</span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">{fbChoice.label}</span>
          </button>
        }
        body={
          <div key={fbNode.id} className="rounded-[22px] border-[1.5px] border-line bg-surface p-4 sm:p-5 max-lg:rounded-none max-lg:border-0 max-lg:bg-transparent max-lg:p-0">
            <p className="mb-2.5 font-mono text-xs font-semibold text-accent">{tr("Decision {n} · {title}", { n: fbIndex + 1, title: fbNode.title })}</p>
            <StepFeedback
              verdict={v}
              title={title}
              subtitle={fbChoice.label}
              example={fbChoice.consequence}
              better={better.length ? better.join(" / ") : undefined}
              why={
                fbChoice.signals.length ? (
                  <ul className="space-y-1.5">
                    {fbChoice.signals.map((g, j) => (
                      <li key={j} className="flex items-start gap-2">
                        {g.met ? <Check size={14} className="mt-0.5 shrink-0 text-ok" aria-label={tr("Met")} /> : <X size={14} className="mt-0.5 shrink-0 text-bad" aria-label={tr("Not met")} />}
                        <span>{g.because}</span>
                      </li>
                    ))}
                  </ul>
                ) : undefined
              }
            />
          </div>
        }
        foot={
          <Button variant="primary" size="lg" className="nudge w-full max-lg:h-11" onClick={next}>
            {walk.finished ? <><Send size={15} aria-hidden /> {tr("See results")}</> : <>{tr("Next decision")} <ArrowRight size={16} aria-hidden /></>}
          </Button>
        }
      />
    );
  }

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
              <span className={cn("text-[12.5px]", checked ? "text-accent-strong" : "text-muted")}>{c.detail}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  ) : walk.finished ? (
    <p className="flex items-center gap-2 rounded-xl border border-ok/30 bg-ok-bg p-3 text-sm text-fg">
      <Check size={16} className="shrink-0 text-ok" aria-hidden /> {tr("That was the last decision. Submit to see how your build holds up.")}
    </p>
  ) : null;

  const foot = node ? (
    <Button variant="primary" size="lg" className={cn("w-full max-lg:h-11", picked && "nudge")} disabled={!picked} onClick={decide}>
      {tr("Decide")}
      <span aria-hidden className="rounded-md bg-black/20 px-1.5 font-mono text-xs font-semibold max-sm:hidden">↵</span>
    </Button>
  ) : walk.finished ? (
    <Button variant="primary" size="lg" className="h-11 w-full lg:hidden" onClick={() => dock.submit?.()}>
      <Send size={15} aria-hidden /> {tr("Submit response")}
    </Button>
  ) : undefined;

  return <DockLayout bodyKey={node?.id ?? "end"} summary={summary} body={body} foot={foot} />;
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

/**
 * The product screen of a node. With an option, the parts it touches carry numbered pins (listed beside the screen) and,
 * in the "after" view, its layout changes are applied. Effect blocks (hotspot "fx-…") show only while highlighted.
 */
function HighlightedScreen({ node, choiceId, after, earlier, className }: { node: DecisionNode; choiceId?: string; after: boolean; earlier: Affect[]; className?: string }) {
  const screen = node.screen as Screen;
  const affects = node.choices.find((c) => c.id === choiceId)?.affects ?? [];
  const active: Record<string, string> = Object.fromEntries(affects.map((a) => [a.hotspot, a.tag]));
  const pins: Record<string, number> = Object.fromEntries(affects.map((a, i) => [a.hotspot, i + 1]));
  const lead = screen.blocks[0]?.type === "appbar" ? 1 : 0;
  const apply = <B extends Screen["blocks"][number]>(blocks: B[], list: Affect[]) =>
    applyAffects(blocks, list, lead).map((b) => (b.type === "list" ? { ...b, items: applyAffects(b.items, list) } : b)) as B[];
  let blocks = screen.blocks.filter((b) => !b.hotspot?.startsWith(EFFECT_PREFIX) || b.hotspot in active);
  // Earlier decisions stay applied, so the screen builds up as the learner decides.
  blocks = apply(blocks, earlier);
  // The option's own removals stay visible as faded parts in the "after" view, so the learner can see what went.
  if (after && affects.length) blocks = apply(blocks, affects.map((a) => ({ ...a, hide: false })));
  const removed = after ? affects.filter((a) => a.hide).map((a) => a.hotspot) : [];
  const highlight: HighlightMode = { active, pins, removed };
  return <ScreenRenderer screen={{ ...screen, blocks }} highlight={highlight} className={className} />;
}

/** The numbered list of what an option changes, matching the pins on the screen. */
function ChangeList({ affects }: { affects: Affect[] }) {
  const { tr } = useI18n();
  return (
    <ol className="flex flex-wrap gap-1.5" aria-label={tr("What this option changes")}>
      {affects.map((a, i) => (
        <li key={a.hotspot} className="inline-flex items-center gap-1.5 rounded-full border border-brand-strong/50 bg-brand-deep/60 py-0.5 pe-2.5 ps-0.5 text-xs font-medium text-fg">
          <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-strong font-mono text-[10.5px] font-semibold text-white">{i + 1}</span>
          {a.tag}
        </li>
      ))}
    </ol>
  );
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
  const affects = own ? screenNode?.choices.find((c) => c.id === choiceId)?.affects ?? [] : [];
  const stepIndex = walk.steps.findIndex((st) => st.nodeId === nodeId);
  const earlier = walk.steps
    .slice(0, stepIndex < 0 ? walk.steps.length : stepIndex)
    .flatMap((st) => activity.nodes.find((n) => n.id === st.nodeId)?.choices.find((c) => c.id === st.choiceId)?.affects ?? []);
  const canCompare = changesLayout(affects);
  // Every new option opens on its result; "Before" holds only for the option it was chosen on.
  const [beforeFor, setBeforeFor] = useState<string>();
  const key = `${nodeId}:${choiceId}`;
  const view = beforeFor === key ? "before" : "after";
  const setView = (v: "before" | "after") => setBeforeFor(v === "before" ? key : undefined);
  const hasPreview = own && screenNode?.choices.some((c) => c.affects?.length);
  return (
    <div className="space-y-3">
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-fg max-lg:hidden">{choiceId && hasPreview ? tr("What this option changes") : tr("Situation")}</h3>
        {canCompare && (
          <div role="radiogroup" aria-label={tr("Compare")} className="flex rounded-lg border border-line bg-surface p-0.5 text-xs font-semibold">
            {(["before", "after"] as const).map((v) => (
              <button key={v} type="button" role="radio" aria-checked={view === v} onClick={() => setView(v)} className={cn("rounded-md px-2.5 py-1", view === v ? "bg-brand-strong text-white" : "text-muted hover:text-fg")}>
                {v === "before" ? tr("Before") : tr("After")}
              </button>
            ))}
          </div>
        )}
      </div>
      {hasPreview &&
        (!choiceId ? (
          <p className="text-sm text-muted">{tr("Pick an option to see what it changes on the screen.")}</p>
        ) : affects.length ? (
          <ChangeList affects={affects} />
        ) : (
          <p className="text-sm text-muted">{tr("This option doesn’t change the screen.")}</p>
        ))}
      {screenNode?.screen && <HighlightedScreen node={screenNode} choiceId={own ? choiceId : undefined} after={view === "after"} earlier={earlier} />}
    </div>
  );
}
