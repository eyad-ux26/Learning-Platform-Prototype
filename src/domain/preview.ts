import type { Affect } from "./types";

/**
 * Decision previews: what a screen looks like after an option. Pure and deterministic, so the preview
 * (Decision stage) and tests agree on the result.
 */

/** Applies an option's layout changes (hide, move to the end, move before, place at the top) to a list of blocks or list items. */
export function applyAffects<T extends { hotspot?: string }>(items: T[], affects: Affect[], lead = 0): T[] {
  const by = new Map(affects.map((a) => [a.hotspot, a]));
  let out = items.filter((it) => !(it.hotspot && by.get(it.hotspot)?.hide));
  const take = (pred: (a: Affect) => boolean | undefined) => {
    const moved = out.filter((it) => it.hotspot && pred(by.get(it.hotspot) ?? ({} as Affect)));
    out = out.filter((it) => !moved.includes(it));
    return moved;
  };
  const last = take((a) => a.toEnd);
  out.push(...last);
  for (const it of take((a) => !!a.before && a.place === undefined)) {
    const at = out.findIndex((x) => x.hotspot === by.get(it.hotspot!)!.before);
    out.splice(at < 0 ? out.length : at, 0, it);
  }
  const placed = take((a) => a.place !== undefined).sort((a, b) => by.get(a.hotspot!)!.place! - by.get(b.hotspot!)!.place!);
  out.splice(Math.min(lead, out.length), 0, ...placed);
  return out;
}

/** Whether an option changes the layout of the screen (rather than only pointing at parts of it). */
export const changesLayout = (affects: Affect[] = []) => affects.some((a) => a.hide || a.toEnd || a.before || a.place !== undefined);
