import { describe, expect, it } from "vitest";
import { JobParseError, parseJob, isLikelyUrl } from "@/lib/parseJob";

const BODIL_JOB = `Junior Software Developer (Student Assistant)
Bodil Energi · Copenhagen (Hybrid)

What You'll Do
- Develop and maintain features in our energy control platform
- Implement integrations with new energy devices and third-party systems
- Work with our developers to ensure reliable communication between cloud software and field hardware

What We're Looking For
- Currently studying software development, computer science, or a related field
- Hands-on experience writing code — ideally in TypeScript or JavaScript
- Familiar with Git and Docker, and understand basic software workflows

You'll be working with technologies like TypeScript, Node.js, React, Docker, and Google Cloud.`;

const MINIMAL_JOB = `Frontend Developer
Acme Corp · Remote

Requirements:
- 3+ years experience with React and JavaScript
- Proficiency in CSS and Git
- Experience with Figma for design collaboration

Responsibilities:
- Build responsive web applications using React
- Collaborate with designers on UI implementation
- Maintain component libraries and write clean CSS`;

describe("parseJob", () => {
  it("throws JobParseError for empty input", () => {
    expect(() => parseJob("")).toThrow(JobParseError);
    expect(() => parseJob("   ")).toThrow(JobParseError);
  });

  it("throws JobParseError for text shorter than 40 characters", () => {
    expect(() => parseJob("Short job post")).toThrow(JobParseError);
  });

  it("extracts title and company from Bodil Energi posting", () => {
    const job = parseJob(BODIL_JOB);

    expect(job.title).toContain("Junior Software Developer");
    expect(job.company).toBe("Bodil Energi");
    expect(job.location).toMatch(/Hybrid|Copenhagen|Remote/i);
  });

  it("extracts skills and tools from technology mentions", () => {
    const job = parseJob(BODIL_JOB);

    expect(job.skills).toEqual(
      expect.arrayContaining(["JavaScript", "React"])
    );
    expect(job.tools).toEqual(expect.arrayContaining(["Docker"]));
    expect(job.skills).toEqual(expect.arrayContaining(["Git"]));
  });

  it("extracts requirements and responsibilities sections", () => {
    const job = parseJob(BODIL_JOB);

    expect(job.requirements.length).toBeGreaterThan(0);
    expect(job.responsibilities.length).toBeGreaterThan(0);
  });

  it("builds ATS keywords from skills, tools, and context", () => {
    const job = parseJob(BODIL_JOB);

    expect(job.atsKeywords.length).toBeGreaterThan(0);
    expect(job.atsKeywords).toEqual(
      expect.arrayContaining(["React", "JavaScript"])
    );
  });

  it("uses sourceUrl hostname as company fallback", () => {
    const job = parseJob(
      `Software Engineer\n\nRequirements:\n- Experience with Python and SQL for data pipelines\n- Strong communication skills and team collaboration`,
      "https://www.bodil.energy/jobs/123"
    );

    expect(job.sourceUrl).toBe("https://www.bodil.energy/jobs/123");
    expect(job.company.toLowerCase()).toContain("bodil");
  });

  it("labels undetected fields explicitly", () => {
    const job = parseJob(
      `We need someone great.\n\nRequirements:\n- Must be passionate about building software products\n- Strong problem solving and analytical thinking skills`
    );

    expect(job.company).toBe("Not detected");
  });

  it("parses pipe-separated title and company", () => {
    const job = parseJob(MINIMAL_JOB);

    expect(job.title).toBe("Frontend Developer");
    expect(job.company).toBe("Acme Corp");
  });

  it("preserves rawText", () => {
    const job = parseJob(MINIMAL_JOB);
    expect(job.rawText).toBe(MINIMAL_JOB.trim());
  });
});

describe("isLikelyUrl", () => {
  it("returns true for http and https URLs", () => {
    expect(isLikelyUrl("https://thehub.io/jobs/123")).toBe(true);
    expect(isLikelyUrl("http://example.com")).toBe(true);
  });

  it("returns false for non-URLs", () => {
    expect(isLikelyUrl("not a url")).toBe(false);
    expect(isLikelyUrl("")).toBe(false);
  });
});
