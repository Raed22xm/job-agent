import { describe, expect, it } from "vitest";
import {
  coverLetterPrompt,
  cvTailoringPrompt,
  SYSTEM_TRUTHFULNESS,
} from "@/lib/ai/prompts";

const MASTER_CV = JSON.stringify({
  personalInfo: {
    fullName: "Test User",
    summary: "Frontend developer with React experience.",
  },
  skills: ["React", "TypeScript"],
  experience: [
    {
      company: "Verified Company",
      title: "Developer",
      bullets: ["Built accessible React interfaces."],
    },
  ],
});

const JOB = JSON.stringify({
  title: "Frontend Developer",
  company: "Example Company",
  requirements: ["React", "TypeScript"],
});

describe("human-sounding application prompt contracts", () => {
  it("keeps emotional detail and anecdotes subject to the same truthfulness boundary", () => {
    const rules = SYSTEM_TRUTHFULNESS.toLowerCase();
    const generationRules = [
      cvTailoringPrompt(MASTER_CV, JOB, ["React"]),
      coverLetterPrompt(MASTER_CV, JOB),
    ]
      .join("\n")
      .toLowerCase();

    expect(rules).toMatch(/never invent|do not invent/);
    expect(rules).toMatch(/master cv|provided (?:cv|source)/);
    expect(generationRules).toMatch(/anecdote|personal stor/);
    expect(generationRules).toMatch(/motivation|emotion|feeling|enthusiasm/);
    expect(generationRules).toMatch(/never invent|do not invent/);
  });

  it("asks for a natural CV voice without sacrificing ATS clarity", () => {
    const prompt = cvTailoringPrompt(MASTER_CV, JOB, [
      "React",
      "TypeScript",
    ]).toLowerCase();

    expect(prompt).toMatch(/natural|human/);
    expect(prompt).toMatch(/var(?:y|ied).*(?:sentence|rhythm)|sentence.*var(?:y|ied)/s);
    expect(prompt).toMatch(/ats(?:[- ]friendly| terms)|applicant tracking system/);
    expect(prompt).toMatch(/clear|scannable|concise|direct/);
    expect(prompt).toMatch(/ats.*(?:mirror|language|supported)|keyword.*natural/s);
    expect(prompt).toMatch(/generic|clich[ée]|stock phrase|gpt/);
    expect(prompt).toMatch(/anecdote|personal stor/);
    expect(prompt).toContain("react");
    expect(prompt).toContain("typescript");
  });

  it("asks for a warm, specific cover letter while rejecting synthetic enthusiasm", () => {
    const prompt = coverLetterPrompt(MASTER_CV, JOB).toLowerCase();

    expect(prompt).toMatch(/natural|human|conversational/);
    expect(prompt).toMatch(/warm|genuine|sincere|authentic/);
    expect(prompt).toMatch(/var(?:y|ied).*(?:sentence|rhythm)|sentence.*var(?:y|ied)/s);
    expect(prompt).toMatch(/specific/);
    expect(prompt).toMatch(/generic|clich[ée]|stock phrase|gpt/);
    expect(prompt).toMatch(
      /over-enthusiastic|forced enthusiasm|manufactured enthusiasm/
    );
    expect(prompt).toMatch(/do not invent|never invent/);
    expect(prompt).toMatch(/anecdote|personal stor/);
    expect(prompt).toMatch(/motivation|emotion|feeling|enthusiasm/);
    expect(prompt).toMatch(/verified|master cv/);
    expect(prompt).toMatch(/3 paragraphs|three paragraphs/);
    expect(prompt).toMatch(/same language/);
  });
});
