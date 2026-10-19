"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import type { CritiqueActivity, Evaluation, Verdict } from "@/domain/types";
import { cn, Kbd } from "@/components/ui";
import { playSfx } from "@/components/sfx";
import { useI18n } from "@/i18n";
import { ScreenRenderer, type HotspotMark } from "./ScreenRenderer";

export type CritiqueReviews = Record<string, { verdict?: Verdict; reason?: string; note?: string }>;
type Reviews = CritiqueReviews;

/** Hue dot per reason, by skill group (sky = uncertainty, amber = evidence, mint = correction/recovery, coral = commitment). */
const REASON_HUE: Record<string, string> = {
  "unmarked-ai": "#5cc8ff",
  "false-precision": "#5cc8ff",
  overstated: "#5cc8ff",
  "clear-ai-origin": "#5cc8ff",
  "actionable-uncertainty": "#5cc8ff",
  "no-source": "#ffc94d",
  "generic-explanation": "#ffc94d",
  "inspectable-source": "#ffc94d",
  "specific-explanation": "#ffc94d",
  "hard-to-correct": "#5ee0a8",
  "no-recovery": "#5ee0a8",
  "easy-correction": "#5ee0a8",
  "recovery-available": "#5ee0a8",
  "friction-mismatch": "#ff7d5c",
  "vague-confirmation": "#ff7d5c",
  "proportionate-commitment": "#ff7d5c",
  "specific-consequence": "#ff7d5c",
};
const reasonHue = (id: string) => REASON_HUE[id] ?? "#7b6cff";

const isDone = (r?: Reviews[string]) => !!(r?.verdict && r.reason);

export function critiqueMarks(activity: CritiqueActivity, reviews: Reviews, evaluation?: Evaluation): Record<string, HotspotMark> {
  const marks: Record<string, HotspotMark> = {};
  for (const h of activity.hotspots) {
    const r = reviews[h.id];
    if (evaluation) marks[h.id] = r?.verdict === h.verdict && r.reason && h.correctReasons.includes(r.reason) ? "correct" : "incorrect";
    else marks[h.id] = r?.verdict ?? "unreviewed";
  }
  return marks;
}

export function CritiqueStage({ activity, reviews, selected, onSelect, evaluation }: { activity: CritiqueActivity; reviews: Reviews; selected?: string; onSelect: (id: string) => void; evaluation?: Evaluation }) {
  const { tr } = useI18n();
  const numbers = Object.fromEntries(activity.hotspots.map((h, i) => [h.id, i + 1]));
  const labels = Object.fromEntries(activity.hotspots.map((h) => [h.id, h.label]));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="font-mono text-xs font-semibold text-accent">{tr("Interface under review")}</h3>
        <p className="text-xs text-subtle">{tr("Select a numbered element to review it.")}</p>
      </div>
      <ScreenRenderer screen={activity.screen} mode={{ selected, onSelect, marks: critiqueMarks(activity, reviews, evaluation), numbers, labels }} />
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[11px] text-muted" aria-label={tr("Legend")}>
        <li className="flex items-center gap-1.5"><span aria-hidden className="inline-block h-2.5 w-3.5 rounded-[3px] border-[1.5px] border-dashed border-[#8b84d9]" />{tr("Not reviewed")}</li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-2.5 w-3.5 rounded-[3px] border-[1.5px] border-solid border-[#2fb37f]" />
          <Check size={11} aria-hidden className="text-ok" />
          {evaluation ? tr("Judged correctly") : tr("Acceptable")}
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-2.5 w-3.5 rounded-[3px] border-[1.5px] border-solid border-[#e5603f]" />
          <X size={11} aria-hidden className="text-bad" />
          {evaluation ? tr("Judged incorrectly") : tr("Problematic")}
        </li>
      </ul>
    </div>
  );
}

/** Number keys 1-9 pick the n-th option, only while focus is on a radio inside the group (no global handlers). */
function numberKeys(pick: (index: number) => void) {
  return (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!/^[1-9]$/.test(e.key)) return;
    const t = e.target;
    if (!(t instanceof HTMLInputElement) || t.type !== "radio") return;
    e.preventDefault();
    pick(Number(e.key) - 1);
  };
}

