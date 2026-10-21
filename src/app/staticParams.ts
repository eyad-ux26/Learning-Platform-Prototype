/**
 * Pages pre-rendered for static hosting (GitHub Pages). Anything created later in the
 * admin (new drafts, imports) is rendered client-side by the fallback in app/not-found.tsx.
 */
import { flagshipBundle } from "@/content/flagship";
import { libraryBundles } from "@/content/library";
import { authoredBundles } from "@/content/paths";

const bundles = [flagshipBundle, ...libraryBundles, ...authoredBundles];

export const pathParams = () => bundles.map((b) => ({ pathId: b.meta.id }));
export const activityParams = () => bundles.flatMap((b) => b.activities.map((a) => ({ pathId: b.meta.id, activityId: a.id })));
export const conceptParams = () => bundles.flatMap((b) => b.explore.map((c) => ({ pathId: b.meta.id, conceptId: c.id })));
export const flagshipActivityParams = () => flagshipBundle.activities.map((a) => ({ activityId: a.id }));
