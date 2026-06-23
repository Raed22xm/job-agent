import { describe, expect, it } from "vitest";
import {
  linesToList,
  listToLines,
  paragraphsToText,
  textToParagraphs,
} from "@/lib/cv/editHelpers";

describe("editHelpers", () => {
  it("converts lines to list and back", () => {
    expect(linesToList("React\n- TypeScript\n")).toEqual(["React", "TypeScript"]);
    expect(listToLines(["React", "Git"])).toBe("React\nGit");
  });

  it("converts paragraphs to text and back", () => {
    const paragraphs = ["First paragraph.", "Second paragraph."];
    const text = paragraphsToText(paragraphs);
    expect(textToParagraphs(text)).toEqual(paragraphs);
  });
});
