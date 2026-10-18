"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, BarChart3, FileJson, FolderKanban, History, Layers, ShieldAlert, Users } from "lucide-react";
import { PRODUCT_NAME } from "@/i18n/en";
import { useApp } from "@/state/AppState";
import { Badge, EmptyState, LinkButton, cn } from "@/components/ui";

const NAV = [
  { href: "/admin", label: "Overview", icon: BarChart3, exact: true },
  { href: "/admin/paths", label: "Paths", icon: FolderKanban },
  { href: "/admin/content", label: "Content and skills", icon: Layers },
  { href: "/admin/import", label: "Import", icon: FileJson },
  { href: "/admin/users", label: "Users and access", icon: Users },
  { href: "/admin/versions", label: "Versions", icon: History },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { learner } = useApp();

  if (learner.role === "learner") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <EmptyState
          title="The admin workspace needs an Editor or Admin role"
          icon={<ShieldAlert size={28} />}
          action={<div className="flex flex-wrap justify-center gap-2"><LinkButton href="/demo" variant="primary">Open demo controls</LinkButton><LinkButton href="/">Back to learning</LinkButton></div>}
        >
          {learner.name} is a learner. Switch to the Editor or Administrator scenario in Demo controls. This is a prototype demonstration, not real access control.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[232px_1fr]">
      <aside className="border-b border-line bg-surface lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-e">
        <div className="flex h-14 items-center gap-2 px-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-sm font-bold text-accent-ink" aria-hidden>{PRODUCT_NAME[0]}</span>
          <span className="font-semibold text-fg">{PRODUCT_NAME}</span>
          <Badge tone="ai" className="ms-1">Admin</Badge>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex min-h-10 shrink-0 items-center gap-2.5 rounded-lg px-3 text-sm", active ? "bg-raised text-fg" : "text-muted hover:bg-raised hover:text-fg")}>
                <Icon size={16} aria-hidden /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden space-y-3 border-t border-line p-4 text-xs text-subtle lg:absolute lg:inset-x-0 lg:bottom-0 lg:block">
          <p>Signed in as <span className="text-fg">{learner.name}</span> · <span className="capitalize">{learner.role}</span></p>
          <p>Role switching is a prototype demonstration, not secure authentication.</p>
          <Link href="/" className="inline-flex items-center gap-1.5 text-muted hover:text-fg"><ArrowLeft size={13} aria-hidden /> Back to learning</Link>
          <Link href="/demo" className="block text-muted hover:text-fg">Demo controls</Link>
        </div>
      </aside>
      <main id="main" className="min-w-0 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mb-4 flex items-center justify-between gap-2 text-xs text-subtle lg:hidden">
          <span>{learner.name} · <span className="capitalize">{learner.role}</span> (demo role)</span>
          <Link href="/" className="text-muted">Back to learning</Link>
        </div>
        {children}
      </main>
    </div>
  );
}

export function AdminHeader({ title, description, action }: { title: string; description?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function useCanPublish() {
  return useApp().learner.role === "admin";
}
