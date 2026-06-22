import { describe, expect, it } from "vitest";
import { matchCV } from "@/lib/matchCV";
import { parseJob } from "@/lib/parseJob";
import { scoreJob } from "@/lib/job/scoreJob";
import type { MasterCV, ParsedJob } from "@/types";

const TEST_CV: MasterCV = {
  personalInfo: {
    fullName: "Test User",
    email: "test@example.com",
    phone: "+45 00 00 00 00",
    location: "Copenhagen",
    summary: "Developer with React and Python experience.",
  },
  skills: ["JavaScript", "React", "Python", "CSS", "SQL"],
  tools: ["Git", "Figma", "Docker"],
  experience: [
    {
      id: "exp-1",
      company: "Test Corp",
      title: "Frontend Developer",
      location: "Copenhagen",
      startDate: "2023-01",
      endDate: "2024-01",
      bullets: [
        "Built React dashboards and integrated APIs.",
        "Used Git for version control across the team.",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "Test University",
      degree: "BSc",
      field: "Computer Science",
      startDate: "2019",
      endDate: "2023",
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "Web App",
      description: "React and CSS portfolio project with Git workflow.",
    },
  ],
};

const STRONG_MATCH_JOB: ParsedJob = {
  title: "Frontend Developer",
  company: "Acme",
  location: "Remote",
  responsibilities: ["Build React applications"],
  requirements: ["React", "JavaScript", "Git"],
  skills: ["React", "JavaScript", "CSS"],
  tools: ["Git", "Figma"],
  atsKeywords: ["React", "JavaScript", "Git", "Figma", "CSS"],
  rawText: "Frontend role requiring React, JavaScript, Git, Figma, CSS",
};

const WEAK_MATCH_JOB: ParsedJob = {
  title: "DevOps Engineer",
  company: "CloudCo",
  location: "Remote",
  responsibilities: ["Manage Kubernetes clusters"],
  requirements: ["Kubernetes", "Terraform", "AWS"],
  skills: ["Kubernetes", "Terraform"],
  tools: ["AWS", "Docker"],
  atsKeywords: ["Kubernetes", "Terraform", "AWS"],
  rawText: "DevOps role requiring Kubernetes, Terraform, AWS",
};

describe("matchCV", () => {
  it("returns zero score when no keywords are detected", () => {
    const emptyJob: ParsedJob = {
      ...STRONG_MATCH_JOB,
      skills: [],
      tools: [],
      atsKeywords: [],
    };

    const result = matchCV(emptyJob, TEST_CV);

    expect(result.score).toBe(0);
    expect(result.matchedKeywords).toHaveLength(0);
    expect(result.summary).toContain("Unable to score");
  });

  it("finds matched keywords for overlapping skills", () => {
    const result = matchCV(STRONG_MATCH_JOB, TEST_CV);

    expect(result.matchedKeywords).toEqual(
      expect.arrayContaining(["React", "JavaScript", "Git"])
    );
    expect(result.matchedKeywords.length).toBeGreaterThan(0);
  });

  it("lists missing keywords not in master CV", () => {
    const result = matchCV(WEAK_MATCH_JOB, TEST_CV);

    expect(result.missingKeywords).toEqual(
      expect.arrayContaining(["Kubernetes", "Terraform"])
    );
  });

  it("scores strong match higher than weak match", () => {
    const strong = matchCV(STRONG_MATCH_JOB, TEST_CV);
    const weak = matchCV(WEAK_MATCH_JOB, TEST_CV);

    expect(strong.score).toBeGreaterThan(weak.score);
  });

  it("includes weighted score breakdown", () => {
    const result = matchCV(STRONG_MATCH_JOB, TEST_CV);

    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown!.overall).toBe(result.score);
    expect(result.scoreBreakdown!.skills.weight).toBe(3);
    expect(result.scoreBreakdown!.tools.weight).toBe(2);
    expect(result.scoreBreakdown!.keywords.weight).toBe(1);
  });

  it("provides recommended focus areas", () => {
    const result = matchCV(STRONG_MATCH_JOB, TEST_CV);

    expect(result.recommendedFocusAreas.length).toBeGreaterThan(0);
    expect(result.recommendedFocusAreas.some((a) => a.includes("React"))).toBe(
      true
    );
  });

  it("warns about missing terms without inventing them", () => {
    const result = matchCV(WEAK_MATCH_JOB, TEST_CV);

    const gapWarning = result.recommendedFocusAreas.find((a) =>
      a.includes("not verified")
    );
    expect(gapWarning).toBeDefined();
  });
});

describe("scoreJob", () => {
  it("weights skills higher than keywords", () => {
    const skillsOnlyJob: ParsedJob = {
      ...STRONG_MATCH_JOB,
      tools: [],
      atsKeywords: [],
      skills: ["React"],
    };

    const breakdown = scoreJob(skillsOnlyJob, TEST_CV);
    expect(breakdown.skills.score).toBe(100);
    expect(breakdown.overall).toBe(100);
  });

  it("deduplicates keywords already counted in skills/tools", () => {
    const job: ParsedJob = {
      ...STRONG_MATCH_JOB,
      skills: ["React"],
      tools: ["Git"],
      atsKeywords: ["React", "Git", "JavaScript"],
    };

    const breakdown = scoreJob(job, TEST_CV);
    expect(breakdown.keywords.total).toBe(1);
    expect(breakdown.keywords.total).toBeLessThan(job.atsKeywords.length);
  });
});

describe("matchCV integration with parseJob", () => {
  it("analyzes a full job posting end-to-end", () => {
    const text = `Frontend Developer
Acme Corp · Remote

Requirements:
- React and JavaScript proficiency
- Git version control experience
- CSS and responsive design

Responsibilities:
- Build customer-facing React applications
- Collaborate with design team using Figma`;

    const job = parseJob(text);
    const result = matchCV(job, TEST_CV);

    expect(result.score).toBeGreaterThan(50);
    expect(result.matchedKeywords).toEqual(
      expect.arrayContaining(["React", "JavaScript"])
    );
  });
});
