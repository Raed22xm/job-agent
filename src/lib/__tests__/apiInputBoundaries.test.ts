import { describe, expect, it } from "vitest";
import { POST as analyzeJob } from "@/app/api/analyze-job/route";
import { PUT as importApplications } from "@/app/api/applications/route";
import { POST as fetchJob } from "@/app/api/fetch-job/route";
import { POST as validateCoverLetter } from "@/app/api/validate-cover-letter/route";
import { generateCoverLetter } from "@/lib/generateCoverLetter";
import { getPersona } from "@/lib/personaManager";
import type { ParsedJob } from "@/types";

function jsonRequest(url: string, method: string, body: unknown): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("API input boundaries", () => {
  it("rejects job descriptions that are too short to analyze", async () => {
    const response = await analyzeJob(
      jsonRequest("http://localhost/api/analyze-job", "POST", {
        jobDescription: "Too short",
      })
    );

    expect(response.status).toBe(400);
  });

  it("rejects non-http job URLs", async () => {
    const response = await fetchJob(
      jsonRequest("http://localhost/api/fetch-job", "POST", {
        url: "file:///etc/passwd",
      })
    );

    expect(response.status).toBe(400);
  });

  it("bounds application backup imports", async () => {
    const response = await importApplications(
      jsonRequest("http://localhost/api/applications", "PUT", {
        applications: Array.from({ length: 1_001 }, () => null),
      })
    );

    expect(response.status).toBe(413);
  });

  it("rejects missing cover-letter validation inputs", async () => {
    const response = await validateCoverLetter(
      jsonRequest("http://localhost/api/validate-cover-letter", "POST", {})
    );

    expect(response.status).toBe(400);
  });

  it("validates a canonical Danish motivation against the Danish persona", async () => {
    const cv = getPersona("danish");
    expect(cv).not.toBeNull();
    if (!cv) throw new Error("Missing Danish persona");
    const job: ParsedJob = {
      title: "Softwareudvikler",
      company: "Eksempel ApS",
      location: "København",
      responsibilities: ["Udvikle React-løsninger sammen med teamet."],
      requirements: ["React"],
      tools: [],
      skills: ["React"],
      atsKeywords: ["React"],
      rawText: "Softwareudvikler hos Eksempel ApS med ansvar for React-løsninger.",
    };
    const letter = generateCoverLetter(cv, job, "danish");

    const response = await validateCoverLetter(
      jsonRequest("http://localhost/api/validate-cover-letter", "POST", {
        generatedCoverLetter: letter,
        job,
        personaId: "danish",
      })
    );
    const body = (await response.json()) as { validation?: { valid: boolean } };

    expect(response.status).toBe(200);
    expect(body.validation?.valid).toBe(true);
  });
});
