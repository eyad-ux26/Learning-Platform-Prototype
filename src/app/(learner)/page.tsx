"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Lock, PlayCircle, Search, SearchX } from "lucide-react";
import { FLAGSHIP_ID } from "@/content/flagship";
import { recommendNext } from "@/domain/recommend";
import { t } from "@/i18n/en";
import { useApp, visibleLibrary } from "@/state/AppState";
import { Badge, Button, Card, EmptyState, LinkButton, SectionHeading, inputClass } from "@/components/ui";
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
      <section aria-labelledby="welcome" className="max-w-3xl">
        <p className="text-sm text-subtle">{isNew ? `Welcome, ${firstName}` : `Welcome back, ${firstName}`}</p>
        <h1 id="welcome" className="mt-1 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">Build design skills by making real decisions.</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Each path lists the skills you need to demonstrate. Explore short explanations when you want them, or go straight to practice. A path is complete when you have shown every skill in practice, not when you have watched everything.
        </p>
      </section>

      {/* Continue + recommended */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {resume && (
          <Card className="p-5" as="section" aria-labelledby="continue">
            <p id="continue" className="text-xs font-semibold uppercase tracking-wide text-subtle">Continue learning</p>
            <p className="mt-2 text-lg font-semibold text-fg">{resume.label}</p>
            <p className="mt-1 text-sm text-muted">Unfinished response saved {new Date(resume.at).toLocaleString()}.</p>
            <LinkButton href={resume.href} variant="primary" className="mt-4">
              <PlayCircle size={16} aria-hidden /> Resume activity
            </LinkButton>
          </Card>
        )}
        {flagship && (
          <Card className="p-5" as="section" aria-labelledby="recommended">
            <p id="recommended" className="text-xs font-semibold uppercase tracking-wide text-subtle">Recommended next</p>
            {rec?.type === "activity" && recActivity ? (
              <>
                <p className="mt-2 text-lg font-semibold text-fg">{recActivity.title}</p>
                <p className="mt-1 text-sm text-muted">
                  {flagship.bundle.meta.title} · {isNew ? "A good first activity. It is a free sample and assesses all four skills." : rec.reason}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <LinkButton href={`/paths/${FLAGSHIP_ID}/practice/${recActivity.id}`} variant={resume ? "secondary" : "primary"}>
                    {rec.locked && <Lock size={15} aria-hidden />} {isNew ? "Start practising" : "Start activity"} <ArrowRight size={15} aria-hidden />
                  </LinkButton>
                  <LinkButton href={`/paths/${FLAGSHIP_ID}`} variant="ghost">Path overview</LinkButton>
                </div>
              </>
            ) : rec?.type === "complete" ? (
              <>
                <p className="mt-2 text-lg font-semibold text-fg">You completed {flagship.bundle.meta.title}</p>
                <p className="mt-1 text-sm text-muted">Every required skill is Mastered. The other paths are previews in this prototype.</p>
              </>
            ) : rec?.type === "review" ? (
              <>
                <p className="mt-2 text-lg font-semibold text-fg">Review and retry</p>
                <p className="mt-1 text-sm text-muted">{rec.reason}</p>
                <LinkButton href={`/paths/${FLAGSHIP_ID}/skills`} className="mt-4">See skill progress</LinkButton>
              </>
            ) : null}
          </Card>
        )}
      </div>

      {/* Library */}
      <section aria-labelledby="library" className="mt-12">
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
