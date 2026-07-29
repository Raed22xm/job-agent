import { describe, expect, it } from "vitest";
import { generateCoverLetter } from "@/lib/generateCoverLetter";
import type { MasterCV, ParsedJob } from "@/types";

const VERIFIED_CV: MasterCV = {
  personalInfo: {
    fullName: "Alex Jensen",
    email: "alex@example.com",
    phone: "+45 12 34 56 78",
    location: "Copenhagen",
    summary: "Frontend developer focused on accessible digital products.",
  },
  skills: ["React", "TypeScript", "Accessibility"],
  tools: ["Figma", "Git"],
  experience: [
    {
      id: "experience-1",
      title: "Frontend Developer",
      company: "Verified Studio",
      location: "Copenhagen",
      startDate: "2023-01",
      endDate: "Present",
      bullets: ["Built accessible React interfaces with TypeScript."],
    },
  ],
  education: [],
};

const TARGET_JOB: ParsedJob = {
  title: "Product Engineer",
  company: "Northstar Labs",
  location: "Aarhus",
  responsibilities: ["Build accessible web products."],
  requirements: ["React", "Kubernetes"],
  tools: ["Kubernetes"],
  skills: ["React", "Kubernetes"],
  atsKeywords: ["React", "Kubernetes"],
  rawText:
    "Northstar Labs seeks a Product Engineer with React and Kubernetes experience.",
};

function expectGroundedThreeParagraphLetter(
  paragraphs: string[],
  stockOpening: string
): void {
  expect(paragraphs).toHaveLength(3);
  expect(paragraphs.every((paragraph) => paragraph.trim().length > 0)).toBe(true);
  expect(paragraphs.every((paragraph) => paragraph.length <= 450)).toBe(true);

  const letter = paragraphs.join("\n").toLowerCase();
  expect(letter).not.toContain(stockOpening.toLowerCase());
  expect(letter).toContain(TARGET_JOB.title.toLowerCase());
  expect(letter).toContain(TARGET_JOB.company.toLowerCase());
  expect(letter).toMatch(/react|typescript|accessibility|frontend developer|verified studio/);
  expect(letter).not.toContain("kubernetes");
}

describe("generateCoverLetter", () => {
  it("creates a concise, grounded English draft without a stock AI opening", () => {
    const result = generateCoverLetter(VERIFIED_CV, TARGET_JOB, "english");

    expectGroundedThreeParagraphLetter(
      result.paragraphs,
      "I am writing to express my interest"
    );
  });

  it("creates a concise, grounded Danish draft without a stock AI opening", () => {
    const result = generateCoverLetter(VERIFIED_CV, TARGET_JOB, "danish");

    expectGroundedThreeParagraphLetter(
      result.paragraphs,
      "Jeg skriver for at udtrykke min interesse"
    );
  });
});
