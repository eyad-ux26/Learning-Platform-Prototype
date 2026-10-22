import { describe, expect, it } from "vitest";
import { applyAffects, changesLayout } from "@/domain/preview";

const blocks = ["bar", "photo", "news", "title", "date", "reserve", "cancel"].map((hotspot) => ({ hotspot }));
const ids = (xs: { hotspot?: string }[]) => xs.map((x) => x.hotspot);

describe("decision preview", () => {
  it("places blocks at the top, after the fixed lead, in order", () => {
    const out = applyAffects(blocks, [{ hotspot: "date", tag: "1st", place: 1 }, { hotspot: "title", tag: "2nd", place: 2 }], 1);
    expect(ids(out)).toEqual(["bar", "date", "title", "photo", "news", "reserve", "cancel"]);
  });
  it("hides, moves to the end and moves before another block", () => {
    const out = applyAffects(blocks, [
      { hotspot: "photo", tag: "Hidden", hide: true },
      { hotspot: "news", tag: "Last", toEnd: true },
      { hotspot: "cancel", tag: "Before Reserve", before: "reserve" },
    ]);
    expect(ids(out)).toEqual(["bar", "title", "date", "cancel", "reserve", "news"]);
  });
  it("leaves the screen alone for options that only point at parts", () => {
    expect(applyAffects(blocks, [{ hotspot: "date", tag: "Wrong date" }])).toEqual(blocks);
    expect(changesLayout([{ hotspot: "date", tag: "Wrong date" }])).toBe(false);
    expect(changesLayout([{ hotspot: "date", tag: "Hidden", hide: true }])).toBe(true);
  });
});
