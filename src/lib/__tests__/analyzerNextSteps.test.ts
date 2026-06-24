import { describe, expect, it } from "vitest";
import { buildAnalyzerNextSteps } from "@/lib/analyzerNextSteps";

describe("buildAnalyzerNextSteps", () => {
  it("returns a strong-fit message for high scores", () => {
    const result = buildAnalyzerNextSteps(86, ["Kubernetes", "AWS"]);

    expect(result[0]?.title).toContain("Strong fit");
    expect(result[0]?.description).toContain("tailor");
    expect(result[1]?.description).toContain("Kubernetes");
  });

  it("returns a cautionary message for low scores", () => {
    const result = buildAnalyzerNextSteps(42, ["React", "TypeScript"]);

    expect(result[0]?.title).toContain("Partial fit");
    expect(result[0]?.description).toContain("transferable");
  });
});
