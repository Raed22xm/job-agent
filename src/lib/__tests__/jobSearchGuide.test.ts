import { describe, expect, it } from "vitest";
import {
  filterGuideResources,
  GUIDE_RESOURCES,
} from "@/lib/jobSearchGuide";

describe("filterGuideResources", () => {
  it("returns all resources when query and category are empty", () => {
    expect(filterGuideResources(GUIDE_RESOURCES, "", "all")).toHaveLength(
      GUIDE_RESOURCES.length
    );
  });

  it("filters by category", () => {
    const results = filterGuideResources(GUIDE_RESOURCES, "", "find-jobs");
    expect(results.every((item) => item.category === "find-jobs")).toBe(true);
    expect(results.some((item) => item.id === "jobindex")).toBe(true);
  });

  it("filters by search query across tags and description", () => {
    const results = filterGuideResources(GUIDE_RESOURCES, "docx", "all");
    expect(results.some((item) => item.id === "ats-cv")).toBe(true);
  });

  it("combines category and search filters", () => {
    const results = filterGuideResources(GUIDE_RESOURCES, "cursor", "agent");
    expect(results.every((item) => item.category === "agent")).toBe(true);
    expect(results.some((item) => item.id === "agent-cursor")).toBe(true);
  });
});
