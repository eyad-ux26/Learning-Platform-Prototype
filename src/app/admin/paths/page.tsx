"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Search, SearchX } from "lucide-react";
import { latestPublished } from "@/domain/catalog";
import { AdminHeader } from "@/admin/AdminShell";
import { newPathBundle, slugify, statusLabel, workingCopy } from "@/admin/helpers";
import { useApp } from "@/state/AppState";
import { Badge, Button, Dialog, EmptyState, Field, inputClass } from "@/components/ui";

type Filter = "all" | "published" | "draft" | "unpublished" | "archived";

export default function AdminPathsPage() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [announce, setAnnounce] = useState("");
  const order = state.catalog.order;

  const rows = order
    .map((id) => state.catalog.entries[id])
    .filter((e) => {
      if (filter !== "all" && (filter === "draft" ? !(e.status === "draft" || e.draft) : e.status !== filter)) return false;
      const b = workingCopy(e);
      return !q.trim() || `${b.meta.title} ${b.meta.topic} ${b.meta.id}`.toLowerCase().includes(q.trim().toLowerCase());
    });

  const move = (id: string, dir: -1 | 1) => {
    const i = order.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    dispatch({ type: "catalog/reorder", order: next });
    setAnnounce(`${workingCopy(state.catalog.entries[id]).meta.title} moved to position ${j + 1} of ${order.length}.`);
    requestAnimationFrame(() => document.getElementById(`move-${dir < 0 ? "up" : "down"}-${id}`)?.focus());
  };

  const id = slugify(title);
  const exists = !!state.catalog.entries[id];
  const create = () => {
    if (!id || exists) return;
    dispatch({ type: "catalog/create", bundle: newPathBundle(id, title.trim()), now: new Date().toISOString() });
    setCreateOpen(false);
    setTitle("");
    router.push(`/admin/paths/${id}`);
  };

  return (
    <div className="max-w-6xl">
      <AdminHeader
        title="Paths"
        description="Edits are made to a draft. Learners only see published versions. Library order is a catalogue setting and applies as soon as you change it."
        action={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={15} aria-hidden /> New draft path</Button>}
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="psearch" className="sr-only">Search paths</label>
          <Search size={15} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-subtle" aria-hidden />
          <input id="psearch" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, topic or id" className={`${inputClass} ps-9`} />
        </div>
        <label className="sr-only" htmlFor="pfilter">Status</label>
        <select id="pfilter" value={filter} onChange={(e) => setFilter(e.target.value as Filter)} className={`${inputClass} sm:w-56`}>
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Has draft changes</option>
          <option value="unpublished">Unpublished</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <p className="sr-only" aria-live="polite">{announce}</p>

      {rows.length === 0 ? (
        <div className="mt-6"><EmptyState title="No paths match" icon={<SearchX size={26} />} action={<Button onClick={() => { setQ(""); setFilter("all"); }}>Clear search and filter</Button>} /></div>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-[var(--radius-card)] border border-line">
          <table className="w-full min-w-[760px] text-sm">
            <caption className="sr-only">Paths in library order</caption>
            <thead className="bg-surface text-xs text-subtle">
              <tr>
                <th scope="col" className="w-24 px-4 py-3 text-start font-medium">Order</th>
                <th scope="col" className="px-4 py-3 text-start font-medium">Path</th>
                <th scope="col" className="px-4 py-3 text-start font-medium">Status</th>
                <th scope="col" className="px-4 py-3 text-start font-medium">Published version</th>
                <th scope="col" className="px-4 py-3 text-start font-medium">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((e) => {
                const b = workingCopy(e);
                const s = statusLabel(e);
                const pos = order.indexOf(e.pathId);
                return (
                  <tr key={e.pathId} className="hover:bg-surface">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="w-5 text-xs text-subtle">{pos + 1}</span>
                        <button id={`move-up-${e.pathId}`} type="button" disabled={pos === 0} onClick={() => move(e.pathId, -1)} aria-label={`Move ${b.meta.title} up`} className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-raised disabled:opacity-30"><ArrowUp size={14} /></button>
                        <button id={`move-down-${e.pathId}`} type="button" disabled={pos === order.length - 1} onClick={() => move(e.pathId, 1)} aria-label={`Move ${b.meta.title} down`} className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-raised disabled:opacity-30"><ArrowDown size={14} /></button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/paths/${e.pathId}`} className="font-medium text-fg hover:underline">{b.meta.title}</Link>
                      <div className="text-xs text-subtle">{b.meta.topic} · {e.pathId}</div>
                    </td>
                    <td className="px-4 py-3"><Badge tone={s.tone}>{s.label}</Badge></td>
                    <td className="px-4 py-3 text-muted">{latestPublished(e) ? `v${latestPublished(e)!.version} · ${new Date(latestPublished(e)!.publishedAt).toLocaleDateString()}` : "—"}</td>
                    <td className="px-4 py-3 text-muted">{b.meta.availability === "full" ? "Full path" : "Preview + sample"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New draft path"
        description="Creates an unpublished draft with empty metadata. It won’t appear to learners until it passes validation and is published."
        footer={<><Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" disabled={!id || exists} onClick={create}>Create draft</Button></>}
      >
        <Field label="Title" htmlFor="new-title" hint={id ? (exists ? `A path with id “${id}” already exists.` : `Id: ${id}`) : "Used to generate the path id."}>
          <input id="new-title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} autoFocus />
        </Field>
      </Dialog>
    </div>
  );
}
