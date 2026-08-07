import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/humanize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/humanize", () => {
  afterEach(() => { delete process.env.OPENAI_API_KEY; });

  it("returns a local replacement when AI is unavailable", async () => {
    const response = await POST(request({
      text: "I am writing to express my interest in the Software Engineer position.",
      context: "email",
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.mode).toBe("local");
    expect(body.humanizedText).toContain("Software Engineer");
    expect(body.detectedIssues).toContain("Formulaic opener");
  });

  it.each([
    [{ text: "Valid text", context: "invalid" }],
    [{ text: "" }],
    [{ text: "x".repeat(20_001) }],
    [{ text: "Valid text", voiceSample: "x".repeat(4_001) }],
    [{ text: "Valid text", extra: true }],
  ])("rejects invalid boundary payload %#", async (body) => {
    const response = await POST(request(body));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: "Invalid humanize request" });
  });
});
