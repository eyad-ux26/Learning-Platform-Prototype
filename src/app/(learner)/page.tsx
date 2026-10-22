"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GitFork, Layers, Lock, Play, RotateCcw, ScanSearch, Search, SearchX, Trophy, type LucideIcon } from "lucide-react";
import { FLAGSHIP_ID } from "@/content/flagship";
import { accessLabel, isSubscriptionActive } from "@/domain/access";
import { RANKS, REP } from "@/domain/progression";
import { recommendNext } from "@/domain/recommend";
import type { ActivityTemplate } from "@/domain/types";
import { useI18n } from "@/i18n";
import { useApp, visibleLibrary } from "@/state/AppState";
import { Badge, Button, EmptyState, Frame, Handles, Kbd, inputClass, cn } from "@/components/ui";
import { SkillRing } from "@/components/SkillRing";
import { PathCard, pathCode, pathProgressState } from "@/learner/PathCard";
import { StreakPill } from "@/learner/StatPills";
import { useProgression } from "@/learner/useProgression";

const TEMPLATE_ICON: Record<ActivityTemplate, LucideIcon> = { "design-bench": Layers, critique: ScanSearch, decision: GitFork };
const code = (prefix: string, i: number) => `${prefix}-${String(i + 1).padStart(2, "0")}`;

type Filter = "all" | "active" | "sample";

