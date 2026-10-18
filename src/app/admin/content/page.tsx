"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Pencil } from "lucide-react";
import { FLAGSHIP_ID } from "@/content/flagship";
import { skillsAssessedBy } from "@/domain/assessment";
import type { Activity, PathBundle } from "@/domain/types";
import { computeCoverage, MIN_CONTEXTS_PER_SKILL } from "@/domain/validation";
import { AdminHeader } from "@/admin/AdminShell";
import { SaveBar } from "@/admin/SaveBar";
import { useDraftEditor } from "@/admin/useDraftEditor";
import { TextArea, TextInput } from "@/admin/fields";
import { Badge, Card, Notice, Tabs } from "@/components/ui";

type Tab = "explore" | "skills" | "coverage" | "activities" | "notes";

export default function ContentPage() {
  const params = useSearchParams();
  const router = useRouter();
  const tab = (params.get("tab") as Tab) || "explore";
  const { form, update, dirty, save, revert } = useDraftEditor(FLAGSHIP_ID);
  if (!form) return null;

  return (
    <div className="max-w-6xl">
      <SaveBar dirty={dirty} onSave={save} onRevert={revert} previewHref={`/admin/preview/${FLAGSHIP_ID}`} />
      <AdminHeader title="Content and skills" description={<>Flagship path: <span className="text-fg">{form.meta.title}</span>. Edits go into the draft; publish from the path editor.</>} action={<Link href={`/admin/paths/${FLAGSHIP_ID}`} className="text-sm text-accent hover:underline">Open path editor</Link>} />
      <Tabs
        label="Content sections"
        value={tab}
        onChange={(t) => router.replace(`/admin/content?tab=${t}`)}
        tabs={[
          { id: "explore", label: "Explore", count: form.explore.length },
          { id: "skills", label: "Skills and criteria", count: form.skills.length },
          { id: "coverage", label: "Coverage map" },
          { id: "activities", label: "Activities", count: form.activities.length },
          { id: "notes", label: "Review notes", count: form.reviewNotes?.length ?? 0 },
        ]}
      />
      <div className="mt-6">
        {tab === "explore" && <ExploreEditor form={form} update={update} />}
        {tab === "skills" && <SkillsReview form={form} />}
        {tab === "coverage" && <CoverageMap form={form} />}
        {tab === "activities" && <ActivityList form={form} />}
        {tab === "notes" && <ReviewNotes form={form} />}
      </div>
    </div>
  );
}

