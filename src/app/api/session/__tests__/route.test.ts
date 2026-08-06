import { beforeEach, describe, expect, it, vi } from "vitest";

const { writeSessionToDisk } = vi.hoisted(() => ({
  writeSessionToDisk: vi.fn(),
}));

vi.mock("@/lib/server/sessionStore", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/server/sessionStore")>();
  return {
    ...original,
    writeSessionToDisk,
  };
});

import {
  MAX_SESSION_PAYLOAD_BYTES,
  sessionFilePath,
} from "@/lib/server/sessionStore";
import { PUT } from "../route";

const validPayload = {
  jobUrl: "https://example.com/jobs/1",
  jobDescription: "A job description",
  parsedJob: null,
  matchResult: null,
  generatedCV: null,
  generatedCoverLetter: null,
  originalCV: null,
  originalCoverLetter: null,
  analysisMode: "local",
  cvLanguage: "english",
};

function putRequest(body: string, headers?: HeadersInit) {
  return new Request("http://localhost/api/session", {
    method: "PUT",
    body,
    headers,
  });
}

describe("PUT /api/session", () => {
  beforeEach(() => {
    writeSessionToDisk.mockReset();
    writeSessionToDisk.mockImplementation(async (snapshot) => ({
      ...snapshot,
      updatedAt: "2026-07-28T12:00:00.000Z",
    }));
  });

  it("validates and persists a complete session snapshot", async () => {
    const response = await PUT(putRequest(JSON.stringify(validPayload)));

    expect(response.status).toBe(200);
    expect(writeSessionToDisk).toHaveBeenCalledWith(validPayload);
    await expect(response.json()).resolves.toMatchObject({
      session: {
        jobDescription: "A job description",
        updatedAt: "2026-07-28T12:00:00.000Z",
      },
    });
  });

  it("restores a safe empty headline for legacy stored cover letters", async () => {
    const legacyLetter = {
      greeting: "Dear Acme team,",
      paragraphs: ["One", "Two", "Three"],
      closing: "Sincerely,",
      signature: "Test User",
    };
    const response = await PUT(
      putRequest(
        JSON.stringify({
          ...validPayload,
          generatedCoverLetter: legacyLetter,
          originalCoverLetter: legacyLetter,
        })
      )
    );

    expect(response.status).toBe(200);
    expect(writeSessionToDisk).toHaveBeenCalledWith(
      expect.objectContaining({
        generatedCoverLetter: expect.objectContaining({ headline: "" }),
        originalCoverLetter: expect.objectContaining({ headline: "" }),
      })
    );
  });

  it("rejects malformed JSON without writing", async () => {
    const response = await PUT(putRequest("{"));

    expect(response.status).toBe(400);
    expect(writeSessionToDisk).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      error: "Request body must be valid JSON",
    });
  });

  it("rejects invalid nested session data with field-level issues", async () => {
    const response = await PUT(
      putRequest(
        JSON.stringify({
          ...validPayload,
          parsedJob: { title: "Developer" },
        })
      )
    );

    expect(response.status).toBe(400);
    expect(writeSessionToDisk).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error: "Invalid session payload",
      issues: expect.arrayContaining([
        expect.objectContaining({ path: "parsedJob.company" }),
      ]),
    });
  });

  it("rejects payloads whose declared size exceeds the limit", async () => {
    const response = await PUT(
      putRequest("{}", {
        "content-length": String(MAX_SESSION_PAYLOAD_BYTES + 1),
      })
    );

    expect(response.status).toBe(413);
    expect(writeSessionToDisk).not.toHaveBeenCalled();
  });

  it("rejects oversized payloads when content-length is absent", async () => {
    const response = await PUT(
      putRequest(
        JSON.stringify({
          ...validPayload,
          jobDescription: "x".repeat(MAX_SESSION_PAYLOAD_BYTES),
        })
      )
    );

    expect(response.status).toBe(413);
    expect(writeSessionToDisk).not.toHaveBeenCalled();
  });
});

describe("sessionFilePath", () => {
  it("allows browser tests to isolate their session from local user data", () => {
    const previous = process.env.JOB_AGENT_SESSION_FILE;
    process.env.JOB_AGENT_SESSION_FILE = "test-results/session.json";

    try {
      expect(sessionFilePath("/workspace")).toBe(
        "/workspace/test-results/session.json"
      );
    } finally {
      if (previous === undefined) {
        delete process.env.JOB_AGENT_SESSION_FILE;
      } else {
        process.env.JOB_AGENT_SESSION_FILE = previous;
      }
    }
  });
});
