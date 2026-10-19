import { describe, expect, it } from "vitest";
import { flagshipBundle } from "@/content/flagship";
import { libraryBundles } from "@/content/library";
import { MACHINE_KEYS, localizeDeep } from "@/i18n/core";
import "@/i18n/ar";
import "@/i18n/eg";

function machineValues(v: unknown, out: unknown[] = []): unknown[] {
  if (Array.isArray(v)) v.forEach((x) => machineValues(x, out));
  else if (v && typeof v === "object")
    for (const [k, x] of Object.entries(v)) {
      if (MACHINE_KEYS.has(k)) out.push(x);
      else machineValues(x, out);
    }
  return out;
}

describe("machine values survive localisation", () => {
  it("never changes ids, verdicts or other logic fields", () => {
    for (const b of [flagshipBundle, ...libraryBundles]) {
      for (const locale of ["ar", "ar-EG"] as const) {
        expect(machineValues(localizeDeep(b, locale))).toEqual(machineValues(b));
      }
    }
  });

  it("keeps critique verdicts and reason groups usable", () => {
    const critique = flagshipBundle.activities.find((a) => a.template === "critique");
    if (critique?.template !== "critique") throw new Error("no critique activity");
    const ar = localizeDeep(critique, "ar");
    expect(ar.reasons.map((r) => r.appliesTo)).toEqual(critique.reasons.map((r) => r.appliesTo));
    expect(ar.hotspots.map((h) => h.verdict)).toEqual(critique.hotspots.map((h) => h.verdict));
  });
});
