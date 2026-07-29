import { describe, expect, it } from "vitest";
import { POST as analyzeJob } from "@/app/api/analyze-job/route";
import { PUT as importApplications } from "@/app/api/applications/route";
import { POST as fetchJob } from "@/app/api/fetch-job/route";

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
});
