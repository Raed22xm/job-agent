import { describe, expect, it } from "vitest";
import { validateGeneratedCV, validateCoverLetter } from "@/lib/cv/validateCV";
import { generateCV } from "@/lib/generateCV";
import {
  buildCoverLetterMotivation,
  generateCoverLetter,
} from "@/lib/generateCoverLetter";
import { matchCV } from "@/lib/matchCV";
import { parseJob } from "@/lib/parseJob";
import type { MasterCV, ParsedJob } from "@/types";

const TEST_CV: MasterCV = {
  personalInfo: {
    fullName: "Test User",
    email: "test@example.com",
    phone: "+45 00 00 00 00",
    location: "Copenhagen",
    summary: "Developer with React experience.",
  },
  professionalSummary: {
    professionalBackground: "Verified professional background.",
    professionalMotivation: "Verified professional motivation.",
    coreCompetencies: "Verified core competencies.",
    personalStrengths: "Verified personal strengths.",
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

  it.each(Object.keys(TEST_CV.professionalSummary))(
    "rejects a generated summary that omits %s",
    (field) => {
      const job = parseJob(
        `Developer\nAcme · Remote\n\nRequirements:\n- React and JavaScript experience`
      );
      const generated = generateCV(TEST_CV, job, matchCV(job, TEST_CV));
      const omitted = TEST_CV.professionalSummary[
        field as keyof typeof TEST_CV.professionalSummary
      ];
      generated.sections.summary = generated.sections.summary
        .replace(omitted, "")
        .trim();

      const result = validateGeneratedCV(generated, TEST_CV);

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({ field: "summary", severity: "error" })
      );
    }
  );

  it("identifies a blank verified source element", () => {
    const master: MasterCV = {
      ...TEST_CV,
      professionalSummary: {
        ...TEST_CV.professionalSummary,
        professionalMotivation: "  ",
      },
    };
    const job = parseJob(
      `Developer\nAcme · Remote\n\nRequirements:\n- React and JavaScript experience`
    );
    const generated = generateCV(master, job, matchCV(job, master));

    const result = validateGeneratedCV(generated, master);

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        field: "professionalSummary.professionalMotivation",
        severity: "error",
      })
    );
  });
});

describe("validateCoverLetter", () => {
  const job: ParsedJob = {
    title: "Frontend Developer",
    company: "Acme",
    location: "Copenhagen",
    responsibilities: ["Build React applications."],
    requirements: ["React"],
    tools: [],
    skills: ["React"],
    atsKeywords: ["React"],
    rawText: "Frontend Developer at Acme building React applications.",
  };

  it("passes a canonical three-part motivation paragraph", () => {
    const letter = generateCoverLetter(TEST_CV, job, "english");

    expect(validateCoverLetter(letter, TEST_CV, job, "english").valid).toBe(true);
  });

  it.each(["delete", "reorder", "rewrite"])(
    "rejects a %s motivation component change",
    (change) => {
      const letter = generateCoverLetter(TEST_CV, job, "english");
      const canonical = buildCoverLetterMotivation(TEST_CV, job, "english");
      if (change === "delete") {
        letter.paragraphs[0] = canonical.split(". ").slice(1).join(". ");
      } else if (change === "reorder") {
        letter.paragraphs[0] = canonical.split(". ").reverse().join(". ");
      } else {
        letter.paragraphs[0] = canonical.replace("caught my attention", "is ideal for me");
      }

      const result = validateCoverLetter(letter, TEST_CV, job, "english");

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({ field: "motivation", severity: "error" })
      );
    }
  );

  it("rejects letters with fewer than three paragraphs", () => {
    const letter = generateCoverLetter(TEST_CV, job, "english");
    letter.paragraphs = letter.paragraphs.slice(0, 2);

    const result = validateCoverLetter(letter, TEST_CV, job, "english");

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ field: "paragraphs", severity: "error" })
    );
  });

  it("rejects an appended fourth paragraph", () => {
    const letter = generateCoverLetter(TEST_CV, job, "english");
    letter.paragraphs.push(
      "I increased revenue by 300% while leading a global team."
    );

    const result = validateCoverLetter(letter, TEST_CV, job, "english");

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ field: "paragraphs", severity: "error" })
    );
  });

  it.each([
    ["greeting", "Dear Global Leadership Team,"],
    ["closing", "With guaranteed results,"],
    ["signature", "Invented Executive"],
  ] as const)("rejects a mutated %s", (field, value) => {
    const letter = generateCoverLetter(TEST_CV, job, "english");
    letter[field] = value;

    const result = validateCoverLetter(letter, TEST_CV, job, "english");

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ field, severity: "error" })
    );
  });

  it("rejects invented employer and unsupported skill claims in evidence", () => {
    const letter = generateCoverLetter(TEST_CV, job, "english");
    letter.paragraphs[1] =
      "At Invented Corp, I used Kubernetes to operate production systems.";

    const result = validateCoverLetter(letter, TEST_CV, job, "english");

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "evidence.company", severity: "error" }),
        expect.objectContaining({ field: "evidence.skill", severity: "error" }),
      ])
    );
  });

  it("rejects fabricated metrics, leadership, and employer claims in evidence", () => {
    const letter = generateCoverLetter(TEST_CV, job, "english");
    letter.paragraphs[1] =
      "I increased revenue by 300% while leading a global team. I worked for Invented Corp.";

    const result = validateCoverLetter(letter, TEST_CV, job, "english");

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ field: "evidence", severity: "error" })
    );
  });

  it("warns when company is not mentioned", () => {
    const letter = generateCoverLetter(TEST_CV, job, "english");
    const otherJob = { ...job, company: "UniqueCompanyXYZ" };

    const result = validateCoverLetter(letter, TEST_CV, otherJob, "english");

    expect(result.issues).toContainEqual(
      expect.objectContaining({ field: "company", severity: "warning" })
    );
  });
});
