"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, BookOpen, Columns3, LayoutGrid, LineChart, Settings2, UserRound, Volume2, VolumeX } from "lucide-react";
import { FLAGSHIP_ID } from "@/content/flagship";
import { t, PRODUCT_NAME } from "@/i18n/en";
import { useI18n } from "@/i18n";
import { useApp } from "@/state/AppState";
import { Button, cn } from "@/components/ui";
import { LanguageSwitch } from "./LanguageSwitch";
import { RankRing, RepPill, StreakPill } from "./StatPills";
import { useProgression } from "./useProgression";

const NAV = [
  { href: "/", label: "HQ", icon: LayoutGrid, match: (p: string) => p === "/" },
  { href: `/paths/${FLAGSHIP_ID}`, label: "Board", icon: Columns3, match: (p: string) => p.startsWith("/paths") && !p.includes("/explore/") },
  { href: `/paths/${FLAGSHIP_ID}#field-notes`, label: "Field notes", icon: BookOpen, match: (p: string) => p.includes("/explore/") },
  { href: "/progress", label: "Progress", icon: LineChart, match: (p: string) => p.startsWith("/progress") },
];

export function LearnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { tr } = useI18n();
  const { learner, loadStatus, dismissLoadStatus, dispatch } = useApp();
  const progression = useProgression();
  const soundOn = learner.preferences.sound !== false;
  const account = pathname.startsWith("/account") || pathname.startsWith("/subscribe");
  // The practice workspace has its own bottom action bar on small screens.
  const inWorkspace = pathname.includes("/practice/");

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink">
        {tr(t.nav.skip)}
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-[#15151a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#15151a]/85">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
          <Link href="/" aria-label={PRODUCT_NAME} className="flex items-center gap-2.5 font-display text-[21px] font-extrabold tracking-tight text-fg">
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-brand-strong" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l7 17 2.5-7.5L21 11z" /></svg>
            </span>
            <span className="hidden sm:inline">{PRODUCT_NAME}</span>
          </Link>
          <nav aria-label={tr("Main")} className="hidden gap-1 rounded-xl border border-line bg-raised p-1 md:flex">
            {NAV.map(({ href, label, icon: Icon, match }) => {
              const on = !account && match(pathname);
              return (
                <Link
                  key={label}
                  href={href}
                  title={tr(label)}
                  aria-label={tr(label)}
                  aria-current={on ? "page" : undefined}
                  className={cn("flex items-center gap-2 rounded-[9px] px-3 py-2 text-sm font-semibold", on ? "bg-line text-white" : "text-muted hover:text-white")}
                >
                  <Icon size={16} aria-hidden />
                  <span className="hidden lg:inline">{tr(label)}</span>
                </Link>
              );
            })}
          </nav>
          <div className="ms-auto flex items-center gap-2 sm:gap-3">
            <StreakPill p={progression} className="hidden sm:flex" />
            <RepPill p={progression} />
            <RankRing p={progression} showText={false} className="hidden md:flex xl:hidden" />
            <RankRing p={progression} className="hidden xl:flex" />
            <LanguageSwitch />
            <button
              type="button"
              onClick={() => dispatch({ type: "setPreferences", prefs: { sound: !soundOn } })}
              aria-label={soundOn ? tr("Turn sound off") : tr("Turn sound on")}
              aria-pressed={soundOn}
              className="press hidden h-10 w-10 items-center justify-center rounded-[10px] border border-line bg-raised text-[#d4d3de] sm:flex"
            >
              {soundOn ? <Volume2 size={18} aria-hidden /> : <VolumeX size={18} aria-hidden />}
            </button>
            {learner.role !== "learner" && (
              <Link href="/admin" className="hidden rounded-lg border border-line-strong px-3 py-1.5 text-sm text-fg hover:bg-raised xl:inline-flex">
                {tr(t.nav.admin)}
              </Link>
            )}
            <Link href="/account" className="flex h-10 w-10 items-center justify-center rounded-full bg-sk-amber text-sm font-bold text-[#2b1f00]" aria-label={tr("Account: {name}", { name: learner.name })}>
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
              {loadStatus === "recovered-invalid" && tr("Saved prototype data in this browser could not be read, so demo data was reset. A copy of the unreadable data was kept.")}
              {loadStatus === "unavailable" && tr("Browser storage is unavailable. The prototype works, but progress will not survive a refresh.")}
              {loadStatus === "content-refreshed" && tr("The prototype content was updated, so local demo data was reset to the new seed.")}
            </span>
            <Button size="sm" variant="ghost" onClick={dismissLoadStatus} className="ms-auto">
              {tr("Dismiss")}
            </Button>
          </div>
        </div>
      ) : null}

      <main id="main" className={cn("flex-1 md:pb-0", inWorkspace ? "pb-0" : "pb-20")}>
        {children}
      </main>

      <footer className={cn("border-t border-line", inWorkspace && "max-lg:hidden")}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 text-xs text-subtle sm:px-6">
          <span>{tr(t.product.prototypeNote)}</span>
          <Link href="/demo" className="ms-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:text-fg">
            <Settings2 size={13} aria-hidden /> {tr(t.nav.demo)}
          </Link>
        </div>
      </footer>

      {/* Mobile bottom navigation */}
      {!inWorkspace && (
        <nav aria-label={tr("Main")} className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-[#15151a]/95 md:hidden">
          {[...NAV, { href: "/account", label: t.nav.account, icon: UserRound, match: () => account }].map(({ href, label, icon: Icon, match }) => {
            const on = label === t.nav.account ? account : !account && match(pathname);
            return (
              <Link key={label} href={href} aria-current={on ? "page" : undefined} className={cn("flex min-h-14 flex-col items-center justify-center gap-0.5 px-0.5 font-mono text-[10.5px]", on ? "text-accent" : "text-subtle")}>
                <Icon size={18} aria-hidden />
                <span className="max-w-full truncate">{tr(label)}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
