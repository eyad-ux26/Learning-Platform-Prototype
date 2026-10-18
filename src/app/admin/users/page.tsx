"use client";

import { useMemo, useState } from "react";
import { Search, SearchX, ShieldAlert } from "lucide-react";
import { FLAGSHIP_ID } from "@/content/flagship";
import { directoryUsers } from "@/content/directory";
import { accessLabel, addPeriod } from "@/domain/access";
import type { AccessState, LearnerRecord, Role } from "@/domain/types";
import { AdminHeader, useCanPublish } from "@/admin/AdminShell";
import { getPathView, useApp } from "@/state/AppState";
import { SkillStatusBadge } from "@/components/SkillStatus";
import { Badge, Button, Dialog, EmptyState, Notice, inputClass } from "@/components/ui";

interface Row {
  id: string;
  name: string;
  email: string;
  role: Role;
  plan: AccessState["plan"];
  live?: LearnerRecord;
  summary: string;
  lastActive: string;
}

export default function UsersPage() {
  const { state, dispatch } = useApp();
  const isAdmin = useCanPublish();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"all" | Role>("all");
  const [plan, setPlan] = useState<"all" | AccessState["plan"]>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const rows: Row[] = useMemo(() => {
    const live = Object.values(state.learners).map((l) => {
      const v = getPathView(state, l, FLAGSHIP_ID);
      return {
        id: l.id,
        name: l.name,
        email: l.email,
        role: l.role,
        plan: l.access.plan,
        live: l,
        summary: v && l.attempts.length ? `Calibrated Trust: ${v.completion.mastered.length} of ${v.bundle.requiredSkillIds.length} skills Mastered` : "No activity yet",
        lastActive: l.attempts.at(-1)?.submittedAt.slice(0, 10) ?? "—",
      };
    });
    const dir = directoryUsers.map((u) => ({ ...u, role: state.directoryOverrides[u.id]?.role ?? u.role, plan: state.directoryOverrides[u.id]?.plan ?? u.plan }));
    return [...live, ...dir];
  }, [state]);

  const filtered = rows.filter((r) => (role === "all" || r.role === role) && (plan === "all" || r.plan === plan) && (!q.trim() || `${r.name} ${r.email}`.toLowerCase().includes(q.trim().toLowerCase())));
  const open = rows.find((r) => r.id === openId);

  const setAccess = (r: Row, next: AccessState["plan"] | "cancel", billing: "monthly" | "annual" = "monthly") => {
    const now = new Date();
    if (r.live) {
      let access: AccessState;
      if (next === "subscriber") access = { plan: "subscriber", billing, since: now.toISOString(), periodEnd: addPeriod(now, billing).toISOString(), cancelAtPeriodEnd: false };
      else if (next === "cancel" && r.live.access.plan === "subscriber") access = { ...r.live.access, cancelAtPeriodEnd: true };
      else if (next === "expired") access = { plan: "expired", endedAt: now.toISOString() };
      else access = { plan: "free" };
      dispatch({ type: "setAccess", learnerId: r.id, access });
    } else if (next !== "cancel") {
      dispatch({ type: "setDirectoryOverride", userId: r.id, plan: next });
    }
  };
  const setRoleFor = (r: Row, newRole: Role) => (r.live ? dispatch({ type: "setRole", learnerId: r.id, role: newRole }) : dispatch({ type: "setDirectoryOverride", userId: r.id, role: newRole }));

  return (
    <div className="max-w-6xl">
      <AdminHeader title="Users and access" description="Fictional people only. Access and role changes are simulated in this browser." />
      <Notice tone="warn" className="mb-5" icon={<ShieldAlert size={16} />} title="Prototype demonstration">Roles shown here (Learner, Editor, Admin) are not secure authentication or authorisation. Production needs server-side identity and permission checks.</Notice>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="usearch" className="sr-only">Search users</label>
          <Search size={15} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-subtle" aria-hidden />
          <input id="usearch" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email" className={`${inputClass} ps-9`} />
        </div>
        <label htmlFor="urole" className="sr-only">Role</label>
        <select id="urole" value={role} onChange={(e) => setRole(e.target.value as typeof role)} className={`${inputClass} sm:w-40`}>
          <option value="all">All roles</option><option value="learner">Learner</option><option value="editor">Editor</option><option value="admin">Admin</option>
        </select>
        <label htmlFor="uplan" className="sr-only">Access</label>
        <select id="uplan" value={plan} onChange={(e) => setPlan(e.target.value as typeof plan)} className={`${inputClass} sm:w-44`}>
          <option value="all">All access</option><option value="free">Free</option><option value="subscriber">Subscriber</option><option value="expired">Expired</option>
        </select>
      </div>
      <p className="mt-3 text-sm text-subtle" aria-live="polite">{filtered.length} of {rows.length} people</p>

      {filtered.length === 0 ? (
        <div className="mt-4"><EmptyState title="No people match" icon={<SearchX size={26} />} action={<Button onClick={() => { setQ(""); setRole("all"); setPlan("all"); }}>Clear filters</Button>} /></div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-[var(--radius-card)] border border-line">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface text-xs text-subtle">
              <tr>{["Name", "Role", "Access", "Progress", "Last active"].map((h) => <th key={h} scope="col" className="px-4 py-3 text-start font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-surface">
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => setOpenId(r.id)} className="text-start font-medium text-fg hover:underline">{r.name}</button>
                    <div className="text-xs text-subtle">{r.email}{r.live && " · demo scenario"}</div>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted">{r.role}</td>
                  <td className="px-4 py-3"><Badge tone={r.plan === "subscriber" ? "ok" : r.plan === "expired" ? "warn" : "neutral"}>{r.live ? accessLabel(r.live.access) : r.plan}</Badge></td>
                  <td className="px-4 py-3 text-muted">{r.summary}</td>
                  <td className="px-4 py-3 text-muted">{r.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpenId(null)} title={open?.name ?? ""} description={open?.email} wide>
        {open && (
          <div className="space-y-5 text-sm">
            <section>
              <h3 className="font-semibold text-fg">Progress</h3>
              {open.live ? (() => {
                const v = getPathView(state, open.live, FLAGSHIP_ID);
                return v ? (
                  <ul className="mt-2 space-y-1.5">
                    {v.bundle.skills.map((s) => <li key={s.id} className="flex items-center justify-between gap-3"><span className="text-muted">{s.name}</span><SkillStatusBadge status={v.progress[s.id].status} /></li>)}
                    <li className="pt-1 text-xs text-subtle">{open.live.attempts.length} attempts · {Object.keys(open.live.drafts).length} unfinished · enrolled on v{open.live.enrollments[FLAGSHIP_ID]?.contentVersion ?? "—"}</li>
                  </ul>
                ) : null;
              })() : <p className="mt-1 text-muted">{open.summary} <span className="text-xs text-subtle">(seeded summary)</span></p>}
            </section>
            <section>
              <h3 className="font-semibold text-fg">Access (simulated)</h3>
              <p className="mt-1 text-muted">Current: {open.live ? accessLabel(open.live.access) : open.plan}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" disabled={!isAdmin} onClick={() => setAccess(open, "subscriber", "monthly")}>Grant monthly</Button>
                <Button size="sm" disabled={!isAdmin} onClick={() => setAccess(open, "subscriber", "annual")}>Grant annual</Button>
                {open.live?.access.plan === "subscriber" && <Button size="sm" disabled={!isAdmin} onClick={() => setAccess(open, "cancel")}>Cancel at period end</Button>}
                <Button size="sm" disabled={!isAdmin} onClick={() => setAccess(open, "expired")}>Expire now</Button>
                <Button size="sm" disabled={!isAdmin} onClick={() => setAccess(open, "free")}>Set to free</Button>
              </div>
            </section>
            <section>
              <h3 className="font-semibold text-fg">Role (demonstration only)</h3>
              <label htmlFor="role-sel" className="sr-only">Role</label>
              <select id="role-sel" disabled={!isAdmin} value={open.role} onChange={(e) => setRoleFor(open, e.target.value as Role)} className={`${inputClass} mt-2 sm:w-48`}>
                <option value="learner">Learner</option><option value="editor">Editor</option><option value="admin">Admin</option>
              </select>
            </section>
            {!isAdmin && <p className="text-xs text-subtle">Editors can view people but not change access or roles.</p>}
          </div>
        )}
      </Dialog>
    </div>
  );
}
