import { describe, expect, it } from "vitest";
import { dialectOf, hasArabic, htmlLang, localeFor, translate } from "@/i18n/core";
import "@/i18n/ar";
import "@/i18n/eg";
import "@/i18n/gulf";
import egDomain from "@/i18n/eg/domain";
import egLibrary from "@/i18n/eg/library";
import egUi1 from "@/i18n/eg/ui-1";
import egUi2 from "@/i18n/eg/ui-2";
import egC1 from "@/i18n/eg/content-1";
import egC5 from "@/i18n/eg/content-5";
import gulfDomain from "@/i18n/gulf/domain";
import gulfLibrary from "@/i18n/gulf/library";
import gulfUi1 from "@/i18n/gulf/ui-1";
import gulfUi2 from "@/i18n/gulf/ui-2";
import gulfC1 from "@/i18n/gulf/content-1";
import gulfC5 from "@/i18n/gulf/content-5";

describe("language and dialect selection", () => {
  it("maps a language and a dialect choice to one locale and back", () => {
    expect(localeFor("en", "ar-EG")).toBe("en");
    expect(localeFor("ar", "msa")).toBe("ar");
    expect(localeFor("ar", "ar-EG")).toBe("ar-EG");
    expect(localeFor("ar", "ar-GULF")).toBe("ar-GULF");
    expect(dialectOf("ar-GULF")).toBe("ar-GULF");
    expect(dialectOf("ar")).toBe("msa");
    expect(htmlLang("ar-GULF")).toBe("ar-AE");
  });
});

describe("dialect layers", () => {
  it("each dialect overrides the base and falls back to it", () => {
    expect(translate("ar", "Today")).toBe("اليوم");
    expect(translate("ar-EG", "Today")).toBe("النهارده");
    expect(translate("ar-GULF", "Daily goal")).toBe("هدف اليوم");
    // A key no dialect overrides still resolves through the base.
    expect(translate("ar-GULF", "Account")).toBe(translate("ar", "Account"));
    expect(translate("ar-EG", "A string nobody translated")).toBe("A string nobody translated");
  });

  it("dialect dictionaries only contain keys that exist in the base and keep their placeholders", () => {
    const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
    const layers = { egDomain, egLibrary, egUi1, egUi2, egC1, egC5, gulfDomain, gulfLibrary, gulfUi1, gulfUi2, gulfC1, gulfC5 };
    for (const [name, dict] of Object.entries(layers)) {
      for (const [k, v] of Object.entries(dict)) {
        expect(hasArabic(k), `${name}: stray key ${k.slice(0, 60)}`).toBe(true);
        expect(ph(v), `${name}: placeholders of ${k.slice(0, 60)}`).toBe(ph(k));
      }
    }
  });

  it("the Egyptian layer reads as Egyptian and the Gulf layer as Gulf", () => {
    const text = (d: Record<string, string>) => Object.values(d).join(" ");
    const eg = text(egUi1) + text(egUi2);
    const gulf = text(gulfUi1) + text(gulfUi2);
    expect(eg).toMatch(/إزاي|دلوقتي|مش |عشان/);
    expect(gulf).toMatch(/شلون|الحين|وش |ليش|تبي/);
    expect(gulf).not.toMatch(/إزاي|دلوقتي/);
    expect(eg).not.toMatch(/شلون|الحين|ليش/);
  });
});
