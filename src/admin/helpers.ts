import { clone, hasUnpublishedChanges, latestPublished } from "@/domain/catalog";
import { CONTENT_FORMAT_VERSION, type CatalogEntry, type PathBundle } from "@/domain/types";

export function workingCopy(entry: CatalogEntry): PathBundle {
  return entry.draft ?? clone(latestPublished(entry)!.bundle);
}

export function statusLabel(entry: CatalogEntry): { label: string; tone: "ok" | "warn" | "neutral" | "bad" | "ai" } {
  if (entry.status === "archived") return { label: "Archived", tone: "neutral" };
  if (entry.status === "unpublished") return { label: "Unpublished", tone: "warn" };
  if (entry.status === "draft" || entry.versions.length === 0) return { label: "Draft · never published", tone: "ai" };
  if (hasUnpublishedChanges(entry)) return { label: "Published · draft changes", tone: "ai" };
  return { label: "Published", tone: "ok" };
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

export function newPathBundle(id: string, title: string): PathBundle {
  return {
    formatVersion: CONTENT_FORMAT_VERSION,
    meta: {
      id,
      title,
      summary: "",
      topic: "Foundations",
      level: "Introductory",
      estimatedHours: 1,
      icon: "book",
      cover: "waves",
      outcomes: [],
      audience: "",
      prerequisites: "",
      availability: "preview",
      freeSampleActivityIds: [],
      plannedModules: [],
    },
    skills: [],
    requiredSkillIds: [],
    explore: [],
    activities: [],
  };
}
