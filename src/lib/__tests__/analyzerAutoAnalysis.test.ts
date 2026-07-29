import { describe, expect, it } from "vitest";
import { shouldAutoAnalyzeJob } from "@/lib/analyzerAutoAnalysis";
import type { ParsedJob } from "@/types";

function parsedJobWithRawText(rawText: string): ParsedJob {
  return {
    title: "Product Engineer",
    company: "Northstar Labs",
    location: "Copenhagen",
    responsibilities: [],
    requirements: [],
    tools: [],
    skills: [],
    atsKeywords: [],
    rawText,
  };
}

describe("shouldAutoAnalyzeJob", () => {
  it("does not analyze empty text", () => {
    expect(shouldAutoAnalyzeJob("   \n ", null)).toBe(false);
  });

  it("does not re-analyze the parsed description after trimming", () => {
    const parsedJob = parsedJobWithRawText(" Build accessible products. ");

    expect(
      shouldAutoAnalyzeJob("\nBuild accessible products.\t", parsedJob)
    ).toBe(false);
  });

  it("analyzes when the description differs from the parsed job", () => {
    const parsedJob = parsedJobWithRawText("Build accessible products.");

    expect(
      shouldAutoAnalyzeJob("Build accessible products with React.", parsedJob)
    ).toBe(true);
  });

  it("analyzes non-empty text when no parsed job exists", () => {
    expect(shouldAutoAnalyzeJob("Build accessible products.", null)).toBe(true);
  });
});
