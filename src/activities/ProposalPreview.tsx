"use client";

import { useEffect, useRef, useState } from "react";
import { History, Info, MessageSquareText, RotateCcw, Settings, Sparkles, Undo2, X, FileText, CheckCircle2, Clock } from "lucide-react";
import type { Behaviour, DesignBenchActivity, DesignDimension } from "@/domain/types";
import { cn } from "@/components/ui";
import { useProductI18n as useI18n } from "@/i18n";

export interface PreviewState {
  status: "proposed" | "applied" | "reverted";
  valueIso?: string;
  text?: string;
  altIndex?: number;
  sourceOpen?: boolean;
  tooltipOpen?: boolean;
  traceOpen?: boolean;
  dialogOpen?: boolean;
  reviewOpen?: boolean;
  editing?: boolean;
  typed?: string;
  excludeExceptions?: boolean;
  toast?: { text: string; until: number; kind: "undo" | "send" } | null;
  history: string[];
  log: string[];
  settingsNotice?: boolean;
  regenerated?: number;
}

const DEFAULTS: Record<DesignDimension, Behaviour> = {
  presentation: "as-fact",
  uncertainty: "none",
  evidence: "none",
  explanation: "none",
  correction: "inline-edit",
  commitment: "accept",
  recovery: "none",
  scope: "count",
};

export function behavioursFor(activity: DesignBenchActivity, selections: Record<string, string>): Record<DesignDimension, Behaviour> {
  const out = { ...DEFAULTS };
  if (activity.preview.proposal.kind === "bulk") out.presentation = "provisional";
  if (activity.decisions.some((d) => d.dimension === "correction")) out.correction = "regenerate";
  for (const d of activity.decisions) {
    const o = d.options.find((x) => x.id === selections[d.id]);
    if (o) out[d.dimension] = o.behaviour;
  }
  return out;
}

export function initialPreviewState(activity: DesignBenchActivity, b: Record<DesignDimension, Behaviour>): PreviewState {
  const p = activity.preview.proposal;
  const s: PreviewState = { status: "proposed", valueIso: p.valueIso, text: p.value, history: [], log: [], toast: null };
  if (b.commitment === "auto") return applyCommit(activity, b, s, "Applied automatically as soon as it was proposed.");
  return s;
}

const fmt = (iso?: string) =>
  iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "";

const DATE_RE = /(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d{1,2}) ([A-Za-z]{3}) (\d{4})/g;

function displayValue(activity: DesignBenchActivity, s: PreviewState, fmtFn: (iso?: string) => string = fmt) {
  const p = activity.preview.proposal;
  if (p.kind === "field") return fmtFn(s.valueIso) || p.value;
  return s.text ?? p.value;
}

function applyCommit(activity: DesignBenchActivity, b: Record<DesignDimension, Behaviour>, s: PreviewState, how: string): PreviewState {
  const p = activity.preview.proposal;
  const value = displayValue(activity, s);
  const now = Date.now();
  const log = [...s.log, how, `${p.impactText.split(" · ")[0]}.`];
  const history = b.recovery === "history" || b.recovery === "undo-history" || b.recovery === "rollback" ? [...s.history, `${p.label}: “${value}”`] : s.history;
  let toast: PreviewState["toast"] = null;
  if (b.recovery === "undo" || b.recovery === "undo-history") toast = { text: `${p.label} applied`, until: now + 10_000, kind: "undo" };
  if (b.recovery === "delayed-send") toast = { text: "Message queued", until: now + 20_000, kind: "send" };
  return { ...s, status: "applied", dialogOpen: false, reviewOpen: false, editing: false, toast, history, log };
}