function NoteField({ id, note, readOnly, onChange }: { id: string; note?: string; readOnly?: boolean; onChange: (note: string) => void }) {
  const { tr } = useI18n();
  const [open, setOpen] = useState(!!note);
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          playSfx("tap");
          setOpen(true);
        }}
        disabled={readOnly}
        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[#4a4a58] px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:border-line-strong hover:text-fg disabled:opacity-50"
      >
        <Plus size={14} aria-hidden />
        {tr("Add a note")}
        <span className="font-mono text-[11px] text-subtle">{tr("(optional · saved, not assessed)")}</span>
      </button>
    );
  }
  return (
    <div className="animate-rise">
      <label htmlFor={`note-${id}`} className="mb-1.5 block text-[13px] font-medium text-muted">
        {tr("Note")} <span className="font-mono text-[11px] text-subtle">{tr("(optional · saved, not assessed)")}</span>
      </label>
      <textarea
        id={`note-${id}`}
        disabled={readOnly}
        rows={2}
        value={note ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-y rounded-xl border border-line-strong bg-canvas px-3 py-2.5 text-sm text-fg placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-60"
      />
    </div>
  );
}

export function CritiqueControls({
  activity,
  reviews,
  selected,
  onSelect,
  onReview,
  readOnly,
}: {
  activity: CritiqueActivity;
  reviews: Reviews;
  selected?: string;
  onSelect: (id: string) => void;
  onReview: (id: string, patch: Reviews[string]) => void;
  readOnly?: boolean;
}) {
  const { tr } = useI18n();
  const hotspots = activity.hotspots;
  const total = hotspots.length;
  const reviewed = hotspots.filter((h) => isDone(reviews[h.id])).length;
  const hotspot = hotspots.find((h) => h.id === selected);
  const idx = hotspot ? hotspots.indexOf(hotspot) : -1;
  const r = hotspot ? (reviews[hotspot.id] ?? {}) : {};
  const reasons = activity.reasons.filter((x) => x.appliesTo === r.verdict);

  // Start on the first element that still needs a verdict and a reason (once, so it never loops).
  const autoSelected = useRef(false);
  useEffect(() => {
    if (autoSelected.current) return;
    autoSelected.current = true;
    if (selected) return;
    const first = hotspots.find((h) => !isDone(reviews[h.id]));
    if (first) onSelect(first.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let nextId: string | undefined;
  if (hotspot) {
    for (let k = 1; k < total; k++) {
      const h = hotspots[(idx + k) % total];
      if (!isDone(reviews[h.id])) {
        nextId = h.id;
        break;
      }
    }
  }

  const chipMark = (i: number) => {
    const v = reviews[hotspots[i].id]?.verdict;
    return v === "acceptable" ? tr("marked acceptable") : v === "problematic" ? tr("marked problematic") : tr("not reviewed");
  };

  const verdictOptions = [
    { id: "acceptable" as const, label: tr("Acceptable"), sub: tr("Works for the reader"), Icon: Check, hue: "#5ee0a8", on: "border-ok bg-ok-bg" },
    { id: "problematic" as const, label: tr("Problematic"), sub: tr("Needs a change"), Icon: X, hue: "#ff7d5c", on: "border-[#ff7d5c] bg-bad-bg" },
  ];

  const setVerdict = (v: Verdict) => {
    if (!hotspot || readOnly) return;
    playSfx("pick");
    onReview(hotspot.id, { ...r, verdict: v, reason: r.verdict === v ? r.reason : undefined });
  };
  const setReason = (id: string) => {
    if (!hotspot || readOnly) return;
    playSfx("pick");
    onReview(hotspot.id, { ...r, reason: id });
  };

  return (
    <div className="@container space-y-3.5">
      <ol aria-label={tr("Elements")} className="flex flex-wrap items-center gap-2 rounded-[18px] border border-line bg-surface px-3.5 py-3">
        {hotspots.map((h, i) => {
          const rv = reviews[h.id];
          const cur = h.id === selected;
          const done = isDone(rv);
          const ok = rv?.verdict === "acceptable";
          return (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => {
                  playSfx("tap");
                  onSelect(h.id);
                }}
                aria-current={cur ? "step" : undefined}
                aria-label={tr("Element {n}: {label}, {mark}", { n: i + 1, label: h.label, mark: chipMark(i) })}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] font-mono text-xs font-semibold transition-colors active:translate-y-px @sm:h-[34px] @sm:w-[34px]",
                  cur
                    ? "border-solid border-brand-strong bg-brand-strong text-white shadow-[0_0_0_4px_rgba(123,108,255,0.25)]"
                    : done
                      ? ok
                        ? "border-solid border-ok bg-ok-bg text-ok"
                        : "border-solid border-[#ff7d5c] bg-bad-bg text-bad"
                      : rv?.verdict
                        ? "border-solid border-brand-strong text-muted"
                        : "border-dashed border-line-strong text-muted hover:border-subtle",
                )}
              >
                {done && !cur ? (ok ? <Check size={14} strokeWidth={3} aria-hidden /> : <X size={14} strokeWidth={3} aria-hidden />) : i + 1}
              </button>
            </li>
          );
        })}
        <li className="ms-auto font-mono text-[11px] text-muted" aria-live="polite">
          {tr("{n} of {m}", { n: reviewed, m: total })}
        </li>
      </ol>

      {hotspot ? (
        <div className="rounded-[22px] border-[1.5px] border-brand-strong bg-surface p-4 @sm:p-5" role="region" aria-label={tr("Review element {n}", { n: idx + 1 })}>
          <div className="font-mono text-xs font-semibold text-accent">{tr("Element {n} of {m}", { n: idx + 1, m: total })}</div>
          <h3 className="mt-1.5 font-display text-2xl font-extrabold leading-[1.1] tracking-tight text-fg">{hotspot.label}</h3>

          <fieldset disabled={readOnly} onKeyDown={numberKeys((i) => verdictOptions[i] && setVerdict(verdictOptions[i].id))} className="mt-4 min-w-0">
            <legend className="sr-only">{tr("Your judgement")}</legend>
            <div className="grid grid-cols-2 gap-2.5">
              {verdictOptions.map((o, i) => {
                const on = r.verdict === o.id;
                return (
                  <label
                    key={o.id}
                    className={cn(
                      "flex min-h-[96px] cursor-pointer flex-col justify-between gap-1.5 rounded-[18px] border-[1.5px] p-3 transition-[transform,border-color,background-color] has-[:disabled]:cursor-default has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent motion-safe:hover:has-[:enabled]:-translate-y-0.5 @sm:min-h-[108px] @sm:p-3.5",
                      on ? o.on : "border-line bg-raised hover:border-line-strong",
                    )}
                  >
                    <input type="radio" className="sr-only" name={`verdict-${hotspot.id}`} checked={on} onChange={() => setVerdict(o.id)} />
                    <span className="flex items-center justify-between">
                      <o.Icon size={24} strokeWidth={2.4} aria-hidden style={{ color: o.hue }} />
                      <span aria-hidden><Kbd>{i + 1}</Kbd></span>
                    </span>
                    <span className="text-base font-bold text-fg">{o.label}</span>
                    <span className="text-[12.5px] text-muted">{o.sub}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {r.verdict && (
            <div className="mt-[18px] animate-rise">
              <div className="flex items-baseline justify-between gap-2">
                <h4 id={`reason-h-${hotspot.id}`} className="font-display text-[19px] font-extrabold tracking-tight text-fg">{tr("Main reason")}</h4>
                <span className="font-mono text-[11px] text-muted">{tr("pick one")}</span>
              </div>
              <fieldset
                disabled={readOnly}
                aria-labelledby={`reason-h-${hotspot.id}`}
                onKeyDown={numberKeys((i) => reasons[i] && setReason(reasons[i].id))}
                className="mt-2.5 grid min-w-0 grid-cols-1 gap-2 @sm:grid-cols-2"
              >
                {reasons.map((x, i) => {
                  const on = r.reason === x.id;
                  return (
                    <label
                      key={x.id}
                      className={cn(
                        "flex min-h-[58px] cursor-pointer items-start gap-2.5 rounded-2xl border-[1.5px] p-2.5 transition-[border-color,background-color] has-[:disabled]:cursor-default has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
                        on ? "border-brand-strong bg-brand-deep" : "border-line bg-raised hover:border-line-strong",
                      )}
                    >
                      <input type="radio" className="sr-only" name={`reason-${hotspot.id}`} checked={on} onChange={() => setReason(x.id)} />
                      <span aria-hidden className="mt-[5px] h-2 w-2 shrink-0 rounded-full" style={{ background: reasonHue(x.id) }} />
                      <span className="min-w-0 flex-1 text-[12.5px] leading-snug text-fg">{x.label}</span>
                      {i < 9 && <span aria-hidden className="shrink-0"><Kbd>{i + 1}</Kbd></span>}
                    </label>
                  );
                })}
              </fieldset>
            </div>
          )}

          {r.verdict && r.reason && (
            <div className="mt-4 animate-rise space-y-3.5 border-t border-line pt-4">
              <NoteField key={hotspot.id} id={hotspot.id} note={r.note} readOnly={readOnly} onChange={(note) => onReview(hotspot.id, { ...r, note })} />
              {nextId && (
                <button
                  type="button"
                  onClick={() => {
                    playSfx("tap");
                    onSelect(nextId);
                  }}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-brand text-[15px] font-bold text-white transition-[transform,background-color] hover:bg-brand-strong active:translate-y-px"
                >
                  {tr("Next element")}
                  <span aria-hidden><Kbd className="border-transparent bg-black/20 text-white">↵</Kbd></span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-line-strong p-4 text-sm text-muted">{tr("Select an element in the list or on the interface to review it.")}</p>
      )}
    </div>
  );
}
