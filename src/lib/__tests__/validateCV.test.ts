import { describe, expect, it } from "vitest";
import { validateGeneratedCV, validateCoverLetter } from "@/lib/cv/validateCV";
import { buildProfessionalSummary, generateCV } from "@/lib/generateCV";
import {
  buildCoverLetterMotivation,
  generateCoverLetter,
} from "@/lib/generateCoverLetter";
import { humanizeTextLocally } from "@/lib/humanizeText";
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

  it("requires the canonical verified metric selected from generated experience", () => {
    const master: MasterCV = {
      ...TEST_CV,
      experience: [{
        ...TEST_CV.experience[0],
        bullets: ["Built React apps.", "Reduced reporting time by 30%."],
      }],
    };
    const job = parseJob(
      "Developer role building React applications and improving reporting workflows."
    );
    const generated = generateCV(master, job, matchCV(job, master));

    expect(validateGeneratedCV(generated, master).valid).toBe(true);
    generated.sections.summary = buildProfessionalSummary(master);

    const result = validateGeneratedCV(generated, master);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ field: "summary", severity: "error" })
    );
  });

  it("accepts a verified master-CV metric when its source role is not displayed", () => {
    const metricRole = {
      ...TEST_CV.experience[0],
      id: "metric-role",
      company: "BS Technologies",
      bullets: ["Built 12+ Spring Boot endpoints with 99.9% uptime."],
    };
    const displayedRole = {
      ...TEST_CV.experience[0],
      id: "displayed-role",
      company: "Novo Nordisk",
      bullets: ["Built React apps."],
    };
    const master: MasterCV = {
      ...TEST_CV,
      experience: [metricRole, displayedRole],
    };
    const job = parseJob(
      "Developer role building React applications and improving customer workflows."
    );
    const generated = generateCV(master, job, matchCV(job, master));
    generated.sections.experience = [displayedRole];
    generated.sections.summary = buildProfessionalSummary(master, [metricRole]);

    expect(validateGeneratedCV(generated, master).valid).toBe(true);
  });

  it.each([
    ["fabricated metric", "Built 12+ Spring Boot endpoints with 999% uptime."],
    ["altered claim", "Increased revenue through 12+ endpoints with 99.9% uptime."],
  ])("rejects a %s in the canonical achievement sentence", (_, bullet) => {
    const master: MasterCV = {
      ...TEST_CV,
      experience: [{
        ...TEST_CV.experience[0],
        bullets: ["Built 12+ Spring Boot endpoints with 99.9% uptime."],
      }],
    };
    const job = parseJob(
      "Developer role building React applications and reliable Spring services."
    );
    const generated = generateCV(master, job, matchCV(job, master));
    const canonicalPrefix = buildProfessionalSummary(master);
    generated.sections.summary = `${canonicalPrefix} For example, I ${bullet.charAt(0).toLowerCase()}${bullet.slice(1)}`;

    const result = validateGeneratedCV(generated, master);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ field: "summary", severity: "error" })
    );
  });

  it("rejects reordered four-part summary elements", () => {
    const job = parseJob(
      "Developer role requiring React and JavaScript experience for web applications."
    );
    const generated = generateCV(TEST_CV, job, matchCV(job, TEST_CV));
    const parts = Object.values(TEST_CV.professionalSummary);
    generated.sections.summary = [parts[1], parts[0], parts[2], parts[3]].join(" ");

    expect(validateGeneratedCV(generated, TEST_CV).valid).toBe(false);
  });

  it("accepts the exact base summary when the master CV has no metric", () => {
    const job = parseJob(
      "Developer role requiring React and JavaScript experience for web applications."
    );
    const generated = generateCV(TEST_CV, job, matchCV(job, TEST_CV));

    expect(generated.sections.summary).toBe(buildProfessionalSummary(TEST_CV));
    expect(validateGeneratedCV(generated, TEST_CV).valid).toBe(true);
  });

  it.each([
    ["english", "Used Python 3 and OAuth 2."],
    ["danish", "Arbejdede med Python 3 og OAuth 2."],
  ])("treats incidental %s version numbers as no metric", (language, bullet) => {
    const master: MasterCV = {
      ...TEST_CV,
      professionalSummary: {
        ...TEST_CV.professionalSummary,
        professionalMotivation:
          language === "danish" ? "Jeg bygger software." : "I build software.",
      },
      experience: [{ ...TEST_CV.experience[0], bullets: [bullet] }],
    };
    const job = parseJob(
      "Developer role using Python and OAuth to build reliable customer applications."
    );
    const generated = generateCV(master, job, matchCV(job, master));

    expect(generated.sections.summary).toBe(buildProfessionalSummary(master));
    expect(validateGeneratedCV(generated, master).valid).toBe(true);
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

  it("passes the canonical headline and five-section cover letter", () => {
    const letter = generateCoverLetter(TEST_CV, job, "english");

    expect(validateCoverLetter(letter, TEST_CV, job, "english").valid).toBe(true);
  });

  it("rejects an unverified rewritten headline", () => {
    const letter = generateCoverLetter(TEST_CV, job, "english");
    letter.headline = "Award-winning Kubernetes leader for Acme";

    const result = validateCoverLetter(letter, TEST_CV, job, "english");

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ field: "headline", severity: "error" })
    );
  });

  it("rejects a complete exported letter over 400 words", () => {
    const letter = generateCoverLetter(TEST_CV, job, "english");
    letter.paragraphs[2] = `${letter.paragraphs[2]} ${"verified ".repeat(401)}`;

    const result = validateCoverLetter(letter, TEST_CV, job, "english");

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ field: "wordCount", severity: "error" })
    );
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

  it("accepts a fact-preserving humanized paragraph", () => {
    const humanizableCv: MasterCV = {
      ...TEST_CV,
      professionalSummary: {
        ...TEST_CV.professionalSummary,
        professionalMotivation:
          "I leverage modern tools to build reliable customer applications.",
      },
    };
    const letter = generateCoverLetter(humanizableCv, job, "english");
    letter.paragraphs[0] = humanizeTextLocally(letter.paragraphs[0]);

    const result = validateCoverLetter(
      letter,
      humanizableCv,
      job,
      "english"
    );

    expect(result.valid).toBe(true);
  });

  it("rejects letters with fewer than five paragraphs", () => {
    const letter = generateCoverLetter(TEST_CV, job, "english");
    letter.paragraphs = letter.paragraphs.slice(0, 2);

    const result = validateCoverLetter(letter, TEST_CV, job, "english");

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ field: "paragraphs", severity: "error" })
    );
  });

  it("rejects an appended sixth paragraph", () => {
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
      expect.objectContaining({ field: "valueContribution.1", severity: "error" })
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