export function ProposalPreview({
  activity,
  selections,
  state,
  onChange,
  readOnly,
}: {
  activity: DesignBenchActivity;
  selections: Record<string, string>;
  state: PreviewState;
  onChange: (s: PreviewState) => void;
  readOnly?: boolean;
}) {
  const { tr, L, locale, date } = useI18n();
  const b = behavioursFor(activity, selections);
  const p = activity.preview.proposal;
  const cfg = activity.preview;
  const set = (patch: Partial<PreviewState>) => onChange({ ...state, ...patch });
  const commit = (how: string) => onChange(applyCommit(activity, b, state, how));
  const [now, setNow] = useState(() => Date.now());
  const stateRef = useRef(state);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    stateRef.current = state;
    onChangeRef.current = onChange;
  });

  // Countdown for undo toasts and delayed sends.
  useEffect(() => {
    if (!state.toast) return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      const cur = stateRef.current;
      if (cur.toast && t >= cur.toast.until) {
        onChangeRef.current({ ...cur, toast: null, log: cur.toast.kind === "send" ? [...cur.log, "Message sent to the client. It can no longer be recalled."] : cur.log });
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [state.toast]);

  const fmtL = (iso?: string) =>
    iso ? (locale === "en" ? fmt(iso) : date(`${iso}T00:00:00Z`, { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })) : "";
  // Stored log/history lines are English; localise at display time (dates first, then the phrase templates).
  const locStored = (line: string) => {
    if (locale === "en") return line;
    const withDates = line.replace(DATE_RE, (m, d: string, mon: string, y: string) => {
      const t = new Date(`${d} ${mon} ${y} 00:00:00 UTC`);
      return Number.isNaN(t.getTime()) ? m : date(t.toISOString(), { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
    });
    return L(withDates);
  };
  const value = displayValue(activity, state, fmtL);
  const applied = state.status === "applied";
  const reverted = state.status === "reverted";

  const requestCommit = () => {
    if (b.commitment === "dialog") set({ dialogOpen: true });
    else if (b.commitment === "review") set({ reviewOpen: true });
    else if (b.commitment === "typed") set({ reviewOpen: true, typed: "" });
    else commit(`Applied when the user selected ${p.kind === "bulk" ? "Apply" : "Accept"}.`);
  };

  // Field and text suggestions return to their proposed state; changes that reached other people stay reverted.
  const undo = (how: string) =>
    onChange({
      ...state,
      status: p.kind === "field" || p.kind === "text" ? "proposed" : "reverted",
      toast: null,
      log: [...state.log, how],
      history: state.history.length ? [...state.history, `${p.label}: reverted`] : state.history,
    });

  const typePrompt = tr("Type {phrase} to confirm", { phrase: "\u0000" }).split("\u0000");
  if (typePrompt.length < 2) typePrompt.push("");
  const secondsLeft = state.toast ? Math.max(0, Math.ceil((state.toast.until - now) / 1000)) : 0;

  // ----- uncertainty -----
  const uncertainty =
    b.uncertainty === "percent" && p.percentText ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-pv-ok-bg px-2 py-0.5 text-xs font-semibold text-pv-ok">{p.percentText}</span>
    ) : b.uncertainty === "generic" ? (
      <p className="text-xs text-pv-muted">{p.genericText}</p>
    ) : b.uncertainty === "specific" ? (
      <p className="flex items-start gap-1.5 text-xs text-pv-warn">
        <Info size={13} className="mt-px shrink-0" aria-hidden />
        {p.specificText}
      </p>
    ) : null;

  // ----- evidence -----
  const evidence =
    b.evidence === "tooltip" ? (
      <span className="relative inline-flex">
        <button type="button" disabled={readOnly} onClick={() => set({ tooltipOpen: !state.tooltipOpen })} aria-expanded={!!state.tooltipOpen} className="inline-flex items-center gap-1 text-xs text-pv-muted underline decoration-dotted underline-offset-2">
          <Info size={12} aria-hidden /> {tr("About this suggestion")}
        </button>
        {state.tooltipOpen && <span role="tooltip" className="absolute start-0 top-6 z-10 w-56 rounded-md bg-pv-fg px-2.5 py-1.5 text-xs text-white shadow-lg">{p.tooltipText}</span>}
      </span>
    ) : b.evidence === "quote" && p.quote ? (
      <p className="text-xs italic text-pv-muted">{tr("From the source:")} {p.quote}</p>
    ) : b.evidence === "source" ? (
      <button type="button" disabled={readOnly} onClick={() => set({ sourceOpen: !state.sourceOpen })} aria-expanded={!!state.sourceOpen} className="inline-flex items-center gap-1 text-xs font-medium text-pv-accent underline underline-offset-2">
        <MessageSquareText size={12} aria-hidden /> {state.sourceOpen ? tr("Hide source") : tr("View source")}
      </button>
    ) : null;

  const explanation =
    b.explanation === "generic" ? (
      <p className="text-xs text-pv-muted">{p.kind === "change" ? tr("Found a better time.") : tr("Our AI identifies the most important points.")}</p>
    ) : b.explanation === "reason" && p.reasonText ? (
      <p className="rounded-md bg-pv-bg px-2.5 py-2 text-xs text-pv-fg"><span className="font-semibold">{tr("Why:")} </span>{p.reasonText}</p>
    ) : b.explanation === "trace" ? (
      <div>
        <button type="button" disabled={readOnly} onClick={() => set({ traceOpen: !state.traceOpen })} aria-expanded={!!state.traceOpen} className="text-xs font-medium text-pv-accent underline underline-offset-2">
          {state.traceOpen ? tr("Hide full assistant reasoning (2,140 words)") : tr("Show full assistant reasoning (2,140 words)")}
        </button>
        {state.traceOpen && (
          <pre className="mt-1 max-h-28 overflow-y-auto whitespace-pre-wrap rounded-md bg-pv-fg p-2 font-mono text-[10px] leading-snug text-[#cfd6e4]">
            {`step 1: tokenize input (412 tokens)\nstep 2: candidate set (23)\n  cand[0] score=0.412 …\n  cand[1] score=0.388 …\n  cand[2] score=0.201 …\nstep 3: rerank with constraints …\n  ${p.reasonText ?? ""}\nstep 4: post-process, format output …\n…`}
          </pre>
        )}
      </div>
    ) : null;

  // ----- correction controls -----
  const alternatives = p.alternatives ?? [];
  const correction = (() => {
    if (readOnly || applied) return null;
    if (b.correction === "regenerate")
      return (
        <button
          type="button"
          onClick={() => {
            const n = (state.regenerated ?? 0) + 1;
            const alt = alternatives[n % Math.max(1, alternatives.length)];
            set({ regenerated: n, valueIso: alt?.iso ?? state.valueIso, log: [...state.log, `Regenerated (attempt ${n + 1}). The user could not set the value directly.`] });
          }}
          className="inline-flex items-center gap-1 text-xs font-medium text-pv-accent"
        >
          <RotateCcw size={12} aria-hidden /> {tr("Try again")}
        </button>
      );
    if (b.correction === "settings")
      return (
        <button type="button" onClick={() => set({ settingsNotice: true })} className="inline-flex items-center gap-1 text-xs font-medium text-pv-accent">
          <Settings size={12} aria-hidden /> {tr("Edit in task settings")}
        </button>
      );
    if (b.correction === "alternatives" && alternatives.length)
      return (
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={tr("Choose a value")}>
          {alternatives.map((alt, i) => {
            const active = p.kind === "field" ? state.valueIso === alt.iso : (state.altIndex ?? 0) === i;
            return (
              <button
                key={alt.label}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  if (p.kind === "field") set({ valueIso: alt.iso, log: [...state.log, `User chose ${alt.label}.`] });
                  else set({ altIndex: i, text: i === 1 ? p.value.replace("€600", "€450") : p.value, log: [...state.log, `User chose “${alt.label}”.`] });
                }}
                className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", active ? "border-pv-accent bg-pv-info-bg text-pv-accent" : "border-pv-line bg-pv-surface text-pv-fg")}
              >
                {alt.label}
              </button>
            );
          })}
          {p.kind === "field" && (
            <button type="button" onClick={() => set({ editing: true })} className="text-xs font-medium text-pv-accent underline underline-offset-2">
              {tr("Other date")}
            </button>
          )}
        </div>
      );
    return null;
  })();

  const canEditInline = !readOnly && !applied && (b.correction === "inline-edit" || (b.correction === "alternatives" && p.kind === "field"));

  // ----- commit controls -----
  const commitControls = (() => {
    if (readOnly || applied || b.commitment === "auto" || b.commitment === "on-save") return null;
    const label = b.commitment === "review" ? (p.kind === "change" ? tr("Review and send") : tr("Review changes")) : p.kind === "bulk" ? tr("Apply") : p.kind === "text" && b.presentation === "chip" ? tr("Insert") : tr("Accept");
    return (
      <button type="button" onClick={requestCommit} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-pv-accent px-3 text-sm font-medium text-white">
        <CheckCircle2 size={14} aria-hidden /> {label}
      </button>
    );
  })();

  // ----- the proposal itself -----
  const fieldBox = (filledValue: string, provisional: boolean) =>
    state.editing && canEditInline && p.kind === "field" ? (
      <input
        type="date"
        aria-label={tr("{label}, edit", { label: p.label })}
        value={state.valueIso ?? ""}
        onChange={(e) => set({ valueIso: e.target.value, log: [...state.log, `User set the date to ${fmt(e.target.value)}.`] })}
        onBlur={() => set({ editing: false })}
        className="h-9 rounded-md border border-pv-accent bg-pv-surface px-2 text-sm text-pv-fg"
        autoFocus
      />
    ) : (
      <button
        type="button"
        disabled={!canEditInline}
        onClick={() => set({ editing: true })}
        aria-label={canEditInline ? tr("{label}: {value}. Select to edit", { label: p.label, value: filledValue }) : undefined}
        className={cn(
          "inline-flex min-h-9 items-center gap-1.5 rounded-md border px-2.5 text-sm text-pv-fg disabled:cursor-default",
          provisional && !applied ? "border-dashed border-[#b8a3f0] bg-pv-ai-bg" : "border-pv-line bg-pv-surface",
          canEditInline && "hover:border-pv-accent",
        )}
      >
        {provisional && !applied && <Sparkles size={13} className="text-pv-ai" aria-hidden />}
        {filledValue}
        {provisional && !applied && <span className="rounded bg-[#e4d9ff] px-1 text-[10px] font-semibold uppercase tracking-wide text-pv-ai">{tr("Suggested")}</span>}
      </button>
    );

  const proposalBody = (() => {
    if (p.kind === "field") {
      const showInField = b.presentation !== "chip" || applied;
      return (
        <div className="space-y-2">
          <div className="text-xs font-medium text-pv-muted">{p.label}</div>
          <div className="flex flex-wrap items-center gap-2">
            {showInField ? fieldBox(reverted ? tr("No due date") : value, b.presentation === "provisional") : <span className="inline-flex h-9 items-center rounded-md border border-pv-line bg-pv-surface px-2.5 text-sm text-pv-muted">{tr("No due date")}</span>}
            {b.presentation === "chip" && !applied && !reverted && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d9ccff] bg-pv-ai-bg px-2.5 py-1 text-xs font-medium text-pv-ai">
                <Sparkles size={12} aria-hidden /> {tr("Suggested:")} {state.editing && canEditInline ? fieldBox(value, false) : <button type="button" disabled={!canEditInline} onClick={() => set({ editing: true })} className="underline-offset-2 enabled:underline">{value}</button>}
              </span>
            )}
            {b.presentation === "as-fact" && !applied && !reverted && <span className="sr-only">{tr("Proposed value, shown as if confirmed")}</span>}
            {applied && <span className="inline-flex items-center gap-1 text-xs text-pv-ok"><CheckCircle2 size={13} aria-hidden /> {tr("Set")}</span>}
          </div>
          {!reverted && uncertainty}
          {!reverted && (evidence || correction) && <div className="flex flex-wrap items-center gap-3">{evidence}{correction}</div>}
        </div>
      );
    }
    if (p.kind === "text") {
      const editable = !readOnly && !applied && b.correction === "inline-edit";
      const textNode = editable ? (
        <textarea aria-label={tr("Summary text, editable")} value={state.text} onChange={(e) => set({ text: e.target.value })} rows={4} className="w-full rounded-md border border-pv-accent bg-pv-surface p-2 text-sm leading-relaxed text-pv-fg" />
      ) : (
        <p className="text-sm leading-relaxed text-pv-fg">
          {(state.text ?? p.value).split(". ").map((sentence, i, arr) => (
            <span key={i}>
              {sentence}
              {i < arr.length - 1 ? "." : ""}
              {b.evidence === "source" && (
                <button type="button" disabled={readOnly} onClick={() => set({ sourceOpen: true })} className="mx-0.5 rounded bg-pv-info-bg px-1 align-super text-[10px] font-semibold text-pv-accent">
                  {["§2", "§3", "§4.2", "§7"][i] ?? "§"}
                </button>
              )}{" "}
            </span>
          ))}
        </p>
      );
      const meta = (
        <div className="space-y-2">
          {uncertainty}
          {b.evidence !== "source" && evidence}
          {explanation}
          {correction}
        </div>
      );
      if (b.presentation === "as-fact" || applied)
        return (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-pv-muted">{tr("Summary")}</div>
            {textNode}
            {!applied && meta}
          </div>
        );
      return (
        <div className={cn("space-y-2 rounded-lg border p-3", b.presentation === "chip" ? "border-pv-line bg-pv-surface" : "border-dashed border-[#b8a3f0] bg-pv-ai-bg")}>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-pv-ai">
            <Sparkles size={13} aria-hidden /> {b.presentation === "chip" ? tr("Assistant draft · side panel") : tr("Assistant draft · not reviewed")}
          </div>
          {textNode}
          {meta}
        </div>
      );
    }
    if (p.kind === "change") {
      return (
        <div className={cn("space-y-2 rounded-lg border p-3", applied ? "border-pv-line bg-pv-surface" : "border-dashed border-[#b8a3f0] bg-pv-ai-bg")}>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-pv-ai">
            <Sparkles size={13} aria-hidden /> {applied ? tr("Change applied") : reverted ? tr("Change reverted") : p.label}
          </div>
          <p className="text-sm font-medium text-pv-fg">{reverted ? tr("Back at Thu 12 Mar, 14:00–14:45") : value}</p>
          {!reverted && explanation}
          <p className="text-xs text-pv-muted">{p.impactText}</p>
        </div>
      );
    }
    // bulk
    const rows = p.scopeRows ?? [];
    const visibleRows = state.excludeExceptions ? rows.filter((r) => !r[3]) : rows;
    return (
      <div className="space-y-2 rounded-lg border border-dashed border-[#b8a3f0] bg-pv-ai-bg p-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-pv-ai">
          <Sparkles size={13} aria-hidden /> {applied ? tr("Update applied") : reverted ? tr("Batch reverted") : p.label}
        </div>
        <p className="text-sm font-medium text-pv-fg">{p.value}</p>
        {b.scope === "count" && <p className="text-xs text-pv-muted">{state.excludeExceptions ? tr("1,090 products will change price") : p.scopeCount}</p>}
        {(b.scope === "sample" || b.scope === "diff") && (
          <div className="overflow-x-auto rounded-md border border-pv-line bg-pv-surface">
            <table className="w-full text-xs">
              <thead className="bg-pv-bg text-pv-muted">
                <tr>{(p.scopeColumns ?? []).filter((_, i) => b.scope === "diff" || i < 3).map((c) => <th key={c} scope="col" className="px-2 py-1.5 text-start font-medium">{c}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-pv-line">
                {(b.scope === "sample" ? rows.filter((r) => !r[3]).slice(0, 3) : visibleRows).map((r) => (
                  <tr key={r[0]} className={cn(b.scope === "diff" && r[3] && "bg-pv-warn-bg")}>
                    {r.filter((_, i) => b.scope === "diff" || i < 3).map((c, i) => <td key={i} className="px-2 py-1.5 text-pv-fg">{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-pv-line px-2 py-1.5 text-[11px] text-pv-muted">{b.scope === "sample" ? tr("Showing 3 example products") : tr("Showing 5 of {n} · filter, sort and search available", { n: state.excludeExceptions ? "1,090" : "1,240" })}</p>
          </div>
        )}
        {b.scope === "diff" && !applied && !readOnly && (
          <label className="flex items-center gap-2 text-xs text-pv-fg">
            <input type="checkbox" checked={!!state.excludeExceptions} onChange={(e) => set({ excludeExceptions: e.target.checked })} />
            {p.scopeExcluded}
          </label>
        )}
      </div>
    );
  })();

  // ----- recovery after commit -----
  const recovery = (() => {
    if (readOnly) return null;
    const items: React.ReactNode[] = [];
    if (state.toast)
      items.push(
        <div key="toast" role="status" className="flex items-center gap-3 rounded-lg bg-pv-fg px-3 py-2 text-sm text-white shadow-lg">
          <span className="flex-1">
            {state.toast.kind === "send" ? tr("Message to client sends in {n}s", { n: secondsLeft }) : tr("{text} · {n}s", { text: L(state.toast.text), n: secondsLeft })}
            <span className="ms-1 text-[11px] text-[#aab4c6]">{state.toast.kind === "send" ? tr("(60 s in the product; shortened here)") : ""}</span>
          </span>
          <button type="button" onClick={() => undo(state.toast!.kind === "send" ? "User cancelled the send. The client was never contacted." : "User selected Undo. The previous value was restored.")} className="inline-flex items-center gap-1 font-semibold text-[#9db7ff]">
            <Undo2 size={13} aria-hidden /> {state.toast.kind === "send" ? tr("Cancel send") : tr("Undo")}
          </button>
        </div>,
      );
    if (applied && b.recovery === "rollback")
      items.push(
        <button key="rb" type="button" onClick={() => undo(p.kind === "change" ? "Reverted. The slot was restored and the client was sent a correction." : "Batch reverted. Previous prices restored.")} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-pv-line bg-pv-surface px-3 text-sm text-pv-fg">
          <Undo2 size={13} aria-hidden /> {p.kind === "change" ? tr("Revert and notify client") : tr("Revert this batch")}
        </button>,
      );
    if (applied && b.recovery === "undo" && !state.toast && p.kind === "change") items.push(<p key="u" className="text-xs text-pv-muted">{tr("Undo restored only the calendar. The client still has the message.")}</p>);
    if (state.history.length)
      items.push(
        <div key="h" className="rounded-md border border-pv-line bg-pv-surface p-2.5">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-pv-muted"><History size={12} aria-hidden /> {tr("History")}</div>
          <ul className="space-y-1 text-xs text-pv-fg">
            {state.history.map((h, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span>{locStored(h)}</span>
                {applied && i === state.history.length - 1 && (
                  <button type="button" onClick={() => undo("Reverted from history.")} className="font-medium text-pv-accent">{tr("Revert")}</button>
                )}
              </li>
            ))}
          </ul>
        </div>,
      );
    return items.length ? <div className="space-y-2">{items}</div> : null;
  })();

  return (
    <div className="rounded-xl border border-line-strong bg-pv-bg p-1.5" role="group" aria-label={tr("{app} interface preview", { app: cfg.app })}>
      <div className="flex items-center justify-between gap-2 px-2 pb-1.5 pt-0.5">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#d4d8e0]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#d4d8e0]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#d4d8e0]" />
        </div>
        {cfg.breadcrumb && <span className="truncate text-[11px] text-pv-muted">{cfg.breadcrumb}</span>}
      </div>
      <div className="relative rounded-lg bg-pv-surface">
        <div className="flex items-center gap-3 border-b border-pv-line px-4 py-3">
          <span className="rounded bg-pv-fg px-1.5 py-0.5 text-[11px] font-bold text-white">{cfg.app}</span>
          <span className="truncate text-sm font-semibold text-pv-fg">{cfg.screenTitle}</span>
        </div>
        <div className="space-y-4 p-4">
          <div>
            <div className="flex items-center gap-2 text-base font-semibold text-pv-fg">
              <FileText size={16} className="text-pv-muted" aria-hidden />
              {cfg.recordTitle}
            </div>
            <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
              {cfg.recordFields.map((f) => (
                <div key={f.label} className="flex gap-2">
                  <dt className="w-28 shrink-0 text-pv-muted">{f.label}</dt>
                  <dd className="text-pv-fg">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {proposalBody}

          {state.settingsNotice && (
            <div className="flex items-start gap-2 rounded-md bg-pv-warn-bg p-2.5 text-xs text-pv-warn">
              <Settings size={13} className="mt-px" aria-hidden />
              <span>{tr("This would leave the panel and open Task settings → Dates, where the user finds the field again. (Simulated.)")}</span>
              <button type="button" onClick={() => set({ settingsNotice: false })} aria-label={tr("Dismiss")} className="ms-auto"><X size={13} /></button>
            </div>
          )}

          {state.sourceOpen && (
            <div className="rounded-md border border-pv-line bg-pv-bg p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-pv-fg">{p.source.title}</div>
                <button type="button" onClick={() => set({ sourceOpen: false })} aria-label={tr("Close source")} className="text-pv-muted"><X size={13} /></button>
              </div>
              <div className="text-[11px] text-pv-muted">{p.source.meta}</div>
              <p className="mt-2 text-sm leading-relaxed text-pv-fg">{highlight(p.source.body, p.source.highlight)}</p>
            </div>
          )}

          {state.reviewOpen && !applied && (
            <div className="space-y-3 rounded-lg border border-pv-line bg-pv-bg p-3">
              <div className="text-sm font-semibold text-pv-fg">{b.commitment === "typed" ? tr("Confirm update") : tr("Review before committing")}</div>
              {p.kind === "change" && p.reviewMessage && b.commitment === "review" && (
                <>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                    <dt className="text-pv-muted">{tr("Before")}</dt><dd className="text-pv-fg">{tr("Thu 12 Mar, 14:00–14:45")}</dd>
                    <dt className="text-pv-muted">{tr("After")}</dt><dd className="font-medium text-pv-fg">{tr("Fri 13 Mar, 10:00–10:45")}</dd>
                    <dt className="text-pv-muted">{tr("Sends to")}</dt><dd className="text-pv-fg">{tr("Elena Novak · SMS and email")}</dd>
                  </dl>
                  <div className="rounded-md bg-pv-surface p-2.5 text-xs text-pv-fg"><span className="font-semibold">{tr("Message:")} </span>{p.reviewMessage}</div>
                  <p className="text-[11px] text-pv-warn">{tr("Messages cannot be recalled once sent.")}</p>
                </>
              )}
              {p.kind === "bulk" && b.commitment === "review" && <p className="text-xs text-pv-fg">{tr("Check the list above, exclude anything that should not change, then apply.")}</p>}
              {b.commitment === "typed" && (
                <label className="block text-xs text-pv-fg">
                  {typePrompt[0]}<span className="font-mono font-semibold">{p.typedPhrase}</span>{typePrompt[1]}
                  <input value={state.typed ?? ""} onChange={(e) => set({ typed: e.target.value })} className="mt-1 block h-8 w-32 rounded-md border border-pv-line bg-pv-surface px-2 font-mono text-sm" />
                </label>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => set({ reviewOpen: false })} className="h-8 rounded-md px-3 text-sm text-pv-muted">{tr("Back")}</button>
                <button
                  type="button"
                  disabled={b.commitment === "typed" && state.typed !== p.typedPhrase}
                  onClick={() => commit(b.commitment === "typed" ? "Applied after the user typed the confirmation." : "Applied after the user reviewed the change.")}
                  className="h-8 rounded-md bg-pv-accent px-3 text-sm font-medium text-white disabled:opacity-40"
                >
                  {p.kind === "change" ? tr("Send to Elena") : p.kind === "bulk" ? tr("Apply to {n} products", { n: state.excludeExceptions ? "1,090" : "1,240" }) : tr("Apply")}
                </button>
              </div>
            </div>
          )}

          {state.dialogOpen && !applied && (
            <div className="rounded-xl border border-pv-line bg-pv-surface p-4 shadow-[0_8px_30px_rgba(15,23,42,0.18)]" role="alertdialog" aria-label={tr("Confirmation dialog in the product")}>
              <div className="text-sm font-semibold text-pv-fg">{tr("Are you sure?")}</div>
              <p className="mt-1 text-xs text-pv-muted">{tr("This will apply the suggested change.")}</p>
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" onClick={() => set({ dialogOpen: false })} className="h-8 rounded-md px-3 text-sm text-pv-muted">{tr("Cancel")}</button>
                <button type="button" onClick={() => commit("Applied after an “Are you sure?” dialog.")} className="h-8 rounded-md bg-pv-accent px-3 text-sm font-medium text-white">{tr("Yes")}</button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2">
            {b.commitment === "on-save" && !applied && !readOnly && (
              <button type="button" onClick={() => commit(b.presentation === "as-fact" ? "Saved with the task. The suggested value was committed along with the other edits." : "Saved with the task, including the suggested value.")} className="inline-flex h-8 items-center rounded-md border border-pv-line bg-pv-surface px-3 text-sm font-medium text-pv-fg">
                {tr("Save task")}
              </button>
            )}
            {commitControls}
          </div>

          {recovery}
        </div>
      </div>
      {state.log.length > 0 && (
        <div className="mt-1.5 rounded-lg bg-[#e9ecf2] p-3" aria-live="polite">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-pv-muted"><Clock size={11} aria-hidden /> {tr("What happened (simulation)")}</div>
          <ol className="space-y-0.5 text-xs text-pv-fg">
            {state.log.slice(-5).map((l, i) => <li key={i}>• {locStored(l)}</li>)}
          </ol>
        </div>
      )}
    </div>
  );
}

function highlight(text: string, phrase?: string) {
  if (!phrase) return text;
  const i = text.indexOf(phrase);
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="src-hl">{phrase}</mark>
      {text.slice(i + phrase.length)}
    </>
  );
}
