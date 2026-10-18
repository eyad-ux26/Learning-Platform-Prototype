/**
 * Draft / published separation and the PROVISIONAL versioning policy:
 * - Learners only ever see published versions. Drafts are invisible to them.
 * - Publishing creates a new immutable version; older versions are kept.
 * - Each enrollment is pinned to the version it started on. Attempts record
 *   the version they were assessed against and are never re-evaluated.
 * - New enrollments use the latest published version.
 */
import { validateBundle, type ValidationReport } from "./validation";
import type { CatalogEntry, Enrollment, PathBundle, PublishedVersion } from "./types";

export const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export function latestPublished(entry: CatalogEntry): PublishedVersion | undefined {
  return entry.versions[entry.versions.length - 1];
}

export function isLearnerVisible(entry: CatalogEntry): boolean {
  return entry.status === "published" && entry.versions.length > 0;
}

export function versionFor(entry: CatalogEntry, enrollment?: Enrollment): PublishedVersion | undefined {
  if (enrollment) {
    const pinned = entry.versions.find((v) => v.version === enrollment.contentVersion);
    if (pinned) return pinned;
  }
  return latestPublished(entry);
}

export function ensureDraft(entry: CatalogEntry, now: string): CatalogEntry {
  if (entry.draft) return entry;
  const base = latestPublished(entry);
  if (!base) return entry;
  return { ...entry, draft: clone(base.bundle), draftUpdatedAt: now };
}

export function saveDraft(entry: CatalogEntry, bundle: PathBundle, now: string): CatalogEntry {
  return { ...entry, draft: clone(bundle), draftUpdatedAt: now };
}

export function hasUnpublishedChanges(entry: CatalogEntry): boolean {
  if (!entry.draft) return false;
  const base = latestPublished(entry);
  return !base || JSON.stringify(base.bundle) !== JSON.stringify(entry.draft);
}

export function publishDraft(
  entry: CatalogEntry,
  by: string,
  note: string,
  now: string,
): { entry: CatalogEntry; report: ValidationReport; published: boolean } {
  const source = entry.draft ?? latestPublished(entry)?.bundle;
  if (!source) return { entry, report: { ok: false, issues: [{ level: "error", path: "$", message: "Nothing to publish." }], coverage: [] }, published: false };
  const report = validateBundle(source);
  if (!report.ok) return { entry, report, published: false };
  const changed = hasUnpublishedChanges(entry) || entry.versions.length === 0;
  const versions = changed
    ? [...entry.versions, { version: (latestPublished(entry)?.version ?? 0) + 1, publishedAt: now, publishedBy: by, note: note || "No change note", bundle: clone(source) }]
    : entry.versions;
  return { entry: { ...entry, status: "published", versions, draft: undefined, draftUpdatedAt: undefined }, report, published: true };
}
