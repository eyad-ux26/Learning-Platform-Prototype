import Link from "next/link";
import { Eye } from "lucide-react";

export function PreviewBar({ pathId, version, isDraft }: { pathId: string; version: number; isDraft: boolean }) {
  return (
    <div className="sticky top-0 z-40 -mx-4 -mt-6 mb-2 border-b border-ai/30 bg-ai-bg px-4 py-2 sm:-mx-8 sm:-mt-8 sm:px-8">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Eye size={15} className="text-ai" aria-hidden />
        <span className="text-fg">
          Learner preview of {isDraft ? `the saved draft (would become v${version})` : `published v${version}`}. Nothing here records evidence or is visible to learners.
        </span>
        <Link href={`/admin/paths/${pathId}`} className="ms-auto text-sm font-medium text-ai hover:underline">Back to editor</Link>
      </div>
    </div>
  );
}
