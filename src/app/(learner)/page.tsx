"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Lock, PlayCircle, Search, SearchX } from "lucide-react";
import { FLAGSHIP_ID } from "@/content/flagship";
import { recommendNext } from "@/domain/recommend";
import { t } from "@/i18n/en";
import { useApp, visibleLibrary } from "@/state/AppState";
import { Badge, Button, EmptyState, Frame, Handles, LinkButton, SectionHeading, inputClass } from "@/components/ui";
import { CountRing } from "@/components/SkillRing";
import { PathCard, pathProgressState, type ProgressState } from "@/learner/PathCard";

export default function HomePage() {
  const { state, learner } = useApp();
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
  const isNew = learner.attempts.length === 0 && Object.keys(learner.viewedConcepts).length === 0;
  const firstName = learner.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Frame name="Frame · Today" className="mt-6">
        <Handles className="rounded-[28px] bg-brand p-6 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-center">
            <section aria-labelledby="welcome">
              <p className="font-mono text-xs font-semibold text-[#d4cfff]">{isNew ? `Welcome, ${firstName}` : `Welcome back, ${firstName}`}</p>
              <h1 id="welcome" className="mt-3 text-4xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-5xl lg:text-6xl">Learn by making real design calls.</h1>
              <p className="mt-4 max-w-md text-base text-[#e4e0ff]">A path is done when you have shown every skill, not when you have watched everything.</p>
            </section>
            <div className="flex flex-col gap-4">
              {resume && (
                <section aria-labelledby="continue" className="rounded-[22px] bg-white p-5 text-[#17152e]">
                  <p id="continue" className="font-mono text-xs font-semibold text-[#5a5680]">Continue</p>
                  <p className="mt-1 text-lg font-bold">{resume.label}</p>
                  <p className="mt-0.5 text-sm text-[#5a5680]">Unfinished response saved {new Date(resume.at).toLocaleString()}.</p>
                  <LinkButton href={resume.href} variant="primary" className="mt-3"><PlayCircle size={16} aria-hidden /> Resume activity</LinkButton>
                </section>
              )}
              {flagship && (
                <section aria-labelledby="recommended" className="rounded-[22px] bg-white p-5 text-[#17152e]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p id="recommended" className="font-mono text-xs font-semibold text-[#5a5680]">Recommended next</p>
                      {rec?.type === "activity" && recActivity ? (
                        <>
                          <p className="mt-1 text-lg font-bold leading-snug">{recActivity.title}</p>
                          <p className="mt-0.5 text-sm text-[#5a5680]">{flagship.bundle.meta.title} · {isNew ? "Free sample · covers all four skills" : rec.reason}</p>
                        </>
                      ) : rec?.type === "complete" ? (
                        <p className="mt-1 text-lg font-bold">You completed {flagship.bundle.meta.title}</p>
                      ) : rec?.type === "review" ? (
                        <>
                          <p className="mt-1 text-lg font-bold">Review and retry</p>
                          <p className="mt-0.5 text-sm text-[#5a5680]">{rec.reason}</p>
                        </>
                      ) : null}
                    </div>
                    <CountRing value={flagship.completion.mastered.length} max={flagship.bundle.requiredSkillIds.length} size={52} label={`${flagship.completion.mastered.length} of ${flagship.bundle.requiredSkillIds.length} skills mastered`} className="[&_circle:first-child]:stroke-[#e4e0ff] [&_span]:text-[#17152e]" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {rec?.type === "activity" && recActivity && (
                      <LinkButton href={`/paths/${FLAGSHIP_ID}/practice/${recActivity.id}`} variant="primary">
                        {rec.locked && <Lock size={15} aria-hidden />} {isNew ? "Start practising" : "Start activity"} <ArrowRight size={15} aria-hidden />
                      </LinkButton>
                    )}
                    {rec?.type === "review" && <LinkButton href={`/paths/${FLAGSHIP_ID}/skills`} variant="primary">See skill progress</LinkButton>}
                    <LinkButton href={`/paths/${FLAGSHIP_ID}`} variant="ghost" className="!text-[#4f46e5] hover:!bg-[#eeedff]">Path overview</LinkButton>
                  </div>
                </section>
              )}
            </div>
          </div>
        </Handles>
      </Frame>

      {/* Library */}
      <section aria-labelledby="library" className="mt-14">
        <SectionHeading id="library" title="Learning library" eyebrow={`${library.length} paths`} />
        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="relative flex-1">
            <label htmlFor="search" className="sr-only">Search paths and skills</label>
            <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-subtle" aria-hidden />
            <input id="search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search paths, skills or outcomes" className={`${inputClass} ps-9`} />
          </div>
          <div className="grid grid-cols-3 gap-2 lg:flex">
            <FilterSelect id="f-topic" label="Topic" value={topic} onChange={setTopic} options={[["all", "All topics"], ...topics.map((x) => [x, x] as [string, string])]} />
            <FilterSelect id="f-progress" label="Progress" value={progress} onChange={(v) => setProgress(v as typeof progress)} options={[["all", "Any progress"], ["not-started", "Not started"], ["in-progress", "In progress"], ["completed", "Completed"]]} />
            <FilterSelect id="f-access" label="Access" value={access} onChange={(v) => setAccess(v as typeof access)} options={[["all", "All paths"], ["free", "Has free samples"]]} />
          </div>
        </div>
        <p className="mt-3 text-sm text-subtle" aria-live="polite">
          {filtersActive ? `${filtered.length} of ${library.length} paths match` : t.access.free + "s are marked on each path. Everything else is included with one subscription."}
        </p>

        {filtered.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="No paths match these filters" icon={<SearchX size={28} />} action={<Button variant="primary" onClick={resetFilters}>Reset search and filters</Button>}>
              {q ? <>Nothing matches “{query}”. </> : null}Try a broader search, or clear the filters to see all {library.length} paths.
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
            <Badge tone="warn">Preview</Badge> Paths marked Preview have an overview and one free sample activity in this prototype. Their full content is not included.
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
