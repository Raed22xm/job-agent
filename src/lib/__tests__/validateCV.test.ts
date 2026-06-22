import { describe, expect, it } from "vitest";
import { validateGeneratedCV, validateCoverLetter } from "@/lib/cv/validateCV";
import { generateCV } from "@/lib/generateCV";
import { matchCV } from "@/lib/matchCV";
import { parseJob } from "@/lib/parseJob";
import type { MasterCV } from "@/types";

const TEST_CV: MasterCV = {
  personalInfo: {
    fullName: "Test User",
    email: "test@example.com",
    phone: "+45 00 00 00 00",
    location: "Copenhagen",
    summary: "Developer with React experience.",
  },
  skills: ["JavaScript", "React"],
  tools: ["Git"],
  experience: [
    {
      id: "exp-1",
      company: "Test Corp",
      title: "Developer",
      location: "Copenhagen",
      startDate: "2023-01",
      endDate: "2024-01",
      bullets: ["Built React apps."],
    },
  ],
  education: [],
};

describe("validateGeneratedCV", () => {
  it("passes when generated CV uses only verified skills", () => {
    const job = parseJob(
      `Developer\nAcme · Remote\n\nRequirements:\n- React and JavaScript experience with Git version control workflows`
    );
    const match = matchCV(job, TEST_CV);
    const generated = generateCV(TEST_CV, job, match);

    const result = validateGeneratedCV(generated, TEST_CV);
    expect(result.valid).toBe(true);
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });

  it("flags invented skills", () => {
    const job = parseJob(
      `Developer\nAcme · Remote\n\nRequirements:\n- React and Kubernetes experience for cloud infrastructure`
    );
    const match = matchCV(job, TEST_CV);
    const generated = generateCV(TEST_CV, job, match);

    generated.sections.skills.push("Kubernetes");

    const result = validateGeneratedCV(generated, TEST_CV);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes("Kubernetes"))).toBe(
      true
    );
  });
});

describe("validateCoverLetter", () => {
  it("warns when company is not mentioned", () => {
    const letter = {
      greeting: "Dear Hiring Manager,",
      paragraphs: [
        "I am interested in this role.",
        "I have relevant experience.",
        "Thank you for your consideration.",
      ],
      closing: "Sincerely,",
      signature: "Test User",
    };

    const result = validateCoverLetter(letter, TEST_CV, "UniqueCompanyXYZ");

    expect(result.issues.some((i) => i.field === "company")).toBe(true);
  });
});
