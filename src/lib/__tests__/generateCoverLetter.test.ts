import { describe, expect, it } from "vitest";
import {
  buildCoverLetterHeadline,
  buildCoverLetterMotivation,
  coverLetterWordCount,
  generateCoverLetter,
  MAX_COVER_LETTER_WORDS,
} from "@/lib/generateCoverLetter";
import type { MasterCV, ParsedJob } from "@/types";
import { getPersona } from "@/lib/personaManager";

const VERIFIED_CV: MasterCV = {
  personalInfo: {
    fullName: "Alex Jensen",
    email: "alex@example.com",
    phone: "+45 12 34 56 78",
    location: "Copenhagen",
    summary: "Frontend developer focused on accessible digital products.",
  },
  professionalSummary: {
    professionalBackground: "Verified professional background.",
    professionalMotivation: "Verified professional motivation.",
    coreCompetencies: "Verified core competencies.",
    personalStrengths: "Verified personal strengths.",
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

function expectGroundedFiveSectionLetter(
  result: ReturnType<typeof generateCoverLetter>,
  stockOpening: string
): void {
  const { headline, paragraphs } = result;
  expect(headline).toContain(TARGET_JOB.title);
  expect(headline).toContain(TARGET_JOB.company);
  expect(headline.toLowerCase()).toContain("react");
  expect(headline.toLowerCase()).not.toContain("kubernetes");
  expect(paragraphs).toHaveLength(5);
  expect(paragraphs.every((paragraph) => paragraph.trim().length > 0)).toBe(true);

  const letter = paragraphs.join("\n").toLowerCase();
  expect(letter).not.toContain(stockOpening.toLowerCase());
  expect(letter).toContain(TARGET_JOB.title.toLowerCase());
  expect(letter).toContain(TARGET_JOB.company.toLowerCase());
  expect(letter).toMatch(/react|typescript|accessibility|frontend developer|verified studio/);
  expect(letter).not.toContain("kubernetes");
  expect(paragraphs[0]).toContain(VERIFIED_CV.professionalSummary.professionalMotivation.toLowerCase());
  expect(paragraphs[1]).toContain("Verified Studio");
  expect(paragraphs[2]).not.toBe(paragraphs[1]);
  expect(paragraphs[3].toLowerCase()).toContain("verified personal strengths");
  expect(paragraphs[4]).toContain(TARGET_JOB.title);
  expect(paragraphs[4]).toContain(TARGET_JOB.company);
}

describe("generateCoverLetter", () => {
  it("creates a concise, grounded English draft without a stock AI opening", () => {
    const result = generateCoverLetter(VERIFIED_CV, TARGET_JOB, "english");

    expectGroundedFiveSectionLetter(
      result,
      "I am writing to express my interest"
    );
  });

  it("creates a concise, grounded Danish draft without a stock AI opening", () => {
    const result = generateCoverLetter(VERIFIED_CV, TARGET_JOB, "danish");

    expectGroundedFiveSectionLetter(
      result,
      "Jeg skriver for at udtrykke min interesse"
    );
  });

  it.each(["english", "danish"] as const)(
    "keeps the complete %s letter within 400 words for an unusually long responsibility",
    (language) => {
      const cv = getPersona(language);
      expect(cv).not.toBeNull();
      if (!cv) throw new Error(`Missing ${language} persona`);
      const longResponsibility = Array.from(
        { length: 45 },
        () => "Build accessible React products with verified delivery practices"
      ).join(" ");
      const letter = generateCoverLetter(
        cv,
        { ...TARGET_JOB, responsibilities: [longResponsibility] },
        language
      );

      expect(coverLetterWordCount(letter)).toBeLessThanOrEqual(
        MAX_COVER_LETTER_WORDS
      );
      expect(letter.paragraphs[0]).toContain("…");
      expect(letter.paragraphs[0]).toContain("React");
    }
  );

  it.each([
    ["english", /\. I [a-z]/],
    ["danish", /\. Jeg [a-zæøå]/],
  ] as const)(
    "turns secondary-role evidence into grammatical first-person %s prose",
    (language, evidencePattern) => {
      const cv = getPersona(language);
      expect(cv).not.toBeNull();
      if (!cv) throw new Error(`Missing ${language} persona`);

      const paragraph = generateCoverLetter(cv, TARGET_JOB, language).paragraphs[2];

      expect(paragraph).toMatch(evidencePattern);
    }
  );

  it.each(["english", "danish"] as const)(
    "introduces a verified project description as a complete %s sentence",
    (language) => {
      const cv: MasterCV = {
        ...VERIFIED_CV,
        projects: [{ id: "project-1", name: "Access Lab", description: "Built accessible React prototypes" }],
      };

      const paragraph = generateCoverLetter(cv, TARGET_JOB, language).paragraphs[2];

      expect(paragraph).toContain("“Built accessible React prototypes”.");
      expect(paragraph).toMatch(
        language === "danish" ? /Mit verificerede CV beskriver/ : /My verified CV describes/
      );
    }
  );

  it.each(["english", "danish"] as const)(
    "does not repeat a quantified achievement in %s evidence",
    (language) => {
      const cv: MasterCV = {
        ...VERIFIED_CV,
        experience: [
          {
            ...VERIFIED_CV.experience[0],
            bullets: [
              "Reduced production errors by 40% through automated checks.",
              "Built accessible React interfaces with TypeScript.",
            ],
          },
        ],
      };
      const job: ParsedJob = {
        ...TARGET_JOB,
        responsibilities: ["Reduce production errors through automated checks."],
      };

      const evidence = generateCoverLetter(cv, job, language).paragraphs[1];

      expect(evidence.match(/40%/g)).toHaveLength(1);
    }
  );

  it("builds a factual headline from job and verified CV overlap only", () => {
    const headline = buildCoverLetterHeadline(VERIFIED_CV, TARGET_JOB, "english");

    expect(headline).toContain("Product Engineer");
    expect(headline).toContain("Northstar Labs");
    expect(headline).toContain("React");
    expect(headline).not.toContain("Kubernetes");
  });

  it.each(["english", "danish"] as const)(
    "orders verified position, motivation, and task content in %s",
    (language) => {
      const job: ParsedJob = {
        ...TARGET_JOB,
        responsibilities: [
          "Coordinate unrelated procurement schedules.",
          "Build React and TypeScript interfaces.",
        ],
      };
      const motivation = buildCoverLetterMotivation(VERIFIED_CV, job, language);
      const opening =
        language === "danish"
          ? `Stillingen som ${job.title} hos ${job.company}`
          : `The ${job.title} position at ${job.company}`;
      const verifiedMotivation =
        VERIFIED_CV.professionalSummary.professionalMotivation.toLowerCase();

      expect(motivation.indexOf(opening)).toBe(0);
      expect(motivation.toLowerCase().indexOf(verifiedMotivation)).toBeGreaterThan(
        motivation.indexOf(opening)
      );
      expect(motivation.indexOf(job.responsibilities[1])).toBeGreaterThan(
        motivation.toLowerCase().indexOf(verifiedMotivation)
      );
      expect(motivation).not.toContain(job.responsibilities[0]);
      expect(motivation).toMatch(/React.*TypeScript/);
      expect(motivation.toLowerCase()).not.toContain("kubernetes");
    }
  );

  it.each(["english", "danish"] as const)(
    "uses a transparent no-task fallback in %s",
    (language) => {
      const motivation = buildCoverLetterMotivation(
        VERIFIED_CV,
        { ...TARGET_JOB, responsibilities: [] },
        language
      );

      expect(motivation).toContain(TARGET_JOB.title);
      expect(motivation).toContain(TARGET_JOB.company);
      expect(motivation.toLowerCase()).toMatch(
        language === "danish" ? /ikke beskrevet/ : /does not detail/
      );
      expect(motivation.toLowerCase()).not.toContain("kubernetes");
    }
  );

  it("preserves the uppercase English first-person pronoun in motivation", () => {
    const cv: MasterCV = {
      ...VERIFIED_CV,
      professionalSummary: {
        ...VERIFIED_CV.professionalSummary,
        professionalMotivation: "I build verified React products.",
      },
    };

    const motivation = buildCoverLetterMotivation(cv, TARGET_JOB, "english");

    expect(motivation).toContain(
      "This position appeals to me because I build verified React products."
    );
    expect(motivation).not.toContain("because i build");
  });

  it("lowercases Danish Jeg naturally after fordi", () => {
    const cv: MasterCV = {
      ...VERIFIED_CV,
      professionalSummary: {
        ...VERIFIED_CV.professionalSummary,
        professionalMotivation: "Jeg udvikler verificerede React-løsninger.",
      },
    };

    expect(buildCoverLetterMotivation(cv, TARGET_JOB, "danish")).toContain(
      "Stillingen motiverer mig særligt, fordi jeg udvikler verificerede React-løsninger."
    );
  });

  it.each([
    ["english", "The open position at your organization caught my attention."],
    ["danish", "Den ledige stilling hos jeres organisation fangede min opmærksomhed."],
  ] as const)("uses a natural %s undetected-job fallback", (language, opening) => {
    const motivation = buildCoverLetterMotivation(
      VERIFIED_CV,
      {
        ...TARGET_JOB,
        title: "Role title not detected",
        company: "Not detected",
      },
      language
    );

    expect(motivation.startsWith(opening)).toBe(true);
    expect(motivation).not.toMatch(/the the open role|den ledige stilling som/i);
  });

  it("does not match the verified skill Go inside an unrelated English word", () => {
    const cv = getPersona("english");
    expect(cv).not.toBeNull();
    if (!cv) throw new Error("Missing English persona");
    const motivation = buildCoverLetterMotivation(
      cv,
      {
        ...TARGET_JOB,
        title: "Buyer",
        company: "Acme",
        responsibilities: ["Negotiate vendor contracts."],
      },
      "english"
    );

    expect(motivation).not.toContain("verified experience in Go");
    expect(motivation).toContain("verified professional motivation");
  });

  it("uses the verified-motivation fallback for an unrelated Danish task", () => {
    const cv = getPersona("danish");
    expect(cv).not.toBeNull();
    if (!cv) throw new Error("Missing Danish persona");
    const motivation = buildCoverLetterMotivation(
      cv,
      {
        ...TARGET_JOB,
        title: "Indkøber",
        company: "Eksempel",
        responsibilities: ["Forhandle leverandøraftaler."],
      },
      "danish"
    );

    expect(motivation).not.toContain("verificerede erfaring med Go");
    expect(motivation).toContain("verificerede faglige motivation");
  });
});
