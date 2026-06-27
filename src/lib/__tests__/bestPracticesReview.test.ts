import { describe, expect, it } from "vitest";
import { compareToBestPractices } from "@/lib/cv/bestPracticesReview";
import type { GeneratedCV, ParsedJob } from "@/types";

const baseJob: ParsedJob = {
  title: "Frontend Developer",
  company: "Acme",
  location: "Copenhagen",
  responsibilities: ["Build React interfaces"],
  requirements: ["React", "TypeScript", "CSS"],
  tools: ["Git", "Figma"],
  skills: ["JavaScript", "React", "CSS"],
  atsKeywords: ["React", "TypeScript", "responsive design"],
  rawText: "Frontend Developer at Acme. React, TypeScript, CSS.",
};

function makeCV(overrides: Partial<GeneratedCV["sections"]> = {}): GeneratedCV {
  return {
    sections: {
      header: {
        fullName: "Test User",
        email: "test@example.com",
        phone: "+45 00 00 00 00",
        location: "Copenhagen",
        summary: "",
      },
      summary:
        "Frontend Developer with 3 years building React applications. Improved page load time by 35% through code splitting. Skilled in TypeScript, CSS, and Git.",
      skills: [
        "JavaScript",
        "React",
        "TypeScript",
        "CSS",
        "Git",
        "Figma",
        "HTML",
        "Responsive design",
      ],
      experience: [
        {
          id: "1",
          company: "Tech Co",
          title: "Frontend Developer",
          location: "Copenhagen",
          startDate: "2022-01",
          endDate: "2024-06",
          bullets: [
            "Built responsive React dashboards used by 200+ internal users",
            "Reduced bundle size 30% by refactoring legacy components",
            "Collaborated with design in Figma to ship 12 UI features",
          ],
        },
      ],
      education: [],
      ...overrides,
    },
    atsNotes: [],
  };
}

describe("compareToBestPractices", () => {
  it("scores a well-tailored CV as ready or review", () => {
    const result = compareToBestPractices(makeCV(), baseJob);
    expect(result.overallScore).toBeGreaterThanOrEqual(70);
    expect(["ready", "review"]).toContain(result.readiness);
    expect(result.checks.length).toBeGreaterThanOrEqual(10);
    expect(result.passCount).toBeGreaterThan(0);
  });

  it("flags weak duty language and low metrics", () => {
    const cv = makeCV({
      summary: "I am a hardworking developer looking for opportunities.",
      skills: ["JavaScript"],
      experience: [
        {
          id: "1",
          company: "Tech Co",
          title: "Developer",
          location: "Copenhagen",
          startDate: "2022-01",
          endDate: "2024-06",
          bullets: [
            "Responsible for maintaining the website",
            "Helped with various tasks on the team",
          ],
        },
      ],
    });

    const result = compareToBestPractices(cv, baseJob);
    expect(result.readiness).toBe("not-ready");
    expect(result.failCount).toBeGreaterThan(0);
    expect(
      result.checks.some(
        (c) => c.id === "no-duty-language" && c.status !== "pass"
      )
    ).toBe(true);
  });

  it("reports keyword coverage against the job", () => {
    const cv = makeCV({
      summary: "Backend engineer focused on Java services.",
      skills: ["Java", "Spring"],
      experience: [],
    });

    const result = compareToBestPractices(cv, baseJob);
    const keywordCheck = result.checks.find((c) => c.id === "keyword-tailoring");
    expect(keywordCheck).toBeDefined();
    expect(keywordCheck!.status).not.toBe("pass");
  });
});