export default function HomePage() {
  const router = useRouter();
  const { state, learner } = useApp();
  const { tr, L, dateTime } = useI18n();
  const progression = useProgression();
  const library = useMemo(() => visibleLibrary(state, learner), [state, learner]);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [filter, setFilter] = useState<Filter>("all");

  const topics = [...new Set(library.map((v) => v.bundle.meta.topic))];
  const q = query.trim().toLowerCase();
  const filtered = library.filter((v) => {
    const m = v.bundle.meta;
    if (topic !== "all" && m.topic !== topic) return false;
    if (filter === "active" && pathProgressState(v, learner) === "not-started") return false;
    if (filter === "sample" && m.freeSampleActivityIds.length === 0) return false;
    if (!q) return true;
    const hay = [m.title, m.summary, m.topic, ...v.bundle.skills.map((s) => s.name), ...m.outcomes].join(" ").toLowerCase();
    return hay.includes(q);
  });
  const filtersActive = q || topic !== "all" || filter !== "all";
  const resetFilters = () => {
    setQuery("");
    setTopic("all");
    setFilter("all");
  };

  const flagship = library.find((v) => v.bundle.meta.id === FLAGSHIP_ID);
  const resume = learner.lastLocation && learner.drafts[learner.lastLocation.href.split("/").pop() ?? ""] ? learner.lastLocation : undefined;
  const rec = flagship ? recommendNext({ bundle: flagship.bundle, evidence: flagship.pathEvidence, attempts: flagship.pathAttempts, canAccess: flagship.canAccess }) : undefined;
  const recActivity = rec?.type === "activity" ? flagship!.bundle.activities.find((a) => a.id === rec.activityId) : undefined;
  const resumeActivity = resume && flagship ? flagship.bundle.activities.find((a) => a.id === resume.href.split("/").pop()) : undefined;
  const heroActivity = resumeActivity ?? recActivity;
  const reopened = (flagship?.bundle.skills ?? [])
    .map((skill, index) => ({ skill, index }))
    .filter(({ skill }) => {
      const p = flagship!.progress[skill.id];
      return p.practiceRecommended || (p.status === "developing" && p.lastResult?.met === false);
    });
  const isNew = learner.attempts.length === 0 && Object.keys(learner.viewedConcepts).length === 0;
  const firstName = learner.name.split(" ")[0];
  const subscribed = isSubscriptionActive(learner.access);

  // The one primary action on this screen. Enter triggers it when nothing else has focus.
  const heroHref = resume && resumeActivity ? resume.href : heroActivity ? `/paths/${FLAGSHIP_ID}/practice/${heroActivity.id}` : rec?.type === "review" ? `/paths/${FLAGSHIP_ID}/skills` : `/paths/${FLAGSHIP_ID}`;
  useEffect(() => {
    if (!flagship) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.metaKey && !e.ctrlKey && !e.altKey && e.target === document.body) router.push(heroHref);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flagship, heroHref, router]);

  // Progress through the contexts a path needs: one bar per required context.
  const required = (flagship?.bundle.requiredSkillIds ?? []).map((id) => flagship!.progress[id]);
  const totalBars = required.reduce((n, p) => n + p.requiredContexts, 0);
  const metBars = required.reduce((n, p) => n + Math.min(p.contextsMet.length, p.requiredContexts), 0);
  const HeroIcon = heroActivity ? TEMPLATE_ICON[heroActivity.template] : Trophy;
  const heroIndex = heroActivity ? flagship!.bundle.activities.findIndex((a) => a.id === heroActivity.id) : 0;
  const goalPct = Math.min(1, progression.repToday / progression.dailyGoal);
  const goalC = 2 * Math.PI * 34;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
      {/* Hero row */}
      <section className="grid gap-10 lg:grid-cols-3 lg:gap-7">
        <Frame name={`${tr("Next brief")}${heroActivity ? ` · ${code("BR", heroIndex)}` : ""}`} className="mt-6 min-w-0 lg:col-span-2 lg:mt-0">
          <Handles className="relative flex flex-wrap items-center gap-x-8 gap-y-6 rounded-[26px] bg-brand p-6 sm:p-[34px]">
            <svg className="cursor-drift absolute bottom-7 end-8 hidden sm:block" width="26" height="26" viewBox="0 0 24 24" fill="#fff" stroke="#2b2370" strokeWidth="1.4" strokeLinejoin="round" aria-hidden>
              <path d="M4 3l7 17 2.5-7.5L21 10z" />
            </svg>
            <div className="floaty flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-[26px] bg-white sm:h-[118px] sm:w-[118px] sm:rounded-[30px]" aria-hidden>
              <HeroIcon className="h-11 w-11 text-brand sm:h-[60px] sm:w-[60px]" strokeWidth={1.8} />
            </div>
            <section aria-labelledby="welcome" className="min-w-0 flex-1 basis-72">
              <p className="font-mono text-xs font-semibold text-[#d4cfff]">{isNew ? tr("Welcome, {name}", { name: firstName }) : tr("Welcome back, {name}", { name: firstName })}</p>
              {heroActivity ? (
                <>
                  <h1 id="welcome" className="mt-3 text-[34px] font-extrabold leading-[.98] tracking-[-0.03em] text-white sm:text-5xl lg:text-[52px]">{heroActivity.title}</h1>
                  <p className="mt-2 font-mono text-xs text-[#dcd8ff]">
                    {flagship!.bundle.meta.title} · {resume ? tr("Unfinished response saved {when}.", { when: dateTime(resume.at) }) : isNew ? tr("Free sample · covers all four skills") : rec?.type === "activity" ? L(rec.reason) : ""}
                  </p>
                  {/* The client's ask, kept to two lines so the title stays the first thing read. */}
                  <div className="mt-4 flex max-w-xl items-end gap-2">
                    <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-sk-amber text-[11px] font-bold text-[#2b1f00]" aria-hidden>{(heroActivity.brief?.from ?? heroActivity.contextLabel).trim()[0]}</span>
                    <p className="line-clamp-2 rounded-[14px] rounded-es-sm bg-white/[.14] px-3 py-2 text-[13px] leading-snug text-white/90">{heroActivity.brief?.ask ?? heroActivity.task}</p>
                  </div>
                </>
              ) : rec?.type === "complete" && flagship ? (
                <h1 id="welcome" className="mt-3 text-4xl font-extrabold leading-[.98] tracking-[-0.03em] text-white sm:text-5xl">{tr("You completed {title}", { title: flagship.bundle.meta.title })}</h1>
              ) : rec?.type === "review" ? (
                <>
                  <h1 id="welcome" className="mt-3 text-4xl font-extrabold leading-[.98] tracking-[-0.03em] text-white sm:text-5xl">{tr("Review and retry")}</h1>
                  <p className="mt-1.5 font-mono text-xs text-[#dcd8ff]">{L(rec.reason)}</p>
                </>
              ) : (
                <h1 id="welcome" className="mt-3 text-4xl font-extrabold leading-[.98] tracking-[-0.03em] text-white sm:text-5xl">{tr("Learn by making real design calls.")}</h1>
              )}
              {totalBars > 0 && (
                <div className="mb-6 mt-[18px] flex gap-1.5" role="img" aria-label={tr("{n} of {m} contexts met", { n: metBars, m: totalBars })}>
                  {Array.from({ length: totalBars }, (_, i) => (
                    <span key={i} className={cn("h-2 w-8 rounded-full", i < metBars ? "bg-white" : i === metBars ? "bg-sk-amber" : "bg-white/[.28]")} />
                  ))}
                </div>
              )}
              <Link
                href={heroHref}
                className="press inline-flex items-center gap-3 rounded-[14px] bg-white py-3.5 pe-4 ps-[22px] text-[17px] font-bold text-[#2b2370] hover:text-[#2b2370]"
              >
                {heroActivity && rec?.type === "activity" && rec.locked && !resume ? <Lock size={17} aria-hidden /> : <Play size={18} fill="currentColor" aria-hidden />}
                {resume && resumeActivity ? tr("Resume activity") : heroActivity ? tr("Continue") : rec?.type === "review" ? tr("See skill progress") : tr("Path overview")}
                <Kbd className="border-[#c9c3ff] px-2 py-0.5 text-xs text-brand">↵</Kbd>
              </Link>
            </section>
          </Handles>
        </Frame>

        <div className="flex min-w-0 flex-col gap-8">
          <Frame name={tr("Today")} className="mt-6 lg:mt-0">
            <div className="rounded-[22px] border border-line bg-surface p-5">
              <div className="flex items-center gap-[18px]">
                <span className="relative h-[84px] w-[84px] shrink-0" role="img" aria-label={tr("{n} of {m} Rep today", { n: progression.repToday, m: progression.dailyGoal })}>
                  <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden>
                    <circle cx="42" cy="42" r="34" fill="none" stroke="#2c2c36" strokeWidth="10" />
                    <circle cx="42" cy="42" r="34" fill="none" stroke="#ffc94d" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${goalPct * goalC} ${goalC}`} transform="rotate(-90 42 42)" style={{ transition: "stroke-dasharray .4s ease" }} />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-mono text-[17px] font-semibold">{progression.repToday}</span>
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[22px] font-extrabold">{tr("Daily goal")}</span>
                  <span dir="ltr" className="inline-block font-mono text-[13px] text-muted">{progression.repToday} / {progression.dailyGoal} Rep</span>
                </span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                <StreakPill p={progression} className="sm:hidden" />
                <Link href={subscribed ? "/account" : "/subscribe"}>
                  <Badge tone={subscribed ? "ok" : learner.access.plan === "expired" ? "warn" : "neutral"}>{L(accessLabel(learner.access))}</Badge>
                </Link>
              </div>
              <p className="mt-3 text-xs text-subtle">{tr("Rep, streak and rank are prototype scoring from your own attempts. They never change a skill’s status.")}</p>
            </div>
          </Frame>

          {reopened.length > 0 && flagship && (
            <Frame name={tr("Reopened")} tagClassName="text-[#ff9d82]">
              <ul className="space-y-3">
                {reopened.map(({ skill, index }) => (
                  <li key={skill.id}>
                    <Link href={`/paths/${FLAGSHIP_ID}/skills`} className="press pulse-coral flex items-center gap-4 rounded-[22px] border-[1.5px] border-sk-coral bg-bad-bg p-5 text-fg hover:text-fg">
                      <SkillRing index={index} progress={flagship.progress[skill.id]} size={60} track="#3a2620" />
                      <span className="min-w-0">
                        <span className="block font-display text-[21px] font-extrabold leading-tight">{skill.name}</span>
                        <span className="flex items-center gap-1.5 font-mono text-xs text-[#ffb8a5]">
                          <RotateCcw size={13} aria-hidden /> {tr("Worth another go")}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-subtle">{tr("Your latest attempt missed a criterion. Each comes back in a different context.")}</p>
            </Frame>
          )}
        </div>
      </section>

      {/* Specialisms */}
      <section aria-labelledby="library" className="mt-14 flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="library" className="text-[32px] font-extrabold tracking-tight">{tr("Specialisms")}</h2>
          <div role="group" aria-label={tr("Filter")} className="flex gap-1 rounded-xl border border-line bg-raised p-1">
            {(
              [
                ["all", tr("All")],
                ["active", tr("Active")],
                ["sample", tr("Free samples")],
              ] as [Filter, string][]
            ).map(([id, label]) => (
              <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)} className={cn("press min-h-9 rounded-[9px] px-3.5 py-1.5 text-[13px] font-semibold", filter === id ? "bg-line text-white" : "text-muted")}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <label htmlFor="search" className="sr-only">{tr("Search paths and skills")}</label>
            <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-subtle" aria-hidden />
            <input id="search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tr("Search paths, skills or outcomes")} className={`${inputClass} ps-9`} />
          </div>
          <div className="sm:w-52">
            <label htmlFor="f-topic" className="sr-only">{tr("Topic")}</label>
            <select id="f-topic" value={topic} onChange={(e) => setTopic(e.target.value)} className={inputClass}>
              <option value="all">{tr("All topics")}</option>
              {topics.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
        </div>
        <p className="font-mono text-xs text-subtle" aria-live="polite">
          {filtersActive ? tr("{n} of {m} paths match", { n: filtered.length, m: library.length }) : tr("Free samples are marked on each path. Everything else is included with one subscription.")}
        </p>

        {filtered.length === 0 ? (
          <EmptyState title={tr("No paths match these filters")} icon={<SearchX size={28} />} action={<Button variant="primary" onClick={resetFilters}>{tr("Reset search and filters")}</Button>}>
            {q ? <>{tr("Nothing matches “{query}”.", { query })} </> : null}{tr("Try a broader search, or clear the filters to see all {n} paths.", { n: library.length })}
          </EmptyState>
        ) : (
          <ul className="grid gap-x-[22px] gap-y-9 pt-3.5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((v) => (
              <li key={v.bundle.meta.id} className="flex">
                <PathCard view={v} learner={learner} code={pathCode(library.indexOf(v))} recommended={v.bundle.meta.id === FLAGSHIP_ID && isNew} />
              </li>
            ))}
          </ul>
        )}
        {library.some((v) => v.bundle.meta.availability === "preview") && (
          <p className="flex items-center gap-2 text-xs text-subtle">
            <Badge tone="warn">{tr("Preview")}</Badge> {tr("Paths marked Preview have an overview and one free sample activity in this prototype. Their full content is not included.")}
          </p>
        )}
      </section>

      {/* Career */}
      <section aria-labelledby="career" className="mt-14 flex flex-col gap-4">
        <h2 id="career" className="text-2xl font-extrabold">{tr("Career")}</h2>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <ol className="grid min-w-[560px] grid-cols-5 gap-2">
            {RANKS.map((r, i) => {
              const cur = i === progression.rankIndex;
              const past = i < progression.rankIndex;
              return (
                <li key={r.id} aria-current={cur ? "step" : undefined} className={cn("flex flex-col gap-1 rounded-[14px] border px-4 py-3.5", cur ? "border-brand bg-brand text-white" : past ? "border-line bg-[#202028] text-fg" : "border-dashed border-line text-[#6f6e7f]")}>
                  <span className="font-mono text-[11px] opacity-80">R{i + 1}{cur ? ` · ${tr("you")}` : ""}</span>
                  <span className="font-semibold">{tr(r.name)}</span>
                </li>
              );
            })}
          </ol>
        </div>
        <p className="text-xs text-subtle">{tr("Ranks are a prototype of progression, not a credential. Rep comes from your own attempts: {a} per new response, {b} per met criterion without hints and {c} per Mastered skill.", { a: REP.attempt, b: REP.metIndependent, c: REP.mastered })}</p>
      </section>
    </div>
  );
}
