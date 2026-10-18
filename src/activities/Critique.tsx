"use client";

import { Check, X } from "lucide-react";
import type { CritiqueActivity, Evaluation, Verdict } from "@/domain/types";
import { cn, inputClass } from "@/components/ui";
import { ScreenRenderer, type HotspotMark } from "./ScreenRenderer";

type Reviews = Record<string, { verdict?: Verdict; reason?: string; note?: string }>;

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
  const numbers = Object.fromEntries(activity.hotspots.map((h, i) => [h.id, i + 1]));
  const labels = Object.fromEntries(activity.hotspots.map((h) => [h.id, h.label]));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-fg">Interface under review</h3>
        <p className="text-xs text-subtle">Select a numbered element to review it.</p>
      </div>
      <ScreenRenderer screen={activity.screen} mode={{ selected, onSelect, marks: critiqueMarks(activity, reviews, evaluation), numbers, labels }} />
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-subtle" aria-label="Legend">
        <li><span className="me-1 inline-block h-2.5 w-2.5 rounded-sm border border-dashed border-[#7c8bf5]" />Not reviewed</li>
        <li><Check size={11} className="me-1 inline text-ok" />{evaluation ? "Judged correctly" : "Acceptable"}</li>
        <li><X size={11} className="me-1 inline text-bad" />{evaluation ? "Judged incorrectly" : "Problematic"}</li>
      </ul>
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
  evaluation,
}: {
  activity: CritiqueActivity;
  reviews: Reviews;
  selected?: string;
  onSelect: (id: string) => void;
  onReview: (id: string, patch: Reviews[string]) => void;
  readOnly?: boolean;
  evaluation?: Evaluation;
}) {
  const reviewed = activity.hotspots.filter((h) => reviews[h.id]?.verdict && reviews[h.id]?.reason).length;
  const hotspot = activity.hotspots.find((h) => h.id === selected);
  const idx = hotspot ? activity.hotspots.indexOf(hotspot) : -1;
  const r = hotspot ? reviews[hotspot.id] ?? {} : {};
  const reasons = activity.reasons.filter((x) => x.appliesTo === r.verdict);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted" aria-live="polite">
        {reviewed} of {activity.hotspots.length} elements reviewed.
      </p>
      <ol className="space-y-1.5">
        {activity.hotspots.map((h, i) => {
          const rv = reviews[h.id];
          const correct = evaluation && rv?.verdict === h.verdict && !!rv.reason && h.correctReasons.includes(rv.reason);
          return (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => onSelect(h.id)}
                aria-current={selected === h.id ? "true" : undefined}
                className={cn("flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-start text-sm", selected === h.id ? "border-accent/60 bg-accent/5" : "border-line bg-surface hover:border-line-strong")}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-raised text-xs font-semibold">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-fg">{h.label}</span>
                <span className="shrink-0 text-xs">
                  {evaluation ? (
                    correct ? <span className="text-ok">✓ Correct</span> : <span className="text-bad">✗ Review</span>
                  ) : rv?.verdict ? (
                    <span className={rv.verdict === "acceptable" ? "text-ok" : "text-bad"}>
                      {rv.verdict === "acceptable" ? "✓ Acceptable" : "✗ Problematic"}
                      {!rv.reason && <span className="text-warn"> · no reason</span>}
                    </span>
                  ) : (
                    <span className="text-subtle">Not reviewed</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {hotspot && (
        <div className="space-y-4 rounded-xl border border-line-strong bg-raised p-4 animate-rise" aria-label={`Review element ${idx + 1}`} role="region">
          <h3 className="text-sm font-semibold text-fg">
            {idx + 1}. {hotspot.label}
          </h3>
          {evaluation ? (
            <div className="space-y-2 text-sm">
              <p className="text-muted">
                You judged: <span className="text-fg">{r.verdict ?? "—"}</span>
                {r.reason && <> · {activity.reasons.find((x) => x.id === r.reason)?.label}</>}
              </p>
              <p className="text-muted">
                Expected: <span className="text-fg">{hotspot.verdict}</span> · {activity.reasons.find((x) => x.id === hotspot.correctReasons[0])?.label}
              </p>
              <p className="text-fg">{hotspot.explanation}</p>
              <p className="text-muted"><span className="font-medium text-fg">Suggested improvement: </span>{hotspot.improvement}</p>
              {r.note && <p className="text-xs text-subtle">Your note (stored, not assessed): “{r.note}”</p>}
            </div>
          ) : (
            <>
              <fieldset disabled={readOnly}>
                <legend className="mb-2 text-sm text-muted">Your judgement</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(["acceptable", "problematic"] as const).map((v) => (
                    <label key={v} className={cn("flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent", r.verdict === v ? (v === "acceptable" ? "border-ok/50 bg-ok-bg text-ok" : "border-bad/50 bg-bad-bg text-bad") : "border-line bg-surface text-fg")}>
                      <input type="radio" className="sr-only" name={`verdict-${hotspot.id}`} checked={r.verdict === v} onChange={() => onReview(hotspot.id, { ...r, verdict: v, reason: r.verdict === v ? r.reason : undefined })} />
                      {v === "acceptable" ? <Check size={15} aria-hidden /> : <X size={15} aria-hidden />}
                      {v === "acceptable" ? "Acceptable" : "Problematic"}
                    </label>
                  ))}
                </div>
              </fieldset>
              {r.verdict && (
                <div className="space-y-1.5">
                  <label htmlFor={`reason-${hotspot.id}`} className="block text-sm text-muted">Main reason</label>
                  <select id={`reason-${hotspot.id}`} disabled={readOnly} value={r.reason ?? ""} onChange={(e) => onReview(hotspot.id, { ...r, reason: e.target.value || undefined })} className={inputClass}>
                    <option value="">Choose a reason…</option>
                    {reasons.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                  </select>
                </div>
              )}
              <div className="space-y-1.5">
                <label htmlFor={`note-${hotspot.id}`} className="block text-sm text-muted">Note <span className="text-subtle">(optional · saved, not assessed)</span></label>
                <textarea id={`note-${hotspot.id}`} disabled={readOnly} rows={2} value={r.note ?? ""} onChange={(e) => onReview(hotspot.id, { ...r, note: e.target.value })} className={inputClass} />
              </div>
              {idx < activity.hotspots.length - 1 && (
                <button type="button" onClick={() => onSelect(activity.hotspots[idx + 1].id)} className="text-sm font-medium text-accent hover:underline">
                  Next element →
                </button>
              )}
            </>
          )}
        </div>
      )}
      {!hotspot && <p className="rounded-lg border border-dashed border-line-strong p-4 text-sm text-muted">Select an element in the list or on the interface to review it.</p>}
    </div>
  );
}
