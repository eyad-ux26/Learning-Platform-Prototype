"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Lock, PlayCircle, Search, SearchX } from "lucide-react";
import { FLAGSHIP_ID } from "@/content/flagship";
import { recommendNext } from "@/domain/recommend";
import { t } from "@/i18n/en";
import { useI18n } from "@/i18n";
import { useApp, visibleLibrary } from "@/state/AppState";
import { Badge, Button, EmptyState, Frame, Handles, LinkButton, SectionHeading, inputClass } from "@/components/ui";
import { CountRing, SkillRing } from "@/components/SkillRing";
import { PathCard, pathProgressState, type ProgressState } from "@/learner/PathCard";

export default function HomePage() {
  const { state, learner } = useApp();
  const { tr, L, dateTime } = useI18n();
  const library = useMemo(() => visibleLibrary(state, learner), [state, learner]);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [progress, setProgress] = useState<"all" | ProgressState>("all");
  const [access, setAccess] = useState<"all" | "free">("all");

  const topics = [...new Set(library.map((v) => v.bundle.meta.topic))];
  const q = query.trim().toLowerCase();
  const filtered = library.filter((v) => {
    const m = v.bundle.meta;
    if (topic !== "all" && m.topic !== topic) return false;
    if (progress !== "all" && pathProgressState(v, learner) !== progress) return false;
    if (access === "free" && m.freeSampleActivityIds.length === 0) return false;
    if (!q) return true;
    const hay = [m.title, m.summary, m.topic, ...v.bundle.skills.map((s) => s.name), ...m.outcomes].join(" ").toLowerCase();
    return hay.includes(q);
  });
  const filtersActive = q || topic !== "all" || progress !== "all" || access !== "all";
  const resetFilters = () => {
    setQuery("");
    setTopic("all");
    setProgress("all");
    setAccess("all");
  };

  const flagship = library.find((v) => v.bundle.meta.id === FLAGSHIP_ID);
  const resume = learner.lastLocation && learner.drafts[learner.lastLocation.href.split("/").pop() ?? ""] ? learner.lastLocation : undefined;
  const rec = flagship ? recommendNext({ bundle: flagship.bundle, evidence: flagship.pathEvidence, attempts: flagship.pathAttempts, canAccess: flagship.canAccess }) : undefined;
  const recActivity = rec?.type === "activity" ? flagship!.bundle.activities.find((a) => a.id === rec.activityId) : undefined;
  const reopened = (flagship?.bundle.skills ?? [])
    .map((skill, index) => ({ skill, index }))
    .filter(({ skill }) => {
      const p = flagship!.progress[skill.id];
      return p.practiceRecommended || (p.status === "developing" && p.lastResult?.met === false);
    });
  const isNew = learner.attempts.length === 0 && Object.keys(learner.viewedConcepts).length === 0;
  const firstName = learner.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Frame name={tr("Frame · Today")} className="mt-6">
        <Handles className="rounded-[28px] bg-brand p-6 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-center">
            <section aria-labelledby="welcome">
              <p className="font-mono text-xs font-semibold text-[#d4cfff]">{isNew ? tr("Welcome, {name}", { name: firstName }) : tr("Welcome back, {name}", { name: firstName })}</p>
              <h1 id="welcome" className="mt-3 text-4xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-5xl lg:text-6xl">{tr("Learn by making real design calls.")}</h1>
              <p className="mt-4 max-w-md text-base text-[#e4e0ff]">{tr("A path is done when you have shown every skill, not when you have watched everything.")}</p>
            </section>
            <div className="flex flex-col gap-4">
              {resume && (
                <section aria-labelledby="continue" className="rounded-[22px] bg-white p-5 text-[#17152e]">
                  <p id="continue" className="font-mono text-xs font-semibold text-[#5a5680]">{tr("Continue")}</p>
                  <p className="mt-1 text-lg font-bold">{resume.label}</p>
                  <p className="mt-0.5 text-sm text-[#5a5680]">{tr("Unfinished response saved {when}.", { when: dateTime(resume.at) })}</p>
                  <LinkButton href={resume.href} variant="primary" className="mt-3"><PlayCircle size={16} aria-hidden /> {tr("Resume activity")}</LinkButton>
                </section>
              )}
              {flagship && (
                <section aria-labelledby="recommended" className="rounded-[22px] bg-white p-5 text-[#17152e]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p id="recommended" className="font-mono text-xs font-semibold text-[#5a5680]">{tr("Recommended next")}</p>
                      {rec?.type === "activity" && recActivity ? (
                        <>
                          <p className="mt-1 text-lg font-bold leading-snug">{recActivity.title}</p>
                          <p className="mt-0.5 text-sm text-[#5a5680]">{flagship.bundle.meta.title} · {isNew ? tr("Free sample · covers all four skills") : L(rec.reason)}</p>
                        </>
                      ) : rec?.type === "complete" ? (
                        <p className="mt-1 text-lg font-bold">{tr("You completed {title}", { title: flagship.bundle.meta.title })}</p>
                      ) : rec?.type === "review" ? (
                        <>
                          <p className="mt-1 text-lg font-bold">{tr("Review and retry")}</p>
                          <p className="mt-0.5 text-sm text-[#5a5680]">{L(rec.reason)}</p>
                        </>
                      ) : null}
                    </div>
                    <CountRing value={flagship.completion.mastered.length} max={flagship.bundle.requiredSkillIds.length} size={52} label={tr("{n} of {m} skills mastered", { n: flagship.completion.mastered.length, m: flagship.bundle.requiredSkillIds.length })} className="[&_circle:first-child]:stroke-[#e4e0ff] [&_span]:text-[#17152e]" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {rec?.type === "activity" && recActivity && (
                      <LinkButton href={`/paths/${FLAGSHIP_ID}/practice/${recActivity.id}`} variant="primary">
                        {rec.locked && <Lock size={15} aria-hidden />} {isNew ? tr("Start practising") : tr("Start activity")} <ArrowRight size={15} aria-hidden />
                      </LinkButton>
                    )}
                    {rec?.type === "review" && <LinkButton href={`/paths/${FLAGSHIP_ID}/skills`} variant="primary">{tr("See skill progress")}</LinkButton>}
                    <LinkButton href={`/paths/${FLAGSHIP_ID}`} variant="ghost" className="!text-[#4f46e5] hover:!bg-[#eeedff]">{tr("Path overview")}</LinkButton>
                  </div>
                </section>
              )}
            </div>
          </div>
        </Handles>
      </Frame>

      {reopened.length > 0 && flagship && (
        <Frame name={tr("Frame · Reopened")} className="mt-10">
          <section aria-label={tr("Skills to revisit")} className="rounded-[22px] border-[1.5px] border-sk-coral/50 bg-bad-bg p-5">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-fg">{tr("Worth another go")}</h2>
            <p className="mt-1 text-sm text-muted">{tr("Your latest attempt missed a criterion. Each comes back in a different context.")}</p>
            <ul className="mt-4 flex flex-wrap gap-3">
              {reopened.map(({ skill, index }) => (
                <li key={skill.id}>
                  <Link href={`/paths/${FLAGSHIP_ID}/skills`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 pe-4 hover:border-sk-coral">
                    <SkillRing index={index} progress={flagship.progress[skill.id]} size={44} />
                    <span className="text-sm font-semibold text-fg">{skill.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </Frame>
      )}

      {/* Library */}
      <section aria-labelledby="library" className="mt-14">
        <SectionHeading id="library" title={tr("Learning library")} eyebrow={tr("{n} paths", { n: library.length })} />
        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="relative flex-1">
            <label htmlFor="search" className="sr-only">{tr("Search paths and skills")}</label>
            <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-subtle" aria-hidden />
            <input id="search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tr("Search paths, skills or outcomes")} className={`${inputClass} ps-9`} />
          </div>
          <div className="grid grid-cols-3 gap-2 lg:flex">
            <FilterSelect id="f-topic" label={tr("Topic")} value={topic} onChange={setTopic} options={[["all", tr("All topics")], ...topics.map((x) => [x, x] as [string, string])]} />
            <FilterSelect id="f-progress" label={tr("Progress")} value={progress} onChange={(v) => setProgress(v as typeof progress)} options={[["all", tr("Any progress")], ["not-started", tr("Not started")], ["in-progress", tr("In progress")], ["completed", tr("Completed")]]} />
            <FilterSelect id="f-access" label={tr("Access")} value={access} onChange={(v) => setAccess(v as typeof access)} options={[["all", tr("All paths")], ["free", tr("Has free samples")]]} />
          </div>
        </div>
        <p className="mt-3 text-sm text-subtle" aria-live="polite">
          {filtersActive ? tr("{n} of {m} paths match", { n: filtered.length, m: library.length }) : tr("Free samples are marked on each path. Everything else is included with one subscription.")}
        </p>

        {filtered.length === 0 ? (
          <div className="mt-6">
            <EmptyState title={tr("No paths match these filters")} icon={<SearchX size={28} />} action={<Button variant="primary" onClick={resetFilters}>{tr("Reset search and filters")}</Button>}>
              {q ? <>{tr("Nothing matches “{query}”.", { query })} </> : null}{tr("Try a broader search, or clear the filters to see all {n} paths.", { n: library.length })}
            </EmptyState>
          </div>
        ) : (
          <ul className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((v) => (
              <li key={v.bundle.meta.id} className="flex">
                <div className="flex w-full">
                  <PathCard view={v} learner={learner} recommended={v.bundle.meta.id === FLAGSHIP_ID && isNew} />
                </div>
              </li>
            ))}
          </ul>
        )}
        {library.some((v) => v.bundle.meta.availability === "preview") && (
          <p className="mt-6 flex items-center gap-2 text-xs text-subtle">
            <Badge tone="warn">{tr("Preview")}</Badge> {tr("Paths marked Preview have an overview and one free sample activity in this prototype. Their full content is not included.")}
          </p>
        )}
      </section>
    </div>
  );
}

function FilterSelect({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block text-xs text-subtle">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} lg:w-44`}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}
