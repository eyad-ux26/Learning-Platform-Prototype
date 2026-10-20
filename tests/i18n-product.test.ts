import { describe, expect, it } from "vitest";
import { FLAGSHIP_ID } from "@/content/flagship";
import { createInitialState } from "@/persistence/state";
import { getPathView } from "@/state/AppState";
import { localizeDeep } from "@/i18n/core";
import "@/i18n/ar";
import "@/i18n/eg";
import "@/i18n/gulf";

function view(language: "en" | "ar" | "ar-EG") {
  const state = createInitialState();
  const learner = state.learners[state.activeLearnerId];
  return getPathView(state, { ...learner, preferences: { ...learner.preferences, language } }, FLAGSHIP_ID, undefined, true)!;
}

describe("product screens under the Egyptian variant", () => {
  it("keep standard Arabic while the surrounding content is Egyptian", () => {
    const eg = view("ar-EG");
    const raw = eg.rawBundle;
    for (const [i, a] of eg.bundle.activities.entries()) {
      const r = raw.activities[i];
      if (a.template === "design-bench" && r.template === "design-bench") expect(a.preview).toEqual(localizeDeep(r.preview, "ar"));
      if (a.template === "critique" && r.template === "critique") expect(a.screen).toEqual(localizeDeep(r.screen, "ar"));
    }
    // The interface content around the screens is the Egyptian layer, which differs from the base somewhere.
    expect(eg.bundle.activities.map((a) => a.scenario)).not.toEqual(view("ar").bundle.activities.map((a) => a.scenario));
  });
});

describe("technical terms", () => {
  it("stay in English inside Arabic sentences", () => {
    const text = JSON.stringify(view("ar").bundle) + JSON.stringify(view("ar-EG").bundle);
    expect(text).not.toContain("قائد المنتج");
    expect(text).toMatch(/Product Managers?/);
  });
});
