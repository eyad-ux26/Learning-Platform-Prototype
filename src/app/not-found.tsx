"use client";

import { useSyncExternalStore } from "react";
import { FileQuestion } from "lucide-react";
import { useI18n } from "@/i18n";
import { AdminShell } from "@/admin/AdminShell";
import { LearnerShell } from "@/learner/LearnerShell";
import { EmptyState, LinkButton, Spinner } from "@/components/ui";
import { PathPage } from "./(learner)/paths/[pathId]/View";
import { ExploreIndex } from "./(learner)/paths/[pathId]/explore/View";
import { ExplorePage } from "./(learner)/paths/[pathId]/explore/[conceptId]/View";
import { PracticePage } from "./(learner)/paths/[pathId]/practice/[activityId]/View";
import { SkillsPage } from "./(learner)/paths/[pathId]/skills/View";
import { CertificatePage } from "./(learner)/paths/[pathId]/certificate/View";
import { ActivityEditorPage } from "./admin/content/[activityId]/View";
import { PathEditorPage } from "./admin/paths/[pathId]/View";
import { PreviewOverview } from "./admin/preview/[pathId]/View";
import { PreviewExplore } from "./admin/preview/[pathId]/explore/[conceptId]/View";
import { PreviewPractice } from "./admin/preview/[pathId]/practice/[activityId]/View";

/**
 * Static hosting serves this page for any URL that wasn't pre-rendered. Paths created in
 * the prototype (new drafts, imports) only exist in the browser, so their pages are
 * rendered here on the client from the URL.
 */
type Params = Record<string, string>;
const ROUTES: { re: RegExp; keys: string[]; shell: "learner" | "admin"; View: (p: { params?: Params }) => React.ReactNode }[] = [
  { re: /^\/paths\/([^/]+)$/, keys: ["pathId"], shell: "learner", View: PathPage },
  { re: /^\/paths\/([^/]+)\/explore$/, keys: ["pathId"], shell: "learner", View: ExploreIndex },
  { re: /^\/paths\/([^/]+)\/explore\/([^/]+)$/, keys: ["pathId", "conceptId"], shell: "learner", View: ExplorePage },
  { re: /^\/paths\/([^/]+)\/practice\/([^/]+)$/, keys: ["pathId", "activityId"], shell: "learner", View: PracticePage },
  { re: /^\/paths\/([^/]+)\/skills$/, keys: ["pathId"], shell: "learner", View: SkillsPage },
  { re: /^\/paths\/([^/]+)\/certificate$/, keys: ["pathId"], shell: "learner", View: CertificatePage },
  { re: /^\/admin\/content\/([^/]+)$/, keys: ["activityId"], shell: "admin", View: ActivityEditorPage },
  { re: /^\/admin\/paths\/([^/]+)$/, keys: ["pathId"], shell: "admin", View: PathEditorPage },
  { re: /^\/admin\/preview\/([^/]+)$/, keys: ["pathId"], shell: "admin", View: PreviewOverview },
  { re: /^\/admin\/preview\/([^/]+)\/explore\/([^/]+)$/, keys: ["pathId", "conceptId"], shell: "admin", View: PreviewExplore },
  { re: /^\/admin\/preview\/([^/]+)\/practice\/([^/]+)$/, keys: ["pathId", "activityId"], shell: "admin", View: PreviewPractice },
];

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const subscribe = () => () => {};

export default function NotFound() {
  const { tr } = useI18n();
  const pathname = useSyncExternalStore(subscribe, () => window.location.pathname, () => null);
  if (pathname === null) return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>;

  const local = (pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname).replace(/\/+$/, "") || "/";
  for (const r of ROUTES) {
    const m = local.match(r.re);
    if (!m) continue;
    const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    const page = <r.View params={params} />;
    return r.shell === "admin" ? <AdminShell>{page}</AdminShell> : <LearnerShell>{page}</LearnerShell>;
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-20">
      <EmptyState title={tr("Page not found")} icon={<FileQuestion size={28} />} action={<LinkButton href="/" variant="primary">{tr("Go to Home")}</LinkButton>}>
        {tr("This address doesn’t exist in the prototype.")}
      </EmptyState>
    </div>
  );
}
