import { describe, expect, it } from "vitest";
import {
  AutoApplyRequestSchema,
  isSensitiveActionEnabled,
  JobnetLogRequestSchema,
  LinkedInNetworkRequestSchema,
  PublicHttpUrlSchema,
  ScrapeRequestSchema,
  SendEmailRequestSchema,
} from "@/lib/server/sensitiveActions";

describe("isSensitiveActionEnabled", () => {
  it("keeps local development behavior enabled", () => {
    expect(isSensitiveActionEnabled({ NODE_ENV: "development" })).toBe(true);
  });

  it("defaults to disabled in production", () => {
    expect(isSensitiveActionEnabled({ NODE_ENV: "production" })).toBe(false);
  });

  it("requires an explicit production opt-in", () => {
    expect(
      isSensitiveActionEnabled({
        NODE_ENV: "production",
        JOB_AGENT_ENABLE_SENSITIVE_ACTIONS: "true",
      })
    ).toBe(true);
  });
});

describe("SendEmailRequestSchema", () => {
  it("accepts one valid recipient and bounded content", () => {
    expect(
      SendEmailRequestSchema.safeParse({
        to: "recruiter@example.com",
        subject: "Application follow-up",
        text: "Hello, I am following up on my application.",
      }).success
    ).toBe(true);
  });

  it("rejects invalid recipients, header injection, and extra fields", () => {
    expect(
      SendEmailRequestSchema.safeParse({
        to: "one@example.com, two@example.com",
        subject: "Hello\r\nBcc: victim@example.com",
        text: "Message",
      }).success
    ).toBe(false);
    expect(
      SendEmailRequestSchema.safeParse({
        to: "recruiter@example.com",
        subject: "Hello",
        text: "Message",
        html: "<strong>Unexpected</strong>",
      }).success
    ).toBe(false);
  });
});

describe("PublicHttpUrlSchema", () => {
  it("accepts public HTTP and HTTPS URLs", () => {
    expect(PublicHttpUrlSchema.safeParse("https://jobs.example.com/apply").success).toBe(
      true
    );
    expect(PublicHttpUrlSchema.safeParse("http://example.com/job/123").success).toBe(
      true
    );
    expect(PublicHttpUrlSchema.safeParse("https://fcjobs.example/apply").success).toBe(
      true
    );
  });

  it.each([
    "file:///etc/passwd",
    "http://localhost:3000/admin",
    "http://127.0.0.1/private",
    "http://10.0.0.1/private",
    "http://172.16.0.1/private",
    "http://192.168.1.1/private",
    "http://[::1]/private",
    "http://[fd00::1]/private",
    "http://[::ffff:127.0.0.1]/private",
    "https://user:pass@example.com/apply",
  ])("rejects unsafe target %s", (url) => {
    expect(PublicHttpUrlSchema.safeParse(url).success).toBe(false);
  });

  it("validates the persona identifier", () => {
    expect(
      AutoApplyRequestSchema.safeParse({
        applyUrl: "https://jobs.example.com/apply",
        personaId: "../private",
      }).success
    ).toBe(false);
  });
});

describe("browser action request schemas", () => {
  it("bounds Jobnet log fields and validates optional URLs", () => {
    expect(
      JobnetLogRequestSchema.safeParse({
        jobTitle: "Software Engineer",
        company: "Example",
        url: "https://example.com/jobs/1",
      }).success
    ).toBe(true);
    expect(
      JobnetLogRequestSchema.safeParse({
        jobTitle: "Software Engineer",
        company: "Example",
        url: "http://127.0.0.1/private",
      }).success
    ).toBe(false);
  });

  it("rejects oversized LinkedIn company names", () => {
    expect(
      LinkedInNetworkRequestSchema.safeParse({ company: "x".repeat(201) }).success
    ).toBe(false);
  });

  it("caps scraper result limits", () => {
    expect(ScrapeRequestSchema.safeParse({ query: "React", limit: 10 }).success).toBe(
      true
    );
    expect(ScrapeRequestSchema.safeParse({ query: "React", limit: 500 }).success).toBe(
      false
    );
  });
});
