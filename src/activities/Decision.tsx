"use client";

import { ArrowRight, CornerDownRight, Undo2 } from "lucide-react";
import { useState } from "react";
import { walkDecision } from "@/domain/assessment";
import type { DecisionActivity } from "@/domain/types";
import { Button, cn } from "@/components/ui";
import { useI18n } from "@/i18n";
import { ScreenRenderer } from "./ScreenRenderer";

type Choices = { nodeId: string; choiceId: string }[];

export function DecisionControls({ activity, choices, onChoices, readOnly }: { activity: DecisionActivity; choices: Choices; onChoices: (c: Choices) => void; readOnly?: boolean }) {
  const { tr } = useI18n();
  const walk = walkDecision(activity, { choices });
  const node = activity.nodes.find((n) => n.id === walk.currentNodeId);
  const [pending, setPending] = useState<string | undefined>();
  const stepNo = walk.steps.length + 1;

  return (
    <div className="space-y-5">
      {walk.steps.length > 0 && (
        <ol className="space-y-3" aria-label={tr("Decisions so far")}>
          {walk.steps.map((s, i) => {
            const n = activity.nodes.find((x) => x.id === s.nodeId)!;
            const c = n.choices.find((x) => x.id === s.choiceId)!;
            return (
              <li key={i} className="rounded-lg border border-line bg-surface p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-subtle">{tr("Decision {n} · {title}", { n: i + 1, title: n.title })}</p>
                  {!readOnly && (
                    <button type="button" onClick={() => onChoices(choices.slice(0, i))} className="inline-flex shrink-0 items-center gap-1 text-xs text-muted hover:text-fg">
                      <Undo2 size={12} aria-hidden /> {tr("Change")}
                    </button>
                  )}
                </div>
                <p className="mt-1 text-sm font-medium text-fg">{c.label}</p>
                <p className="mt-1 flex gap-1.5 text-sm text-muted">
                  <CornerDownRight size={14} className="mt-0.5 shrink-0" aria-hidden />
                  {c.consequence}
                </p>
              </li>
            );
          })}
        </ol>
      )}

      {node && !readOnly ? (
        <fieldset className="space-y-3 animate-rise" key={node.id}>
          <legend className="sr-only">{node.prompt}</legend>
          <p className="font-mono text-xs font-semibold text-accent">{tr("Decision {n} · {title}", { n: stepNo, title: node.title })}</p>
          <p className="text-sm leading-relaxed text-fg">{node.situation}</p>
          {node.facts && (
            <dl className="grid grid-cols-2 gap-2">
              {node.facts.map((f) => (
                <div key={f.label} className="rounded-lg border border-line bg-surface px-3 py-2">
                  <dt className="text-xs text-subtle">{f.label}</dt>
                  <dd className="text-sm font-medium text-fg">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="font-display text-2xl font-extrabold leading-tight tracking-tight text-fg" aria-hidden>{node.prompt}</p>
          <div className="space-y-2">
            {node.choices.map((c) => (
              <label
                key={c.id}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-2xl border-[1.5px] p-3.5 transition-[transform,border-color] hover:-translate-y-0.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent",
                  pending === c.id ? "border-brand-strong bg-brand-deep" : "border-line bg-surface hover:border-line-strong",
                )}
              >
                <input type="radio" name={`${activity.id}-${node.id}`} checked={pending === c.id} onChange={() => setPending(c.id)} className="mt-1 h-4 w-4 shrink-0 accent-[#7b6cff]" />
                <span>
                  <span className="block text-sm font-medium text-fg">{c.label}</span>
                  <span className="text-xs text-muted">{c.detail}</span>
                </span>
              </label>
            ))}
          </div>
          <Button
            variant="primary"
            disabled={!pending}
            onClick={() => {
              if (!pending) return;
              onChoices([...choices, { nodeId: node.id, choiceId: pending }]);
              setPending(undefined);
            }}
          >
            {tr("Decide")} <ArrowRight size={15} aria-hidden />
          </Button>
        </fieldset>
      ) : walk.finished ? (
        <p className="rounded-lg border border-ok/30 bg-ok-bg p-3 text-sm text-fg">{tr("You reached the end of the scenario. Submit your decisions, or change any of them above.")}</p>
      ) : null}
    </div>
  );
}

export function DecisionStage({ activity, choices }: { activity: DecisionActivity; choices: Choices }) {
  const { tr } = useI18n();
  const walk = walkDecision(activity, { choices });
  const currentId = walk.currentNodeId ?? walk.steps[walk.steps.length - 1]?.nodeId ?? activity.start;
  const withScreen = [...activity.nodes].filter((n) => n.screen);
  const node = activity.nodes.find((n) => n.id === currentId);
  const screenNode = node?.screen ? node : withScreen.find((n) => walk.steps.some((s) => s.nodeId === n.id)) ?? withScreen[0];
  const last = walk.steps[walk.steps.length - 1];
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-fg">{tr("Situation")}</h3>
      {screenNode?.screen && <ScreenRenderer screen={screenNode.screen} />}
      {last && (
        <div className="rounded-xl border border-line bg-surface p-4" aria-live="polite">
          <p className="text-xs font-semibold uppercase tracking-wide text-subtle">{tr("Latest consequence")}</p>
          <p className="mt-1 text-sm text-fg">{last.consequence}</p>
        </div>
      )}
      <div className="rounded-xl border border-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-subtle">{tr("Route")}</p>
        <ol className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          {walk.steps.map((s, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <span className="rounded-full bg-raised px-2 py-0.5 text-fg">{activity.nodes.find((n) => n.id === s.nodeId)?.title}</span>
              <ArrowRight size={11} className="text-subtle" aria-hidden />
            </li>
          ))}
          <li className="rounded-full border border-dashed border-line-strong px-2 py-0.5 text-subtle">{walk.finished ? tr("End") : activity.nodes.find((n) => n.id === walk.currentNodeId)?.title}</li>
        </ol>
      </div>
    </div>
  );
}
