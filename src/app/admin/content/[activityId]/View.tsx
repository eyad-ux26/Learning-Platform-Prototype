"use client";

import { useRouteParams } from "@/state/routeParams";
import Link from "next/link";

import { useMemo, useState } from "react";
import { Workspace } from "@/activities/Workspace";
import { FLAGSHIP_ID } from "@/content/flagship";
import { latestPublished } from "@/domain/catalog";
import type { Activity, PathBundle } from "@/domain/types";
import { validateBundle } from "@/domain/validation";
import { AdminHeader } from "@/admin/AdminShell";
import { TextArea, TextInput } from "@/admin/fields";
import { SaveBar } from "@/admin/SaveBar";
import { useDraftEditor } from "@/admin/useDraftEditor";
import { getPathView, useApp } from "@/state/AppState";
import { Badge, Card, Notice, Tabs } from "@/components/ui";

export function ActivityEditorPage({ params }: { params?: Record<string, string> } = {}) {
  const { activityId } = useRouteParams<{ activityId: string }>(params);
  const { form, update, dirty, save, revert, entry } = useDraftEditor(FLAGSHIP_ID);
  const { state, learner } = useApp();
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const idx = form?.activities.findIndex((a) => a.id === activityId) ?? -1;
  const activity = idx >= 0 ? form!.activities[idx] : undefined;

  const previewView = useMemo(() => {
    if (!form || !entry) return undefined;
    const blank = { ...learner, attempts: [], evidence: [], drafts: {}, viewedConcepts: {}, enrollments: {} };
    const v = getPathView(state, blank, FLAGSHIP_ID, { bundle: form, version: (latestPublished(entry)?.version ?? 0) + 1 });
    return v && { ...v, canAccess: () => true, canAccessConcept: () => true, visible: true };
  }, [form, entry, state, learner]);

  if (!form || !activity) return <p className="text-muted">Activity not found. <Link href="/admin/content?tab=activities" className="text-accent">Back to activities</Link></p>;

  const edit = (fn: (a: Activity) => void) =>
    update((b: PathBundle) => {
      fn(b.activities[idx]);
      return b;
    });
  const issues = validateBundle(form).issues.filter((i) => i.path.startsWith(`activities[${idx}]`));

  return (
    <div className="max-w-6xl">
      <SaveBar dirty={dirty} onSave={save} onRevert={revert} previewHref={`/admin/preview/${FLAGSHIP_ID}/practice/${activity.id}`} />
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-subtle"><Link href="/admin/content?tab=activities" className="hover:text-fg">Activities</Link> / <span className="text-muted">{activity.title}</span></nav>
      <AdminHeader title={activity.title} description={<><Badge>{activity.template}</Badge> <Badge>{activity.kind}</Badge> <span className="ms-1">Context: {activity.contextLabel}</span></>} />
      {issues.length > 0 && <Notice tone="bad" className="mb-4" title="Validation issues">{issues.map((i) => i.message).join(" ")}</Notice>}
      <Tabs label="Editor view" value={tab} onChange={setTab} tabs={[{ id: "edit", label: "Edit" }, { id: "preview", label: "Preview with real renderer" }]} className="mb-6 max-w-md" />

      {tab === "edit" ? (
        <div className="space-y-6">
          <Card className="space-y-4 p-5" as="section">
            <h2 className="font-semibold text-fg">Instructions</h2>
            <TextInput label="Title" id="a-title" value={activity.title} onChange={(v) => edit((a) => (a.title = v))} />
            <TextArea label="Scenario" id="a-scenario" rows={4} value={activity.scenario} onChange={(v) => edit((a) => (a.scenario = v))} />
            <TextArea label="Task" id="a-task" rows={2} value={activity.task} onChange={(v) => edit((a) => (a.task = v))} />
            <TextArea label="Constraints (one per line)" id="a-cons" rows={4} value={activity.constraints.join("\n")} onChange={(v) => edit((a) => (a.constraints = v.split("\n")))} />
            <TextArea label="Solution text (shown when revealed)" id="a-sol" rows={3} value={activity.solution} onChange={(v) => edit((a) => (a.solution = v))} />
          </Card>

          {activity.template === "design-bench" && (
            <>
              <Card className="space-y-5 p-5" as="section">
                <h2 className="font-semibold text-fg">Choices</h2>
                <p className="text-sm text-muted">Option wording and tradeoffs can be edited. Behaviours and pass rules are fixed here so edits can’t silently change assessment.</p>
                {activity.decisions.map((d, di) => (
                  <fieldset key={d.id} className="space-y-3 rounded-lg border border-line p-3">
                    <legend className="px-1 text-xs text-subtle">Decision {di + 1} · {d.dimension}</legend>
                    <TextInput label="Prompt" id={`d-${d.id}`} value={d.prompt} onChange={(v) => edit((a) => a.template === "design-bench" && (a.decisions[di].prompt = v))} />
                    {d.options.map((o, oi) => (
                      <div key={o.id} className="grid gap-2 border-t border-line pt-3 md:grid-cols-2">
                        <TextInput label={`Option “${o.id}” label`} id={`o-${d.id}-${o.id}`} value={o.label} onChange={(v) => edit((a) => a.template === "design-bench" && (a.decisions[di].options[oi].label = v))} />
                        <TextInput label="Tradeoff" id={`ot-${d.id}-${o.id}`} value={o.tradeoff} onChange={(v) => edit((a) => a.template === "design-bench" && (a.decisions[di].options[oi].tradeoff = v))} />
                      </div>
                    ))}
                  </fieldset>
                ))}
              </Card>
              <Card className="space-y-4 p-5" as="section">
                <h2 className="font-semibold text-fg">Feedback</h2>
                {activity.rules.map((r, ri) => (
                  <fieldset key={r.criterionId} className="space-y-2 rounded-lg border border-line p-3">
                    <legend className="px-1 font-mono text-xs text-subtle">{r.criterionId}</legend>
                    <TextArea label="When met" id={`rp-${r.criterionId}`} rows={2} value={r.pass} onChange={(v) => edit((a) => a.template === "design-bench" && (a.rules[ri].pass = v))} />
                    <TextArea label="When not met" id={`rf-${r.criterionId}`} rows={2} value={r.fail} onChange={(v) => edit((a) => a.template === "design-bench" && (a.rules[ri].fail = v))} />
                  </fieldset>
                ))}
              </Card>
            </>
          )}

          {activity.template === "critique" && (
            <Card className="space-y-4 p-5" as="section">
              <h2 className="font-semibold text-fg">Elements and feedback</h2>
              {activity.hotspots.map((h, hi) => (
                <fieldset key={h.id} className="space-y-2 rounded-lg border border-line p-3">
                  <legend className="px-1 text-xs text-subtle">{hi + 1}. {h.verdict} · {h.criterionId}</legend>
                  <TextInput label="Label" id={`hl-${h.id}`} value={h.label} onChange={(v) => edit((a) => a.template === "critique" && (a.hotspots[hi].label = v))} />
                  <TextArea label="Explanation" id={`he-${h.id}`} rows={2} value={h.explanation} onChange={(v) => edit((a) => a.template === "critique" && (a.hotspots[hi].explanation = v))} />
                  <TextArea label="Suggested improvement" id={`hi-${h.id}`} rows={2} value={h.improvement} onChange={(v) => edit((a) => a.template === "critique" && (a.hotspots[hi].improvement = v))} />
                </fieldset>
              ))}
            </Card>
          )}

          {activity.template === "decision" && (
            <Card className="space-y-4 p-5" as="section">
              <h2 className="font-semibold text-fg">Decisions and consequences</h2>
              {activity.nodes.map((n, ni) => (
                <fieldset key={n.id} className="space-y-3 rounded-lg border border-line p-3">
                  <legend className="px-1 text-xs text-subtle">{n.title}</legend>
                  <TextArea label="Situation" id={`ns-${n.id}`} rows={2} value={n.situation} onChange={(v) => edit((a) => a.template === "decision" && (a.nodes[ni].situation = v))} />
                  {n.choices.map((c, ci) => (
                    <div key={c.id} className="grid gap-2 border-t border-line pt-3 md:grid-cols-2">
                      <TextInput label={`Choice “${c.id}”`} id={`c-${n.id}-${c.id}`} value={c.label} onChange={(v) => edit((a) => a.template === "decision" && (a.nodes[ni].choices[ci].label = v))} />
                      <TextArea label="Consequence" id={`cc-${n.id}-${c.id}`} rows={2} value={c.consequence} onChange={(v) => edit((a) => a.template === "decision" && (a.nodes[ni].choices[ci].consequence = v))} />
                    </div>
                  ))}
                </fieldset>
              ))}
            </Card>
          )}
        </div>
      ) : (
        previewView && (
          <div className="-mx-4 rounded-2xl border border-ai/30 sm:-mx-0">
            <p className="border-b border-ai/30 bg-ai-bg px-4 py-2 text-sm text-fg">Preview includes unsaved edits. Submissions use the real assessment rules but record nothing.</p>
            <Workspace key={JSON.stringify(activity)} view={previewView} activity={activity} mode="preview" backHref="/admin/content?tab=activities" />
          </div>
        )
      )}
    </div>
  );
}
