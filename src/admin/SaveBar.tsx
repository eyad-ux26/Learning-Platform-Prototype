import { AlertTriangle, Eye, Save } from "lucide-react";
import { Button, LinkButton } from "@/components/ui";

export function SaveBar({ dirty, onSave, onRevert, previewHref }: { dirty: boolean; onSave: () => void; onRevert: () => void; previewHref?: string }) {
  return (
    <div className="sticky top-0 z-30 -mx-4 mb-5 flex flex-wrap items-center gap-2 border-b border-line bg-canvas/95 px-4 py-2.5 sm:-mx-8 sm:px-8" role="region" aria-label="Draft actions">
      {dirty ? (
        <span className="inline-flex items-center gap-1.5 text-sm text-warn"><AlertTriangle size={14} aria-hidden /> Unsaved changes</span>
      ) : (
        <span className="text-sm text-subtle">All changes saved to draft · learners see only published versions</span>
      )}
      <div className="ms-auto flex gap-2">
        {dirty && <Button size="sm" variant="ghost" onClick={onRevert}>Undo unsaved edits</Button>}
        {previewHref && <LinkButton href={previewHref} size="sm" variant="ghost"><Eye size={14} aria-hidden /> Preview saved draft</LinkButton>}
        <Button size="sm" variant="primary" disabled={!dirty} onClick={onSave}><Save size={14} aria-hidden /> Save draft</Button>
      </div>
    </div>
  );
}
