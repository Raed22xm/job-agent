import { describe, expect, it } from "vitest";
import {
  buildProfessionalSummary,
  generateCV,
  isQuantifiedAchievement,
  verifiedProfessionalSummaryCandidates,
} from "@/lib/generateCV";
import { scoreCVKeywordCoverage } from "@/lib/cv/scoreCVKeywords";
import { analyseCVFeedback } from "@/lib/cv/cvFeedback";
import { tailorExperienceForJob } from "@/lib/cv/tailorExperience";
import { matchCV } from "@/lib/matchCV";
import { parseJob } from "@/lib/parseJob";
import { getPersona } from "@/lib/personaManager";
import type { MasterCV } from "@/types";

const TEST_CV: MasterCV = {
  personalInfo: {
    fullName: "Test User",
    email: "test@example.com",
    phone: "+45 12345678",
    location: "Copenhagen",
    summary: "Full-stack developer with React and Power BI experience.",
  },
  professionalSummary: {
    professionalBackground: "Verified professional background.",
    professionalMotivation: "Verified professional motivation.",
    coreCompetencies: "Verified core competencies.",
    personalStrengths: "Verified personal strengths.",
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
  it.each([
    "Built 12+ Spring Boot endpoints with 99.9% uptime.",
    "Built 5 Power BI dashboards, reducing reporting time by 30%.",
    "Processed 500+ shipments.",
    "Conducted 25+ interviews.",
    "Byggede 5 dashboards og reducerede tiden med 30 %.",
  ])("recognizes a real quantified achievement: %s", (bullet) => {
    expect(isQuantifiedAchievement(bullet)).toBe(true);
  });

  it.each([
    "Used Python 3 and OAuth 2.",
    "Arbejdede med Python 3 og OAuth 2.",
    "Migrated to React 19.",
  ])("rejects incidental technology version numbers: %s", (bullet) => {
    expect(isQuantifiedAchievement(bullet)).toBe(false);
  });

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

  it("builds the summary from all four verified elements in source order", () => {
    const job = parseJob(
      "React developer with TypeScript experience required.",
      "https://example.com/job"
    );
    const generated = generateCV(TEST_CV, job, matchCV(job, TEST_CV));
    const elements = Object.values(TEST_CV.professionalSummary);

    expect(generated.sections.summary).toBe(buildProfessionalSummary(TEST_CV));
    expect(elements.every((element) => generated.sections.summary.includes(element))).toBe(true);
    expect(elements.map((element) => generated.sections.summary.indexOf(element))).toEqual(
      [...elements].map((_, index) =>
        elements.slice(0, index).reduce((length, value) => length + value.length + 1, 0)
      )
    );
  });

  it.each([
    ["danish", "Danish"],
    ["english", "English"],
  ])("preserves the real %s persona summary contract", (personaId) => {
    const persona = getPersona(personaId);
    expect(persona).not.toBeNull();
    if (!persona) throw new Error(`Missing ${personaId} persona fixture`);

    const elements = Object.values(persona.professionalSummary);
    const job = parseJob(
      "Software developer role requiring React, TypeScript, Java, and UX experience.",
      "https://example.com/job"
    );
    const generated = generateCV(persona, job, matchCV(job, persona));
    const canonical = buildProfessionalSummary(persona, generated.sections.experience);

    expect(elements.every((element) => element.trim().length > 0)).toBe(true);
    expect(generated.sections.summary).toBe(canonical);
    let previousIndex = -1;
    for (const element of elements) {
      expect(canonical.split(element)).toHaveLength(2);
      const index = canonical.indexOf(element);
      expect(index).toBeGreaterThan(previousIndex);
      previousIndex = index;
    }
    expect(canonical).toMatch(/\d/);
    expect(
      analyseCVFeedback(generated).some((item) =>
        item.message.includes("no quantifiable achievement")
      )
    ).toBe(false);
    expect(canonical).toMatch(
      personaId === "danish"
        ? /Konkret har jeg [a-zæøå].*\d/
        : /For example, I [a-z].*\d/
    );
    const candidates = verifiedProfessionalSummaryCandidates(persona);
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.every((candidate) =>
      personaId === "danish"
        ? /Konkret har jeg [a-zæøå].*\d/u.test(candidate)
        : /For example, I [a-z].*\d/u.test(candidate)
    )).toBe(true);
  });

  it("preserves the base summary when no verified metric exists", () => {
    const job = parseJob(
      "React developer role building accessible web interfaces for customers.",
      "https://example.com/job"
    );
    const generated = generateCV(TEST_CV, job, matchCV(job, TEST_CV));

    expect(generated.sections.summary).toBe(buildProfessionalSummary(TEST_CV));
  });

  it("never copies a fabricated metric from generated experience", () => {
    const master: MasterCV = {
      ...TEST_CV,
      experience: [{ ...TEST_CV.experience[0], bullets: ["Built React interfaces for customers."] }],
    };
    const generatedExperience = [{
      ...master.experience[0],
      bullets: ["Increased revenue by 999%."],
    }];

    const summary = buildProfessionalSummary(master, generatedExperience);

    expect(summary).toBe(buildProfessionalSummary(master));
    expect(summary).not.toContain("999%");
  });

  it.each([
    ["english", "I reduced errors by 30%.", "For example, I reduced errors by 30%.", "I I"],
    ["danish", "Jeg reducerede fejl med 30 %.", "Konkret har jeg reducerede fejl med 30 %.", "jeg jeg"],
  ] as const)(
    "does not duplicate an existing first-person pronoun in %s metrics",
    (language, bullet, expected, duplicate) => {
      const master: MasterCV = {
        ...TEST_CV,
        professionalSummary: {
          ...TEST_CV.professionalSummary,
          professionalMotivation:
            language === "danish" ? "Jeg bygger software." : "I build software.",
        },
        experience: [{ ...TEST_CV.experience[0], bullets: [bullet] }],
      };

      const summary = buildProfessionalSummary(master, master.experience);

      expect(summary).toContain(expected);
      expect(summary.toLowerCase()).not.toContain(duplicate.toLowerCase());
    }
  );
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
