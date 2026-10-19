import { describe, expect, it } from "vitest";
import { flagshipBundle } from "@/content/flagship";
import { libraryBundles } from "@/content/library";
import { hasArabic } from "@/i18n/core";
import "@/i18n/ar";

const ID_KEYS = new Set(["id", "pathId", "skillId", "activityId", "criterionId", "contextKey", "template", "kind", "behaviour", "dimension", "cover", "icon", "iso", "valueIso", "type", "level"]);

function sentences(v: unknown, out = new Set<string>()) {
  if (typeof v === "string") {
    if (/\s/.test(v)) out.add(v);
  } else if (Array.isArray(v)) v.forEach((x) => sentences(x, out));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) if (!ID_KEYS.has(k)) sentences(x, out);
  return out;
}

describe("Arabic content coverage", () => {
  it("has a translation for every authored sentence in the flagship and library paths", () => {
    const all = new Set<string>();
    sentences(flagshipBundle, all);
    libraryBundles.forEach((b) => sentences(b, all));
    const missing = [...all].filter((s) => !hasArabic(s));
    expect(missing, `Untranslated: ${missing.slice(0, 5).join(" | ")}`).toEqual([]);
  });
});
