import { describe, expect, it } from "vitest";
import { fallbackVocabulary, normalizeWords, scoreDictation } from "@/lib/english";

describe("English practice helpers", () => {
  it("normalizes punctuation, casing, and apostrophes", () => {
    expect(normalizeWords("We’re READY, today!")).toEqual(["we're", "ready", "today"]);
  });

  it("scores an exact dictation answer", () => {
    const result = scoreDictation(
      "She is presenting the quarterly results to her colleagues.",
      "She is presenting the quarterly results to her colleagues.",
    );
    expect(result.score).toBe(100);
    expect(result.extras).toHaveLength(0);
  });

  it("reports missing and extra dictation words", () => {
    const result = scoreDictation("She presents results today", "She presents the results");
    expect(result.score).toBe(75);
    expect(result.expected.some((word) => word.status === "missing")).toBe(true);
    expect(result.extras).toEqual([{ word: "today", status: "extra" }]);
  });

  it("prioritizes vocabulary related to the pasted office text", () => {
    const items = fallbackVocabulary("Please send a project update before the deadline.", 3);
    expect(items.map((item) => item.phrase)).toContain("meet a deadline");
    expect(items).toHaveLength(3);
  });
});
