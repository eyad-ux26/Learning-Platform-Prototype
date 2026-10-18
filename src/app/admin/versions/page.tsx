"use client";

import Link from "next/link";
import { AdminHeader } from "@/admin/AdminShell";
import { statusLabel, workingCopy } from "@/admin/helpers";
import { useApp } from "@/state/AppState";
import { Badge, Card, Notice } from "@/components/ui";

export default function VersionsPage() {
  const { state } = useApp();
  const learners = Object.values(state.learners);

  return (
    <div className="max-w-5xl">
      <AdminHeader title="Versions" description="Every publish creates an immutable version. Drafts are never shown to learners." />
      <Notice tone="ai" className="mb-6" title="Provisional versioning policy (for review)">
        <ul className="mt-1 list-disc space-y-1 ps-4">
          <li>Learners only see published versions. Unsaved and saved draft edits are invisible to them.</li>
          <li>Each enrollment is pinned to the version it started on. New enrollments use the latest version.</li>
          <li>Every attempt records the content version it was assessed against. Publishing never re-evaluates or deletes past attempts or evidence.</li>
          <li>A learner can choose to move an enrollment to the latest version. Evidence recorded earlier keeps its original version label and still counts (open decision: whether changed activities should require fresh evidence).</li>
          <li>Library metadata (title, summary, order) shows the latest published version.</li>
        </ul>
      </Notice>
      <div className="space-y-4">
        {state.catalog.order.map((id) => {
          const e = state.catalog.entries[id];
          const s = statusLabel(e);
          return (
            <Card key={id} className="p-5" as="section">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-fg"><Link href={`/admin/paths/${id}`} className="hover:underline">{workingCopy(e).meta.title}</Link></h2>
                <Badge tone={s.tone}>{s.label}</Badge>
              </div>
              {e.versions.length === 0 ? (
                <p className="mt-2 text-sm text-muted">Never published.</p>
              ) : (
                <table className="mt-3 w-full text-sm">
                  <thead className="text-xs text-subtle"><tr>{["Version", "Published", "By", "Note", "Demo enrollments"].map((h) => <th key={h} scope="col" className="py-2 text-start font-medium">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-line">
                    {[...e.versions].reverse().map((v) => {
                      const enrolled = learners.filter((l) => l.enrollments[id]?.contentVersion === v.version);
                      const attempts = learners.flatMap((l) => l.attempts).filter((a) => a.pathId === id && a.contentVersion === v.version).length;
                      return (
                        <tr key={v.version}>
                          <td className="py-2 font-medium text-fg">v{v.version}</td>
                          <td className="py-2 text-muted">{new Date(v.publishedAt).toLocaleString()}</td>
                          <td className="py-2 text-muted">{v.publishedBy}</td>
                          <td className="py-2 text-muted">{v.note}</td>
                          <td className="py-2 text-muted">{enrolled.length ? enrolled.map((l) => l.name.split(" ")[0]).join(", ") : "—"} <span className="text-xs text-subtle">· {attempts} attempts</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {e.draft && <p className="mt-3 text-xs text-ai">Draft saved {e.draftUpdatedAt ? new Date(e.draftUpdatedAt).toLocaleString() : ""}, not yet published.</p>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
