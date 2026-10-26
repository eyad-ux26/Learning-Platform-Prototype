"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Award, Check, Flame, GitFork, Layers, Lock, MapPin, Play, RotateCcw, ScanSearch, Search, SearchX, Trophy, type LucideIcon } from "lucide-react";
import { FLAGSHIP_ID } from "@/content/flagship";
import { BADGES } from "@/domain/badges";
import { RANKS } from "@/domain/progression";
import type { ActivityTemplate } from "@/domain/types";
import { useI18n } from "@/i18n";
import { dateLocale } from "@/i18n/core";
import { useApp, visibleLibrary } from "@/state/AppState";
import { Badge, Button, EmptyState, Frame, Kbd, inputClass, cn } from "@/components/ui";
import { SkillRing } from "@/components/SkillRing";
import { BadgeMedal } from "@/components/BadgeMedal";
import { PathCard, pathCode, pathProgressState } from "@/learner/PathCard";
import { PathMap } from "@/learner/PathMap";
import { useBadges } from "@/learner/useBadges";
import { useProgression } from "@/learner/useProgression";
import { currentPath, nextStep } from "@/learner/whereAmI";

const TEMPLATE_ICON: Record<ActivityTemplate, LucideIcon> = { "design-bench": Layers, critique: ScanSearch, decision: GitFork };

type Filter = "all" | "active" | "sample";

