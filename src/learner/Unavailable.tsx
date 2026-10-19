"use client";

import { FileQuestion } from "lucide-react";
import { useI18n } from "@/i18n";
import { EmptyState, LinkButton } from "@/components/ui";

export function Unavailable({ title, detail, backHref = "/" }: { title: string; detail?: string; backHref?: string }) {
  const { tr } = useI18n();
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <EmptyState title={tr(title)} icon={<FileQuestion size={28} />} action={<LinkButton href={backHref}>{tr("Go back")}</LinkButton>}>
        {detail ? tr(detail) : detail}
      </EmptyState>
    </div>
  );
}
