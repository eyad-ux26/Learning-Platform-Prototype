"use client";

import { useRouteParams } from "@/state/routeParams";
import Link from "next/link";

import { useState } from "react";
import { AlertTriangle, Archive, CheckCircle2, Eye, Rocket, Save, Undo2, XCircle } from "lucide-react";
import { hasUnpublishedChanges, latestPublished } from "@/domain/catalog";
import type { CoverId, IconId, Level, PathBundle } from "@/domain/types";
import { validateBundle, type ValidationReport } from "@/domain/validation";
import { AdminHeader, useCanPublish } from "@/admin/AdminShell";
import { statusLabel } from "@/admin/helpers";
import { useDraftEditor } from "@/admin/useDraftEditor";
import { COVER_IDS, ICONS, PathCover } from "@/components/PathArt";
import { useApp } from "@/state/AppState";
import { Badge, Button, Card, Dialog, Field, LinkButton, Notice, inputClass, cn } from "@/components/ui";

export function PathEditorPage({ params }: { params?: Record<string, string> } = {}) {
  const { pathId } = useRouteParams<{ pathId: string }>(params);
  const { dispatch, publish } = useApp();
  const canPublish = useCanPublish();
  const { entry, form, update, dirty, save, revert } = useDraftEditor(pathId);
  const [publishOpen, setPublishOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [note, setNote] = useState("");
  const [result, setResult] = useState<{ published: boolean; report: ValidationReport } | null>(null);

  if (!entry || !form) return <p className="text-muted">Path not found. <Link href="/admin/paths" className="text-accent">Back to paths</Link></p>;

  const m = form.meta;
  const setMeta = (patch: Partial<PathBundle["meta"]>) => update((b) => ({ ...b, meta: { ...b.meta, ...patch } }));
  const discard = () => {
    if (entry.versions.length) dispatch({ type: "catalog/discardDraft", pathId });
    revert();
  };
  const report = validateBundle(form);
  const s = statusLabel(entry);
  const pub = latestPublished(entry);
  const changed = dirty || hasUnpublishedChanges(entry);

  const doPublish = () => {
    const r = publish(pathId, note, dirty ? form : undefined);
    revert();
    setResult(r);
    if (r.published) {
      setPublishOpen(false);
      setNote("");
    }
  };

  return (
    <div className="max-w-6xl">
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-subtle"><Link href="/admin/paths" className="hover:text-fg">Paths</Link> / <span className="text-muted">{m.title || pathId}</span></nav>
      <AdminHeader
        title={m.title || "Untitled path"}
        description={<>Status: <Badge tone={s.tone}>{s.label}</Badge> {pub && <span className="ms-2">Learners see v{pub.version}{entry.status !== "published" && " only when published"}.</span>}</>}
        action={
          <div className="flex flex-wrap gap-2">
            <LinkButton href={`/admin/preview/${pathId}`} variant="secondary" aria-label="Preview saved draft as a learner"><Eye size={15} aria-hidden /> Preview</LinkButton>
            <Button variant="primary" disabled={!canPublish} onClick={() => { setResult(null); setPublishOpen(true); }} title={canPublish ? undefined : "Only Admins can publish"}><Rocket size={15} aria-hidden /> Publish</Button>
          </div>
        }
      />
      {!canPublish && <Notice tone="neutral" className="mb-4">As an Editor you can edit drafts and preview them. Publishing, unpublishing and archiving need the Admin role.</Notice>}
      {dirty && (
        <Notice tone="warn" className="mb-4" icon={<AlertTriangle size={16} />} title="Unsaved changes" action={<div className="flex gap-2"><Button size="sm" variant="primary" onClick={save}><Save size={14} aria-hidden /> Save draft</Button><Button size="sm" variant="ghost" onClick={revert}>Undo unsaved edits</Button></div>}>
          Preview and learners don’t see these edits until you save the draft, and learners don’t see the draft until it is published.
        </Notice>
      )}
      {result?.published && <Notice tone="ok" className="mb-4" icon={<CheckCircle2 size={16} />} title={`Published version ${latestPublished(entry)?.version}`} action={<LinkButton href={`/paths/${pathId}`} size="sm">Open as learner</LinkButton>}>New enrollments use this version. Existing enrollments stay on the version they started.</Notice>}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="space-y-4 p-5" as="section" aria-labelledby="meta">
            <h2 id="meta" className="text-base font-semibold text-fg">Details</h2>
            <Field label="Name" htmlFor="m-title"><input id="m-title" value={m.title} onChange={(e) => setMeta({ title: e.target.value })} className={inputClass} /></Field>
            <Field label="Summary" htmlFor="m-summary"><textarea id="m-summary" rows={3} value={m.summary} onChange={(e) => setMeta({ summary: e.target.value })} className={inputClass} /></Field>
            <Field label="Learning outcomes" htmlFor="m-outcomes" hint="One per line."><textarea id="m-outcomes" rows={5} value={m.outcomes.join("\n")} onChange={(e) => setMeta({ outcomes: e.target.value.split("\n").filter((x, i, a) => x.trim() || i < a.length - 1) })} className={inputClass} /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Level" htmlFor="m-level">
                <select id="m-level" value={m.level} onChange={(e) => setMeta({ level: e.target.value as Level })} className={inputClass}>
                  {["Introductory", "Intermediate", "Advanced"].map((l) => <option key={l}>{l}</option>)}
                </select>
              </Field>
              <Field label="Estimated duration (hours)" htmlFor="m-hours"><input id="m-hours" type="number" min={0.5} step={0.5} value={m.estimatedHours} onChange={(e) => setMeta({ estimatedHours: Number(e.target.value) })} className={inputClass} /></Field>
              <Field label="Topic" htmlFor="m-topic"><input id="m-topic" value={m.topic} onChange={(e) => setMeta({ topic: e.target.value })} className={inputClass} /></Field>
            </div>
            <Field label="Intended audience" htmlFor="m-aud"><textarea id="m-aud" rows={2} value={m.audience} onChange={(e) => setMeta({ audience: e.target.value })} className={inputClass} /></Field>
            <Field label="Recommended prior knowledge" htmlFor="m-pre"><textarea id="m-pre" rows={2} value={m.prerequisites} onChange={(e) => setMeta({ prerequisites: e.target.value })} className={inputClass} /></Field>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-fg">Icon</legend>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(ICONS) as IconId[]).map((id) => {
                  const Icon = ICONS[id];
                  return (
                    <label key={id} className={cn("flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent", m.icon === id ? "border-accent bg-accent/10 text-accent" : "border-line text-muted")}>
                      <input type="radio" name="icon" className="sr-only" checked={m.icon === id} onChange={() => setMeta({ icon: id })} aria-label={id} />
                      <Icon size={18} aria-hidden />
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-fg">Cover</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {COVER_IDS.map((c: CoverId) => (
                  <label key={c} className={cn("cursor-pointer overflow-hidden rounded-lg border has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent", m.cover === c ? "border-accent" : "border-line")}>
                    <input type="radio" name="cover" className="sr-only" checked={m.cover === c} onChange={() => setMeta({ cover: c })} aria-label={`Cover: ${c}`} />
                    <PathCover cover={c} icon={m.icon} className="h-14 border-b-0" />
                  </label>
                ))}
              </div>
            </fieldset>
          </Card>

          <Card className="p-5" as="section" aria-labelledby="samples">
            <h2 id="samples" className="text-base font-semibold text-fg">Free sample activities</h2>
            <p className="mt-1 text-sm text-muted">Free learners can complete these. Everything else requires the subscription.</p>
            {form.activities.length === 0 ? (
              <p className="mt-3 text-sm text-subtle">This path has no activities yet. Add them through the JSON import.</p>
            ) : (
              <ul className="mt-3 space-y-1">
                {form.activities.map((a) => (
                  <li key={a.id}>
                    <label className="flex min-h-10 items-center gap-3 rounded-lg px-2 hover:bg-raised">
                      <input type="checkbox" checked={m.freeSampleActivityIds.includes(a.id)} onChange={(e) => setMeta({ freeSampleActivityIds: e.target.checked ? [...m.freeSampleActivityIds, a.id] : m.freeSampleActivityIds.filter((x) => x !== a.id) })} className="h-4 w-4 accent-[#8fb3ff]" />
                      <span className="text-sm text-fg">{a.title}</span>
                      <span className="ms-auto text-xs text-subtle">{a.template}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" disabled={!dirty} onClick={save}><Save size={15} aria-hidden /> Save draft</Button>
            {(entry.draft || dirty) && entry.versions.length > 0 && <Button variant="ghost" onClick={discard}><Undo2 size={15} aria-hidden /> Discard draft</Button>}
          </div>
        </div>

        <aside className="space-y-4">
          <Card className="p-5" as="section" aria-labelledby="validation">
            <h2 id="validation" className="flex items-center gap-2 text-sm font-semibold text-fg">
              {report.ok ? <CheckCircle2 size={16} className="text-ok" aria-hidden /> : <XCircle size={16} className="text-bad" aria-hidden />}
              {report.ok ? "Ready to publish" : "Publication blocked"}
            </h2>
            <p className="mt-1 text-xs text-subtle">Checked against the current form, including unsaved edits.</p>
            {report.issues.length > 0 && (
              <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto text-xs">
                {report.issues.map((i, k) => (
                  <li key={k} className={i.level === "error" ? "text-bad" : "text-warn"}>
                    <span className="font-semibold">{i.level === "error" ? "Error" : "Warning"}</span> · <span className="font-mono text-subtle">{i.path}</span>
                    <br />
                    <span className="text-muted">{i.message}</span>
                  </li>
                ))}
              </ul>
            )}
            {m.availability === "full" && report.coverage.length > 0 && (
              <div className="mt-4 border-t border-line pt-3">
                <p className="text-xs font-semibold text-muted">Skill coverage</p>
                <ul className="mt-2 space-y-1 text-xs">
                  {report.coverage.map((c) => (
                    <li key={c.skillId} className="flex justify-between gap-2">
                      <span className="text-muted">{c.skillName}</span>
                      <span className={cn("shrink-0 whitespace-nowrap", c.sufficient ? "text-ok" : "text-bad")}>{c.contexts.length} contexts {c.sufficient ? "✓" : "✗"}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/admin/content?tab=coverage" className="mt-2 inline-block text-xs text-accent hover:underline">Full coverage map</Link>
              </div>
            )}
          </Card>

          <Card className="space-y-3 p-5" as="section" aria-labelledby="lifecycle">
            <h2 id="lifecycle" className="text-sm font-semibold text-fg">Visibility</h2>
            <p className="text-xs text-muted">{entry.status === "published" ? "Visible in the learner library." : "Not visible to learners."} {changed && entry.status === "published" && "The library shows the last published version, not your draft."}</p>
            {entry.status === "published" && <Button size="sm" disabled={!canPublish} onClick={() => dispatch({ type: "catalog/setStatus", pathId, status: "unpublished" })}>Unpublish</Button>}
            {entry.status === "unpublished" && <Button size="sm" disabled={!canPublish} onClick={() => dispatch({ type: "catalog/setStatus", pathId, status: "published" })}>Republish v{pub?.version}</Button>}
            {entry.status !== "archived" ? (
              <Button size="sm" variant="danger" disabled={!canPublish} onClick={() => setArchiveOpen(true)}><Archive size={14} aria-hidden /> Archive</Button>
            ) : (
              <Button size="sm" disabled={!canPublish} onClick={() => dispatch({ type: "catalog/setStatus", pathId, status: pub ? "unpublished" : "draft" })}>Restore from archive</Button>
            )}
          </Card>
        </aside>
      </div>

      <Dialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        title={`Publish ${m.title}?`}
        wide
        description={dirty ? "Your unsaved edits will be saved to the draft first." : "Learners starting this path will get the new version. Existing enrollments stay on their recorded version and their attempts are not re-evaluated."}
        footer={<><Button variant="ghost" onClick={() => setPublishOpen(false)}>Cancel</Button><Button variant="primary" onClick={doPublish} disabled={!report.ok}>Publish version {(pub?.version ?? 0) + (changed ? 1 : 0) || 1}</Button></>}
      >
        {!report.ok ? (
          <Notice tone="bad" title="Fix these errors before publishing">
            <ul className="list-disc space-y-1 ps-4">{report.issues.filter((i) => i.level === "error").slice(0, 8).map((i, k) => <li key={k}>{i.message}</li>)}</ul>
          </Notice>
        ) : (
          <Field label="Change note" htmlFor="pub-note" hint="Shown in version history.">
            <input id="pub-note" value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} placeholder="e.g. Clarified the summary" />
          </Field>
        )}
        {result && !result.published && <Notice tone="bad" className="mt-3" title="Publishing was blocked">{result.report.issues.filter((i) => i.level === "error").map((i) => i.message).join(" ")}</Notice>}
      </Dialog>
      <Dialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={`Archive ${m.title}?`}
        description="The path is removed from the learner library and from enrolled learners’ navigation. Published versions, attempts and evidence are kept. You can restore it later."
        footer={<><Button variant="ghost" onClick={() => setArchiveOpen(false)}>Cancel</Button><Button variant="danger" onClick={() => { dispatch({ type: "catalog/setStatus", pathId, status: "archived" }); setArchiveOpen(false); }}>Archive path</Button></>}
      />
    </div>
  );
}
