import { describe, expect, it } from "vitest";
import { localizeDeep, registerArabic, registerEgyptian, translate } from "@/i18n/core";


describe("localisation core", () => {
  it("returns English unchanged and fills placeholders", () => {
    expect(translate("en", "{n} of {m} decisions made", { n: 2, m: 6 })).toBe("2 of 6 decisions made");
    expect(localizeDeep({ a: "Anything" }, "en")).toEqual({ a: "Anything" });
  });

  it("falls back to English for unknown strings", () => {
    registerArabic({});
    expect(translate("ar", "A string nobody translated")).toBe("A string nobody translated");
    expect(localizeDeep({ t: "Unknown sentence here" }, "ar")).toEqual({ t: "Unknown sentence here" });
  });

  it("matches templates, localises captured values, and leaves ids alone", () => {
    registerArabic({ "{a} of {b} done": "{a} من {b} تم", Mastered: "متقنة" });
    expect(localizeDeep("Mastered of Mastered done", "ar")).toBe("متقنة من متقنة تم");
    expect(localizeDeep({ id: "Mastered", label: "Mastered" }, "ar")).toEqual({ id: "Mastered", label: "متقنة" });
  });

  it("translates joined sentences and clauses part by part", () => {
    registerArabic({ "First part.": "الجزء الأول.", "Second part.": "الجزء الثاني.", "Left clause": "الجملة الأولى" });
    expect(localizeDeep("First part. Second part.", "ar")).toBe("الجزء الأول. الجزء الثاني.");
    expect(localizeDeep("Left clause · untouched", "ar")).toBe("الجملة الأولى · untouched");
  });
});


describe("Egyptian layer", () => {
  it("overrides the base entry and falls back to it", () => {
    registerArabic({ Hello: "مرحبًا", Bye: "مع السلامة" });
    registerEgyptian({ Hello: "أهلاً" });
    expect(localizeDeep("Hello", "ar-EG")).toBe("أهلاً");
    expect(localizeDeep("Bye", "ar-EG")).toBe("مع السلامة");
    expect(localizeDeep("Hello", "ar")).toBe("مرحبًا");
    expect(translate("ar-EG", "Hello")).toBe("أهلاً");
  });
});