export default function HomePage() {
  const router = useRouter();
  const { state, learner } = useApp();
  const { tr, locale } = useI18n();
  const progression = useProgression();
  const badges = useBadges();
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

  // Where the learner is: their current path and the one next thing to do in it.
  const path = currentPath(library, learner);
  const step = path ? nextStep(path, learner) : undefined;
  const activity = step?.activity;
  const activityNo = activity && path ? path.bundle.activities.indexOf(activity) + 1 : 0;
  const isNew = learner.attempts.length === 0 && Object.keys(learner.viewedConcepts).length === 0;
  const firstName = learner.name.split(" ")[0];
  const complete = !!path?.completion.complete;
  const reopened = path
    ? path.bundle.skills.map((skill, index) => ({ skill, index })).filter(({ skill }) => {
        const p = path.progress[skill.id];
        return p && (p.practiceRecommended || (p.status === "developing" && p.lastResult?.met === false));
      })
    : [];
  const otherActive = library.filter((v) => v !== path && pathProgressState(v, learner) !== "not-started");

  // The one primary action on this screen. Enter triggers it when nothing else has focus.
  const heroHref = step?.href ?? "/";
  useEffect(() => {
    if (!path) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.metaKey && !e.ctrlKey && !e.altKey && e.target === document.body) router.push(heroHref);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [path, heroHref, router]);

  const HeroIcon = activity ? TEMPLATE_ICON[activity.template] : Trophy;
  const ctaLabel = step?.resume ? tr("Resume") : complete && !activity ? tr("View certificate") : isNew ? tr("Start") : tr("Continue");
  const goalPct = Math.min(1, progression.repToday / progression.dailyGoal);
  const goalC = 2 * Math.PI * 30;
  const weekday = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - offset));
    return d.toLocaleDateString(dateLocale(locale), { weekday: "narrow" });
  };
  const earnedIds = new Set(badges.map((b) => b.id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <p className="font-mono text-xs font-semibold text-accent">{isNew ? tr("Welcome, {name}", { name: firstName }) : tr("Welcome back, {name}", { name: firstName })}</p>

      <div className="mt-3 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-10">
          {/* You are here: the current path, the next activity and one button */}
          {path && (
            <Frame name={tr("You are here")} tagClassName="text-accent" className="mt-6">
              <section aria-labelledby="welcome" className="relative rounded-[26px] bg-brand p-5 text-white sm:p-7">
                <Link href={`/paths/${path.bundle.meta.id}`} className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-mono text-xs font-semibold text-white hover:bg-white/25 hover:text-white">
                  <MapPin size={13} aria-hidden className="shrink-0" />
                  <span className="truncate">{path.bundle.meta.title}</span>
                  {activityNo > 0 && <span className="shrink-0 text-[#dcd8ff]">· {tr("Activity {n} of {m}", { n: activityNo, m: path.bundle.activities.length })}</span>}
                </Link>
                <div className="mt-4 flex items-start gap-4">
                  <span className="floaty hidden h-[76px] w-[76px] shrink-0 items-center justify-center rounded-[22px] bg-white sm:flex" aria-hidden>
                    <HeroIcon className="h-10 w-10 text-brand" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h1 id="welcome" className="text-[30px] font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-[40px]">
                      {activity ? activity.title : complete ? tr("You completed {title}", { title: path.bundle.meta.title }) : tr("Review and retry")}
                    </h1>
                    {activity && (
                      <p className="mt-3 max-w-xl rounded-[14px] rounded-es-sm bg-white/[.14] px-3 py-2 text-[13px] leading-snug text-white/90"><span className="line-clamp-2">{activity.brief?.ask ?? activity.task}</span></p>
                    )}
                  </div>
                </div>
                {/* Skills toward the certificate */}
                {path.bundle.meta.availability === "full" && (
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <ul className="flex gap-1.5" aria-label={tr("{n}/{m} skills mastered", { n: path.completion.mastered.length, m: path.bundle.requiredSkillIds.length })}>
                      {path.bundle.skills.map((s, i) => path.progress[s.id] && (
                        <li key={s.id} title={s.name} className="rounded-full bg-[#101014]/40 p-0.5">
                          <SkillRing index={i} progress={path.progress[s.id]} size={34} />
                        </li>
                      ))}
                    </ul>
                    <span className="font-mono text-xs font-semibold text-[#e4e0ff]">{tr("{n}/{m} skills mastered", { n: path.completion.mastered.length, m: path.bundle.requiredSkillIds.length })}</span>
                    <ArrowRight size={14} aria-hidden className="text-[#dcd8ff]" />
                    <Link href={`/paths/${path.bundle.meta.id}/certificate`} className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-sk-amber hover:text-sk-amber">
                      <Award size={14} aria-hidden /> {tr("Certificate")}
                    </Link>
                  </div>
                )}
                <Link href={heroHref} className="press mt-5 flex w-full items-center justify-center gap-3 rounded-[14px] bg-white py-3.5 text-[17px] font-bold text-[#2b2370] shadow-[0_5px_0_#4a3fb8] hover:text-[#2b2370] sm:inline-flex sm:w-auto sm:px-6">
                  {activity && step?.rec?.type === "activity" && step.rec.locked ? <Lock size={17} aria-hidden /> : complete && !activity ? <Award size={18} aria-hidden /> : <Play size={18} fill="currentColor" aria-hidden />}
                  {ctaLabel}
                  <Kbd className="hidden border-[#c9c3ff] px-2 py-0.5 text-xs text-brand sm:inline">↵</Kbd>
                </Link>
              </section>
            </Frame>
          )}

          {/* The path as a map, around where the learner is */}
          {path && path.bundle.activities.length > 0 && (
            <Frame name={tr("Your path")} tagClassName="text-muted">
              <section aria-label={tr("Your path")} className="rounded-[26px] border border-line bg-surface p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="min-w-0 truncate text-lg font-extrabold">{path.bundle.meta.title}</h2>
                  <Link href={`/paths/${path.bundle.meta.id}`} className="shrink-0 text-sm font-semibold text-accent hover:underline">{tr("Full path")}</Link>
                </div>
                <PathMap view={path} learner={learner} currentId={activity?.id} window={5} className="mt-3" />
              </section>
            </Frame>
          )}

          {otherActive.length > 0 && (
            <section aria-labelledby="other-paths" className="flex flex-col gap-3">
              <h2 id="other-paths" className="text-xl font-extrabold">{tr("Your other paths")}</h2>
              <ul className="flex flex-col gap-2">
                {otherActive.map((v) => {
                  const n = nextStep(v, learner);
                  const mastered = v.completion.mastered.length;
                  const total = v.bundle.requiredSkillIds.length || v.bundle.skills.length;
                  return (
                    <li key={v.bundle.meta.id}>
                      <Link href={n.href} className="press flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-fg hover:text-fg">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{v.bundle.meta.title}</span>
                          <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
                            <span className="block h-full rounded-full bg-brand-strong" style={{ width: `${(mastered / Math.max(1, total)) * 100}%` }} />
                          </span>
                        </span>
                        <span className="shrink-0 font-mono text-xs text-muted">{tr("{n}/{m} skills mastered", { n: mastered, m: total })}</span>
                        <ArrowRight size={16} aria-hidden className="shrink-0 text-accent" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        {/* Side: today, badges, reopened, rank */}
        <aside className="flex min-w-0 flex-col gap-8 lg:pt-6" aria-label={tr("Your progress")}>
          <section aria-labelledby="today" className="rounded-[22px] border border-line bg-surface p-5">
            <div className="flex items-center gap-4">
              <span className="relative h-[72px] w-[72px] shrink-0" role="img" aria-label={tr("{n} of {m} Rep today", { n: progression.repToday, m: progression.dailyGoal })}>
                <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden>
                  <circle cx="36" cy="36" r="30" fill="none" stroke="#2c2c36" strokeWidth="9" />
                  <circle cx="36" cy="36" r="30" fill="none" stroke="#ffc94d" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${goalPct * goalC} ${goalC}`} transform="rotate(-90 36 36)" style={{ transition: "stroke-dasharray .4s ease" }} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-mono text-[15px] font-semibold">{progression.repToday}</span>
              </span>
              <span className="min-w-0">
                <span id="today" className="block font-display text-xl font-extrabold">{tr("Daily goal")}</span>
                <span dir="ltr" className="inline-block font-mono text-[13px] text-muted">{progression.repToday} / {progression.dailyGoal} Rep</span>
              </span>
            </div>
            {/* The week: a flame on each day practised */}
            <ol className="mt-4 grid grid-cols-7 gap-1 border-t border-line pt-4" aria-label={tr("Practice streak: {n} days", { n: progression.streakDays })}>
              {progression.last7.map((d, i) => (
                <li key={i} className="flex flex-col items-center gap-1">
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      d === "done" ? "bg-sk-coral text-[#2b0f06]" : d === "freeze" ? "bg-sk-sky/25 text-sk-sky" : "border border-dashed border-line-strong text-subtle",
                      i === 6 && "ring-2 ring-white/60",
                    )}
                  >
                    {d === "done" ? <Flame size={15} aria-hidden /> : d === "freeze" ? <Check size={13} aria-hidden /> : null}
                    <span className="sr-only">{d === "done" ? tr("Practised") : d === "freeze" ? tr("Freeze") : tr("No practice")}</span>
                  </span>
                  <span className="font-mono text-[10.5px] text-subtle" aria-hidden>{weekday(i)}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold"><Flame size={15} className="text-sk-coral" aria-hidden /> {tr("{n}-day streak", { n: progression.streakDays })}</p>
          </section>

          <section aria-labelledby="badges" className="rounded-[22px] border border-line bg-surface p-5">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="badges" className="font-display text-xl font-extrabold">{tr("Badges")}</h2>
              <span className="font-mono text-xs text-muted">{tr("{n} of {m}", { n: earnedIds.size, m: BADGES.length })}</span>
            </div>
            <ul className="mt-3 grid grid-cols-4 gap-y-3">
              {BADGES.map((b) => (
                <li key={b.id} className="flex justify-center"><BadgeMedal id={b.id} earned={earnedIds.has(b.id)} size={44} /></li>
              ))}
            </ul>
          </section>

          {reopened.length > 0 && path && (
            <section aria-labelledby="reopened" className="flex flex-col gap-2">
              <h2 id="reopened" className="flex items-center gap-2 font-mono text-xs font-semibold text-[#ff9d82]"><RotateCcw size={13} aria-hidden /> {tr("Worth another go")}</h2>
              {reopened.map(({ skill, index }) => (
                <Link key={skill.id} href={`/paths/${path.bundle.meta.id}/skills`} className="press pulse-coral flex items-center gap-3 rounded-[18px] border-[1.5px] border-sk-coral bg-bad-bg p-3 text-fg hover:text-fg">
                  <SkillRing index={index} progress={path.progress[skill.id]} size={44} track="#3a2620" />
                  <span className="min-w-0 font-semibold leading-tight">{skill.name}</span>
                </Link>
              ))}
            </section>
          )}

          <section aria-labelledby="career" className="rounded-[22px] border border-line bg-surface p-5">
            <h2 id="career" className="font-display text-xl font-extrabold">{tr("Career")}</h2>
            <ol className="mt-3 flex gap-1">
              {RANKS.map((r, i) => {
                const cur = i === progression.rankIndex;
                const past = i < progression.rankIndex;
                return (
                  <li key={r.id} aria-current={cur ? "step" : undefined} title={tr(r.name)} className={cn("h-2 flex-1 rounded-full", past ? "bg-brand" : cur ? "bg-brand-strong" : "bg-line")}>
                    <span className="sr-only">{tr(r.name)}{cur ? ` · ${tr("you")}` : ""}</span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-2 text-sm"><span className="font-semibold">{tr(progression.rank.name)}</span>{progression.next && <span className="text-muted"> → {tr(progression.next.name)}</span>}</p>
            <p className="mt-3 text-xs text-subtle">{tr("Rep, streak, rank and badges are prototype scoring from your own attempts. They never change a skill’s status.")}</p>
          </section>
        </aside>
      </div>

      {/* All paths */}
      <section aria-labelledby="library" className="mt-14 flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="library" className="text-[28px] font-extrabold tracking-tight">{tr("All paths")}</h2>
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
        {filtersActive && <p className="font-mono text-xs text-subtle" aria-live="polite">{tr("{n} of {m} paths match", { n: filtered.length, m: library.length })}</p>}

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
            <Badge tone="warn">{tr("Preview")}</Badge> {tr("Preview paths are not included in this prototype: an overview and one free sample only.")}
          </p>
        )}
      </section>
    </div>
  );
}