function ExploreEditor({ form, update }: { form: PathBundle; update: (fn: (b: PathBundle) => PathBundle) => void }) {
  const [open, setOpen] = useState<string | null>(form.explore[0]?.id ?? null);
  const move = (i: number, d: -1 | 1) =>
    update((b) => {
      const j = i + d;
      [b.explore[i], b.explore[j]] = [b.explore[j], b.explore[i]];
      return b;
    });
  return (
    <ol className="space-y-3">
      {form.explore.map((c, i) => (
        <li key={c.id}>
          <Card className="p-0">
            <div className="flex items-center gap-2 p-3">
              <span className="w-6 text-center text-xs text-subtle">{i + 1}</span>
              <button type="button" onClick={() => setOpen(open === c.id ? null : c.id)} aria-expanded={open === c.id} className="flex min-h-10 flex-1 items-center gap-2 text-start text-sm font-medium text-fg">
                <ChevronDown size={15} className={open === c.id ? "" : "-rotate-90"} aria-hidden /> {c.title}
                {c.freeSample && <Badge tone="accent">Free</Badge>}
                {c.video && <Badge>Video placeholder</Badge>}
              </button>
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move “${c.title}” up`} className="flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-raised disabled:opacity-30"><ArrowUp size={14} /></button>
              <button type="button" disabled={i === form.explore.length - 1} onClick={() => move(i, 1)} aria-label={`Move “${c.title}” down`} className="flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-raised disabled:opacity-30"><ArrowDown size={14} /></button>
            </div>
            {open === c.id && (
              <div className="space-y-4 border-t border-line p-4">
                <TextInput label="Title" id={`t-${c.id}`} value={c.title} onChange={(v) => update((b) => ((b.explore[i].title = v), b))} />
                <TextArea label="Summary" id={`s-${c.id}`} rows={2} value={c.summary} onChange={(v) => update((b) => ((b.explore[i].summary = v), b))} />
                {c.sections.map((s, k) => (
                  <fieldset key={k} className="space-y-2 rounded-lg border border-line p-3">
                    <legend className="px-1 text-xs text-subtle">Section {k + 1}</legend>
                    <TextInput label="Heading" id={`h-${c.id}-${k}`} value={s.heading} onChange={(v) => update((b) => ((b.explore[i].sections[k].heading = v), b))} />
                    <TextArea label="Body" id={`b-${c.id}-${k}`} rows={4} value={s.body} onChange={(v) => update((b) => ((b.explore[i].sections[k].body = v), b))} />
                  </fieldset>
                ))}
                <TextArea label="Example" id={`e-${c.id}`} rows={3} value={c.example.body} onChange={(v) => update((b) => ((b.explore[i].example.body = v), b))} />
                <label className="flex items-center gap-2 text-sm text-fg">
                  <input type="checkbox" checked={c.freeSample} onChange={(e) => update((b) => ((b.explore[i].freeSample = e.target.checked), b))} className="h-4 w-4 accent-[#8fb3ff]" /> Free sample lesson
                </label>
                <p className="text-xs text-subtle">Comparisons and video storyboards are edited through the JSON content format in this prototype.</p>
              </div>
            )}
          </Card>
        </li>
      ))}
    </ol>
  );
}

function SkillsReview({ form }: { form: PathBundle }) {
  return (
    <div className="space-y-4">
      <Notice tone="neutral">Skill definitions and criteria are shown for review. Changing criteria changes how attempts are assessed, so in this prototype they are edited through the validated JSON import rather than inline.</Notice>
      {form.skills.map((s) => (
        <Card key={s.id} className="p-5" as="section">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-fg">{s.name}</h2>
            {form.requiredSkillIds.includes(s.id) && <Badge tone="accent">Required for completion</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted">{s.description}</p>
          <table className="mt-4 w-full text-sm">
            <thead className="text-xs text-subtle"><tr><th scope="col" className="py-2 text-start font-medium">Criterion</th><th scope="col" className="py-2 text-start font-medium">Reviewer note: what counts</th><th scope="col" className="py-2 text-start font-medium">Assessed by</th></tr></thead>
            <tbody className="divide-y divide-line align-top">
              {s.criteria.map((c) => {
                const acts = form.activities.filter((a) => a.criteria.includes(c.id));
                return (
                  <tr key={c.id}>
                    <td className="py-2 pe-4 text-fg">{c.statement}<div className="font-mono text-xs text-subtle">{c.id}</div></td>
                    <td className="py-2 pe-4 text-muted">{c.lookFor}</td>
                    <td className="py-2 text-xs text-muted">{acts.length} activities · {new Set(acts.map((a) => a.contextKey)).size} contexts</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      ))}
    </div>
  );
}

function criterionFeedback(a: Activity, criterionId: string): string {
  if (a.template === "design-bench") return a.rules.find((r) => r.criterionId === criterionId)?.fail ?? "";
  if (a.template === "critique") return a.hotspots.filter((h) => h.criterionId === criterionId).map((h) => `${h.label}: ${h.explanation}`)[0] ?? "";
  const sig = a.nodes.flatMap((n) => n.choices.flatMap((c) => c.signals)).find((s) => s.criterionId === criterionId && !s.met);
  return sig?.because ?? "";
}

function CoverageMap({ form }: { form: PathBundle }) {
  const coverage = computeCoverage(form);
  const conceptTitle = (id: string) => form.explore.find((c) => c.id === id)?.title ?? id;
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">Skill → assessment criterion → activity → variant → feedback → related Explore content. Each required skill needs at least {MIN_CONTEXTS_PER_SKILL} distinct contexts before the path can be published.</p>
      {form.skills.map((s) => {
        const cov = coverage.find((c) => c.skillId === s.id)!;
        return (
          <section key={s.id} aria-labelledby={`cov-${s.id}`}>
            <div className="flex flex-wrap items-center gap-2">
              <h2 id={`cov-${s.id}`} className="font-semibold text-fg">{s.name}</h2>
              <Badge tone={cov.sufficient ? "ok" : "bad"}>{cov.contexts.length} contexts {cov.sufficient ? "· sufficient" : "· insufficient"}</Badge>
            </div>
            <div className="mt-3 overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[900px] text-xs">
                <thead className="bg-surface text-subtle">
                  <tr>{["Criterion", "Activity", "Variant", "Context", "Feedback when unmet", "Related Explore"].map((h) => <th key={h} scope="col" className="px-3 py-2 text-start font-medium">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-line align-top">
                  {s.criteria.flatMap((c) =>
                    form.activities.filter((a) => a.criteria.includes(c.id)).map((a, k) => (
                      <tr key={`${c.id}-${a.id}`}>
                        <td className="px-3 py-2 text-fg">{k === 0 ? c.statement : ""}</td>
                        <td className="px-3 py-2"><Link href={`/admin/content/${a.id}`} className="text-accent hover:underline">{a.title}</Link><div className="text-subtle">{a.template}</div></td>
                        <td className="px-3 py-2 text-muted">{a.kind === "baseline" ? "Baseline" : `Alternative for “${form.activities.find((x) => x.id === a.alternativeFor)?.title}”`}</td>
                        <td className="px-3 py-2 text-muted">{a.contextLabel}<div className="font-mono text-subtle">{a.contextKey}</div></td>
                        <td className="max-w-xs px-3 py-2 text-muted">{criterionFeedback(a, c.id)}</td>
                        <td className="px-3 py-2 text-muted">{a.relatedConcepts.filter((id) => form.explore.find((x) => x.id === id)?.skillId === s.id).map(conceptTitle).join(", ") || a.relatedConcepts.map(conceptTitle)[0]}</td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ActivityList({ form }: { form: PathBundle }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line">
      <table className="w-full min-w-[760px] text-sm">
        <caption className="sr-only">Activity to skill mappings</caption>
        <thead className="bg-surface text-xs text-subtle">
          <tr>{["Activity", "Template", "Context", "Skills (criteria)", ""].map((h) => <th key={h} scope="col" className="px-4 py-3 text-start font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line align-top">
          {form.activities.map((a) => (
            <tr key={a.id}>
              <td className="px-4 py-3"><span className="text-fg">{a.title}</span><div className="text-xs text-subtle">{a.kind}{form.meta.freeSampleActivityIds.includes(a.id) && " · free sample"}</div></td>
              <td className="px-4 py-3 text-muted">{a.template}</td>
              <td className="px-4 py-3 text-muted">{a.contextLabel}</td>
              <td className="px-4 py-3 text-xs text-muted">
                {skillsAssessedBy(a, form.skills).map((sid) => {
                  const s = form.skills.find((x) => x.id === sid)!;
                  return <div key={sid}>{s.name} ({s.criteria.filter((c) => a.criteria.includes(c.id)).length})</div>;
                })}
              </td>
              <td className="px-4 py-3"><Link href={`/admin/content/${a.id}`} className="inline-flex items-center gap-1 text-accent hover:underline"><Pencil size={13} aria-hidden /> Edit and preview</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReviewNotes({ form }: { form: PathBundle }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">Claims and assumptions that need subject-matter review before production publication.</p>
      <ul className="space-y-2">
        {(form.reviewNotes ?? []).map((n) => <li key={n}><Card className="p-4 text-sm text-fg">{n}</Card></li>)}
      </ul>
    </div>
  );
}
