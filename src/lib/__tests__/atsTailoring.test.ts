import { describe, expect, it } from "vitest";
import { generateCV } from "@/lib/generateCV";
import { scoreCVKeywordCoverage } from "@/lib/cv/scoreCVKeywords";
import { tailorExperienceForJob } from "@/lib/cv/tailorExperience";
import { matchCV } from "@/lib/matchCV";
import { parseJob } from "@/lib/parseJob";
import type { MasterCV } from "@/types";

const TEST_CV: MasterCV = {
  personalInfo: {
    fullName: "Test User",
    email: "test@example.com",
    phone: "+45 12345678",
    location: "Copenhagen",
    summary: "Full-stack developer with React and Power BI experience.",
  },
  skills: ["React", "TypeScript", "Power BI", "SQL"],
  tools: ["Figma", "Git"],
  experience: [
    {
      id: "exp-a",
      title: "Frontend Developer",
      company: "Alpha ApS",
      location: "Copenhagen",
      startDate: "2023-01",
      endDate: "2024-06",
      bullets: [
        "Built dashboards with Power BI.",
        "Maintained internal tools.",
      ],
    },
    {
      id: "exp-b",
      title: "UX Designer",
      company: "Beta ApS",
      location: "Copenhagen",
      startDate: "2021-01",
      endDate: "2022-12",
      bullets: [
        "Created Figma wireframes for mobile apps.",
        "Ran user interviews.",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      degree: "BSc Computer Science",
      institution: "DTU",
      field: "Computer Science",
      startDate: "2018",
      endDate: "2021",
    },
  ],
};

describe("tailorExperienceForJob", () => {
  it("puts job-relevant experience and bullets first without changing text", () => {
    const job = parseJob(
      "Frontend developer. React, TypeScript, dashboards. Power BI is a plus.",
      "https://example.com/job"
    );
    const match = matchCV(job, TEST_CV);
    const tailored = tailorExperienceForJob(TEST_CV.experience, job, match);

    expect(tailored[0].id).toBe("exp-a");
    expect(tailored[0].bullets[0]).toContain("Power BI");
    expect(tailored.flatMap((e) => e.bullets).sort()).toEqual(
      TEST_CV.experience.flatMap((e) => e.bullets).sort()
    );
  });
});

describe("generateCV", () => {
  it("reorders skills and experience for ATS without inventing content", () => {
    const job = parseJob(
      "React developer with TypeScript and Power BI experience required.",
      "https://example.com/job"
    );
    const match = matchCV(job, TEST_CV);
    const generated = generateCV(TEST_CV, job, match);

    expect(generated.sections.skills[0]).toBe("React");
    expect(generated.sections.experience[0].id).toBe("exp-a");
    expect(generated.atsNotes.some((n) => n.includes("reordered"))).toBe(true);
  });
});

describe("scoreCVKeywordCoverage", () => {
  it("scores keywords present in generated CV text", () => {
    const job = parseJob(
      "Must know React, TypeScript, Kubernetes, and Danish.",
      "https://example.com/job"
    );
    const match = matchCV(job, TEST_CV);
    const generated = generateCV(TEST_CV, job, match);
    const coverage = scoreCVKeywordCoverage(generated, job);

    expect(coverage.total).toBeGreaterThan(0);
    expect(coverage.matched).toEqual(
      expect.arrayContaining(["React", "TypeScript"])
    );
    expect(coverage.missing.length).toBeGreaterThan(0);
    expect(coverage.score).toBeGreaterThan(0);
    expect(coverage.score).toBeLessThanOrEqual(100);
  });
});
