"use client";

import { useState } from "react";
import { Info, Table2 } from "lucide-react";
import { analyticsRanges, metricDefinitions, seededAnalytics, type RangeId } from "@/content/directory";
import { AdminHeader } from "@/admin/AdminShell";
import { useApp } from "@/state/AppState";
import { Badge, Button, Card, Notice, Tabs } from "@/components/ui";

// Palette validated with the dataviz validator against the dark surface:
// single series blue; two-series pair blue/orange; ordinal blue ramp for status order.
const BLUE = "#3987e5";
const ORANGE = "#d95926";
const ORDINAL = ["#184f95", "#3987e5", "#86b6ef"];

export default function AdminOverview() {
  const { state } = useApp();
  const [range, setRange] = useState<RangeId>("30d");
  const [tables, setTables] = useState(false);
  const d = seededAnalytics[range];
  const r = analyticsRanges.find((x) => x.id === range)!;
  const conversion = ((d.converted / d.sampleStarters) * 100).toFixed(1);
  const maxPart = Math.max(...d.participation.map((p) => p.learners));
  const maxDrop = Math.max(...d.dropoff.map((p) => p.started));
  const localCounts = state.demoEvents.reduce<Record<string, number>>((acc, e) => ({ ...acc, [e.type]: (acc[e.type] ?? 0) + 1 }), {});

  return (
    <div className="max-w-6xl">
      <AdminHeader
        title="Overview"
        description="Seeded, fictional analytics for review. These figures do not come from real users and are not changed by anything you do in the prototype."
        action={<Badge tone="warn">Fictional data</Badge>}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Tabs label="Date range" tabs={analyticsRanges.map((x) => ({ id: x.id, label: x.label }))} value={range} onChange={setRange} className="w-full sm:w-auto" />
        <span className="text-sm text-subtle">{r.window}</span>
        <Button size="sm" variant="ghost" className="ms-auto" onClick={() => setTables((t) => !t)} aria-pressed={tables}>
          <Table2 size={14} aria-hidden /> {tables ? "Show charts" : "Show as tables"}
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Stat label="Active learners" value={d.activeLearners.toLocaleString()} sub={`${d.activePrev.toLocaleString()} in the previous ${r.label.toLowerCase().replace("last ", "")}`} def={metricDefinitions.active} />
        <Stat label="Sample-to-paid conversion" value={`${conversion}%`} sub={`${d.converted} of ${d.sampleStarters.toLocaleString()} sample starters subscribed within 14 days`} def={metricDefinitions.conversion} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card className="p-5" as="section" aria-labelledby="part">
          <h2 id="part" className="text-sm font-semibold text-fg">Path participation</h2>
          <p className="mt-1 text-xs text-subtle">{metricDefinitions.participation}</p>
          {tables ? (
            <DataTable cols={["Path", "Learners"]} rows={d.participation.map((p) => [p.title, p.learners.toLocaleString()])} />
          ) : (
            <ul className="mt-4 space-y-3">
              {d.participation.map((p) => (
                <li key={p.pathId} className="group">
                  <div className="flex justify-between gap-3 text-xs"><span className="truncate text-muted">{p.title}</span><span className="font-medium text-fg">{p.learners.toLocaleString()}</span></div>
                  <div className="mt-1 h-2.5 rounded-sm" title={`${p.title}: ${p.learners.toLocaleString()} learners`}>
                    <div className="h-2.5 rounded-e-[4px] transition-opacity group-hover:opacity-80" style={{ width: `${(p.learners / maxPart) * 100}%`, background: BLUE }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5" as="section" aria-labelledby="mastery">
          <h2 id="mastery" className="text-sm font-semibold text-fg">Skill mastery distribution · Calibrated Trust</h2>
          <p className="mt-1 text-xs text-subtle">{metricDefinitions.mastery}</p>
          {tables ? (
            <DataTable cols={["Skill", "Not yet", "Developing", "Mastered"]} rows={d.mastery.map((m) => [m.skill, String(m.notYet), String(m.developing), String(m.mastered)])} />
          ) : (
            <>
              <ul className="mt-3 flex flex-wrap gap-4 text-xs text-muted" aria-label="Legend">
                {["Not yet demonstrated", "Developing", "Mastered"].map((l, i) => (
                  <li key={l} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: ORDINAL[i] }} />{l}</li>
                ))}
              </ul>
              <ul className="mt-4 space-y-4">
                {d.mastery.map((m) => {
                  const total = m.notYet + m.developing + m.mastered;
                  const parts = [m.notYet, m.developing, m.mastered];
                  return (
                    <li key={m.skill}>
                      <div className="flex justify-between text-xs"><span className="text-muted">{m.skill}</span><span className="text-fg">{Math.round((m.mastered / total) * 100)}% mastered</span></div>
                      <div className="mt-1 flex h-3 gap-[2px]">
                        {parts.map((v, i) => (
                          <div key={i} className="h-3 first:rounded-s-[4px] last:rounded-e-[4px]" style={{ width: `${(v / total) * 100}%`, background: ORDINAL[i] }} title={`${["Not yet demonstrated", "Developing", "Mastered"][i]}: ${v} learners`} />
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </Card>

        <Card className="p-5 xl:col-span-2" as="section" aria-labelledby="drop">
          <h2 id="drop" className="text-sm font-semibold text-fg">Activity drop-off</h2>
          <p className="mt-1 text-xs text-subtle">{metricDefinitions.dropoff}</p>
          {tables ? (
            <DataTable cols={["Activity", "Opened", "Submitted", "Submitted share"]} rows={d.dropoff.map((x) => [x.activity, String(x.started), String(x.submitted), `${Math.round((x.submitted / x.started) * 100)}%`])} />
          ) : (
            <>
              <ul className="mt-3 flex gap-4 text-xs text-muted" aria-label="Legend">
                <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: BLUE }} />Opened</li>
                <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: ORANGE }} />Submitted</li>
              </ul>
              <ul className="mt-4 space-y-4">
                {d.dropoff.map((x) => (
                  <li key={x.activity}>
                    <div className="flex flex-wrap justify-between gap-2 text-xs"><span className="text-muted">{x.activity}</span><span className="text-fg">{Math.round((x.submitted / x.started) * 100)}% submitted</span></div>
                    <div className="mt-1 space-y-[2px]">
                      <div className="h-2 rounded-e-[4px]" style={{ width: `${(x.started / maxDrop) * 100}%`, background: BLUE }} title={`Opened: ${x.started}`} />
                      <div className="h-2 rounded-e-[4px]" style={{ width: `${(x.submitted / maxDrop) * 100}%`, background: ORANGE }} title={`Submitted: ${x.submitted}`} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      <section className="mt-10" aria-labelledby="local">
        <h2 id="local" className="text-lg font-semibold text-fg">Local demonstration events</h2>
        <Notice tone="neutral" className="mt-3" icon={<Info size={16} />}>
          Events from this browser’s prototype session only. They are kept separate from the seeded figures above and are not sent to any analytics pipeline.
        </Notice>
        {state.demoEvents.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No local events yet. Submit an activity or view a lesson as a learner.</p>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-[260px_1fr]">
            <Card className="p-4">
              <dl className="space-y-2 text-sm">
                {Object.entries(localCounts).map(([k, v]) => <div key={k} className="flex justify-between"><dt className="text-muted">{k.replace(/_/g, " ")}</dt><dd className="text-fg">{v}</dd></div>)}
              </dl>
            </Card>
            <Card className="max-h-72 overflow-y-auto p-0">
              <table className="w-full text-xs">
                <caption className="sr-only">Recent local events</caption>
                <thead className="sticky top-0 bg-surface text-subtle"><tr><th scope="col" className="px-3 py-2 text-start font-medium">Time</th><th scope="col" className="px-3 py-2 text-start font-medium">Learner</th><th scope="col" className="px-3 py-2 text-start font-medium">Event</th><th scope="col" className="px-3 py-2 text-start font-medium">Detail</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {[...state.demoEvents].reverse().slice(0, 50).map((e, i) => (
                    <tr key={i}><td className="px-3 py-2 text-muted">{new Date(e.at).toLocaleTimeString()}</td><td className="px-3 py-2 text-muted">{state.learners[e.learnerId]?.name ?? e.learnerId}</td><td className="px-3 py-2 text-fg">{e.type.replace(/_/g, " ")}</td><td className="px-3 py-2 text-muted">{e.detail}</td></tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, sub, def }: { label: string; value: string; sub: string; def: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-fg">{value}</p>
      <p className="mt-1 text-xs text-muted">{sub}</p>
      <p className="mt-3 border-t border-line pt-3 text-xs text-subtle"><span className="font-medium text-muted">Definition: </span>{def}</p>
    </Card>
  );
}

function DataTable({ cols, rows }: { cols: string[]; rows: string[][] }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs text-subtle"><tr>{cols.map((c, i) => <th key={c} scope="col" className={`py-2 font-medium ${i ? "text-end" : "text-start"}`}>{c}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">{rows.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i} className={`py-2 ${i ? "text-end text-fg" : "text-muted"}`}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
