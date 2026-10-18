"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CheckCircle2, FileUp, XCircle } from "lucide-react";
import { Workspace } from "@/activities/Workspace";
import { invalidImportExample, validImportExample } from "@/content/importExamples";
import { saveDraft } from "@/domain/catalog";
import type { PathBundle } from "@/domain/types";
import { validateBundle, validateStructure, type ValidationReport } from "@/domain/validation";
import { AdminHeader } from "@/admin/AdminShell";
import { getPathView, useApp } from "@/state/AppState";
import { Badge, Button, Card, Dialog, Notice, inputClass } from "@/components/ui";

export default function ImportPage() {
  const { state, learner, dispatch } = useApp();
  const router = useRouter();
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<{ bundle?: PathBundle; report?: ValidationReport; structuralOk?: boolean; parseError?: string } | null>(null);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [previewActivity, setPreviewActivity] = useState<string | null>(null);

  const check = (raw: string) => {
    try {
      const json: unknown = JSON.parse(raw);
      // Structural errors prevent import; reference and coverage errors only block publication.
      const structuralOk = !validateStructure(json).some((i) => i.level === "error");
      setParsed({ bundle: structuralOk ? (json as PathBundle) : undefined, report: validateBundle(json), structuralOk });
    } catch (e) {
      setParsed({ parseError: (e as Error).message });
    }
    setPreviewActivity(null);
  };
  const load = (b: PathBundle) => {
    const raw = JSON.stringify(b, null, 2);
    setText(raw);
    check(raw);
  };

  const bundle = parsed?.bundle;
  const report = parsed?.report;
  const structuralOk = !!parsed?.structuralOk;
  const exists = bundle ? !!state.catalog.entries[bundle.meta.id] : false;

  const previewView = useMemo(() => {
    if (!bundle || !structuralOk || !previewActivity) return undefined;
    const fakeState = { ...state, catalog: { ...state.catalog, entries: { ...state.catalog.entries, [bundle.meta.id]: { pathId: bundle.meta.id, status: "draft" as const, versions: [], draft: bundle } } } };
    const blank = { ...learner, attempts: [], evidence: [], drafts: {}, viewedConcepts: {}, enrollments: {} };
    const v = getPathView(fakeState, blank, bundle.meta.id, { bundle, version: 1 });
    return v && { ...v, canAccess: () => true, canAccessConcept: () => true, visible: true };
  }, [bundle, structuralOk, previewActivity, state, learner]);

  const importAsDraft = () => {
    if (!bundle) return;
    const now = new Date().toISOString();
    if (exists) dispatch({ type: "catalog/setEntry", entry: saveDraft(state.catalog.entries[bundle.meta.id], bundle, now) });
    else dispatch({ type: "catalog/create", bundle, now });
    router.push(`/admin/paths/${bundle.meta.id}`);
  };

  return (
    <div className="max-w-6xl">
      <AdminHeader
        title="Import content"
        description={<>Paste a path in the documented JSON content format (see <code className="text-fg">docs/content-format.md</code>). The format is designed so content drafted with Claude’s help can be validated and previewed before anyone publishes it. Imports always arrive as drafts.</>}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-3 p-5" as="section" aria-labelledby="src">
          <h2 id="src" className="font-semibold text-fg">Source</h2>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => load(validImportExample())}>Load valid example</Button>
            <Button size="sm" onClick={() => load(invalidImportExample())}>Load invalid example</Button>
            <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-line-strong bg-raised px-3 text-sm text-fg hover:bg-overlay has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent">
              <FileUp size={14} aria-hidden /> Choose .json file
              <input type="file" accept="application/json,.json" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const t = await f.text(); setText(t); check(t); } }} />
            </label>
          </div>
          <label htmlFor="json" className="sr-only">Path JSON</label>
          <textarea id="json" value={text} onChange={(e) => setText(e.target.value)} rows={22} spellCheck={false} className={`${inputClass} font-mono text-xs`} placeholder='{ "formatVersion": 1, "meta": { … }, "skills": [ … ], … }' />
          <Button variant="primary" disabled={!text.trim()} onClick={() => check(text)}>Validate</Button>
        </Card>

        <Card className="space-y-4 p-5" as="section" aria-labelledby="result" aria-live="polite">
          <h2 id="result" className="font-semibold text-fg">Validation</h2>
          {!parsed && <p className="text-sm text-muted">Nothing validated yet.</p>}
          {parsed?.parseError && <Notice tone="bad" icon={<XCircle size={16} />} title="Not valid JSON">{parsed.parseError}</Notice>}
          {report && (
            <>
              <p className="flex items-center gap-2 text-sm">
                {report.ok ? <CheckCircle2 size={16} className="text-ok" aria-hidden /> : <XCircle size={16} className="text-bad" aria-hidden />}
                <span className="text-fg">{report.ok ? "Valid and publishable" : structuralOk ? "Can be imported as a draft, but publication will be blocked" : "Cannot be imported"}</span>
              </p>
              {report.issues.length > 0 && (
                <ul className="max-h-64 space-y-2 overflow-y-auto text-xs">
                  {report.issues.map((i, k) => (
                    <li key={k} className={i.level === "error" ? "text-bad" : "text-warn"}>
                      <span className="font-semibold">{i.level}</span> <span className="font-mono text-subtle">{i.path}</span> · <span className="text-muted">{i.message}</span>
                    </li>
                  ))}
                </ul>
              )}
              {bundle && structuralOk && (
                <div className="space-y-3 border-t border-line pt-4 text-sm">
                  <p className="font-medium text-fg">{bundle.meta.title} <Badge>{bundle.meta.availability === "full" ? "Full path" : "Preview + sample"}</Badge></p>
                  <p className="text-muted">{bundle.skills.length} skills · {bundle.activities.length} activities · {bundle.explore.length} Explore concepts</p>
                  {report.coverage.length > 0 && (
                    <ul className="space-y-1 text-xs">
                      {report.coverage.map((c) => <li key={c.skillId} className="flex justify-between gap-2"><span className="text-muted">{c.skillName}</span><span className={c.sufficient ? "text-ok" : "text-subtle"}>{c.contexts.length} contexts</span></li>)}
                    </ul>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {bundle.activities.map((a) => (
                      <Button key={a.id} size="sm" variant={previewActivity === a.id ? "primary" : "secondary"} onClick={() => setPreviewActivity(a.id)}>Preview “{a.title}”</Button>
                    ))}
                  </div>
                  <Button variant="primary" onClick={() => (exists ? setReplaceOpen(true) : importAsDraft())}>{exists ? "Replace existing draft…" : "Import as draft"}</Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {previewView && previewActivity && (
        <section className="mt-8 rounded-2xl border border-ai/30" aria-label="Activity preview">
          <p className="border-b border-ai/30 bg-ai-bg px-4 py-2 text-sm text-fg">Preview of imported content using the real renderer. Nothing is saved until you import.</p>
          <Workspace key={previewActivity} view={previewView} activity={previewView.bundle.activities.find((a) => a.id === previewActivity)!} mode="preview" backHref="/admin/import" />
        </section>
      )}

      <Dialog
        open={replaceOpen}
        onOpenChange={setReplaceOpen}
        title="Replace the existing draft?"
        description={`A path with id “${bundle?.meta.id}” already exists. Importing replaces its draft. Published versions and learner evidence are not affected.`}
        footer={<><Button variant="ghost" onClick={() => setReplaceOpen(false)}>Cancel</Button><Button variant="primary" onClick={importAsDraft}>Replace draft</Button></>}
      />
    </div>
  );
}
