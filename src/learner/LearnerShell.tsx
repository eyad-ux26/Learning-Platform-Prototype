"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings2, UserRound, LineChart, AlertTriangle, Volume2, VolumeX } from "lucide-react";
import { accessLabel, isSubscriptionActive } from "@/domain/access";
import { t, PRODUCT_NAME } from "@/i18n/en";
import { useApp } from "@/state/AppState";
import { Badge, Button, cn } from "@/components/ui";

const NAV = [
  { href: "/", label: t.nav.home, icon: LayoutDashboard, match: (p: string) => p === "/" || p.startsWith("/paths") },
  { href: "/progress", label: "Progress", icon: LineChart, match: (p: string) => p.startsWith("/progress") },
  { href: "/account", label: t.nav.account, icon: UserRound, match: (p: string) => p.startsWith("/account") || p.startsWith("/subscribe") },
];

export function LearnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { learner, loadStatus, dismissLoadStatus, dispatch } = useApp();
  const soundOn = learner.preferences.sound !== false;
  const subscribed = isSubscriptionActive(learner.access);
  // The practice workspace has its own bottom action bar on small screens.
  const inWorkspace = pathname.includes("/practice/");

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink">
        {t.nav.skip}
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-[#15151a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#15151a]/85">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-fg">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-base font-extrabold text-white" aria-hidden>
              {PRODUCT_NAME[0]}
              <span className="absolute -bottom-1 -end-1 h-2 w-2 border border-brand-strong bg-white" />
            </span>
            <span>{PRODUCT_NAME}</span>
          </Link>
          <nav aria-label="Main" className="ms-2 hidden items-center gap-1 md:flex">
            {NAV.map(({ href, label, match }) => (
              <Link
                key={href}
                href={href}
                aria-current={match(pathname) ? "page" : undefined}
                className={cn("rounded-xl px-3 py-2 text-sm font-medium", match(pathname) ? "bg-brand-deep text-white" : "text-muted hover:text-fg")}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => dispatch({ type: "setPreferences", prefs: { sound: !soundOn } })}
              aria-label={soundOn ? "Turn sound off" : "Turn sound on"}
              aria-pressed={soundOn}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-raised text-muted hover:text-fg"
            >
              {soundOn ? <Volume2 size={17} aria-hidden /> : <VolumeX size={17} aria-hidden />}
            </button>
            <Link href={subscribed ? "/account" : "/subscribe"} className="hidden sm:block">
              <Badge tone={subscribed ? "ok" : learner.access.plan === "expired" ? "warn" : "neutral"}>{accessLabel(learner.access)}</Badge>
            </Link>
            {learner.role !== "learner" && (
              <Link href="/admin" className="hidden rounded-lg border border-line-strong px-3 py-1.5 text-sm text-fg hover:bg-raised sm:inline-flex">
                {t.nav.admin}
              </Link>
            )}
            <Link href="/account" className="flex h-10 w-10 items-center justify-center rounded-full bg-sk-amber text-sm font-bold text-[#2b1f00]" aria-label={`Account: ${learner.name}`}>
              {learner.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
            </Link>
          </div>
        </div>
      </header>

      {loadStatus === "recovered-invalid" || loadStatus === "unavailable" || loadStatus === "content-refreshed" ? (
        <div className="border-b border-warn/30 bg-warn-bg">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2 text-sm sm:px-6">
            <AlertTriangle size={16} className="text-warn" aria-hidden />
            <span className="text-fg">
              {loadStatus === "recovered-invalid" && "Saved prototype data in this browser could not be read, so demo data was reset. A copy of the unreadable data was kept."}
              {loadStatus === "unavailable" && "Browser storage is unavailable. The prototype works, but progress will not survive a refresh."}
              {loadStatus === "content-refreshed" && "The prototype content was updated, so local demo data was reset to the new seed."}
            </span>
            <Button size="sm" variant="ghost" onClick={dismissLoadStatus} className="ms-auto">
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}

      <main id="main" className={cn("flex-1 md:pb-0", inWorkspace ? "pb-0" : "pb-20")}>
        {children}
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 text-xs text-subtle sm:px-6">
          <span>{t.product.prototypeNote}</span>
          <Link href="/demo" className="ms-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:text-fg">
            <Settings2 size={13} aria-hidden /> {t.nav.demo}
          </Link>
        </div>
      </footer>

      {/* Mobile bottom navigation */}
      {!inWorkspace && <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-line bg-[#15151a]/95 md:hidden">
        {NAV.map(({ href, label, icon: Icon, match }) => (
          <Link key={href} href={href} aria-current={match(pathname) ? "page" : undefined} className={cn("flex min-h-14 flex-col items-center justify-center gap-0.5 font-mono text-[11px]", match(pathname) ? "text-accent" : "text-subtle")}>
            <Icon size={18} aria-hidden />
            {label}
          </Link>
        ))}
      </nav>}
    </div>
  );
}
