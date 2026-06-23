import { describe, expect, it } from "vitest";
import { buildGapSuggestions } from "@/lib/gapSuggestions";
import type { MasterCV } from "@/types";

const TEST_CV: MasterCV = {
  personalInfo: {
    fullName: "Test User",
    email: "test@example.com",
    phone: "+45 00 00 00 00",
    location: "Copenhagen",
    summary: "Junior developer.",
  },
  skills: ["React", "JavaScript", "Power BI", "Figma"],
  tools: ["Git"],
  experience: [
    {
      id: "exp-1",
      company: "Acme",
      title: "Developer Intern",
      location: "Copenhagen",
      startDate: "2024",
      endDate: "Present",
      bullets: ["Built dashboards in Power BI."],
    },
  ],
  education: [],
};

describe("buildGapSuggestions", () => {
  it("marks unknown terms as gaps", () => {
    const result = buildGapSuggestions(["SAP HANA"], TEST_CV);
    expect(result[0]?.status).toBe("gap");
    expect(result[0]?.message).toContain("Do not claim");
  });

  it("suggests transferable overlap for related terms", () => {
    const result = buildGapSuggestions(["TypeScript"], TEST_CV);
    expect(result[0]?.status).toBe("transferable");
    expect(result[0]?.relatedVerified).toContain("JavaScript");
  });

  it("finds Power BI overlap for dashboard keyword", () => {
    const result = buildGapSuggestions(["dashboard"], TEST_CV);
    expect(result[0]?.status).toBe("transferable");
    expect(result[0]?.relatedVerified?.some((v) => v.includes("Power BI"))).toBe(
      true
    );
  });
});
