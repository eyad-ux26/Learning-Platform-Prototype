import { FileQuestion } from "lucide-react";
import { EmptyState, LinkButton } from "@/components/ui";

export function Unavailable({ title, detail, backHref = "/" }: { title: string; detail?: string; backHref?: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <EmptyState title={title} icon={<FileQuestion size={28} />} action={<LinkButton href={backHref}>Go back</LinkButton>}>
        {detail}
      </EmptyState>
    </div>
  );
}
