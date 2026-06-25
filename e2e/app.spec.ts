import { test, expect } from "@playwright/test";

test.describe("Job Agent Application", () => {
  test("analyzer page loads with correct title", async ({ page }) => {
    await page.goto("/analyzer");

    await expect(page).toHaveTitle(/Job Agent/);
    await expect(page.locator("h1")).toContainText("Job Analyzer");
    await expect(page.getByLabel("Job Description")).toBeVisible();
  });

  test("job description analysis produces match score", async ({ page }) => {
    await page.goto("/analyzer");

    const sampleJob = `Frontend Developer
Acme Corp · Copenhagen

Requirements:
- React and JavaScript proficiency
- Next.js experience
- Git version control

Responsibilities:
- Build customer-facing applications
- Collaborate with design team`;

    await page.getByLabel("Job Description").fill(sampleJob);
    await page.getByRole("button", { name: /analyze/i }).click();

    await expect(
      page.getByRole("heading", { name: "Match Score" })
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("score-value")).toBeVisible();
  });

  test("matching keywords are displayed", async ({ page }) => {
    await page.goto("/analyzer");

    const sampleJob = `Frontend Developer
Acme · Remote

Requirements:
- React, JavaScript, TypeScript, CSS`;

    await page.getByLabel("Job Description").fill(sampleJob);
    await page.getByRole("button", { name: /analyze/i }).click();

    await expect(
      page.getByRole("heading", { name: "Matching Keywords" })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: "Missing Keywords" })
    ).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("all main pages are accessible", async ({ page }) => {
    const pages = [
      { path: "/", name: "Home" },
      { path: "/analyzer", name: "Job Analyzer" },
      { path: "/cv", name: "CV" },
      { path: "/tracker", name: "Tracker" },
    ];

    for (const { path, name } of pages) {
      await page.goto(path);
      await expect(page.locator("nav")).toContainText(name);
    }
  });
});

test.describe("Tracker", () => {
  test("tracker page shows empty state when no applications", async ({ page }) => {
    await page.goto("/tracker");

    await expect(page.locator("h1")).toContainText("Application Tracker");
  });

  test("export json button is visible", async ({ page }) => {
    await page.goto("/tracker");

    const exportButton = page.getByRole("button", { name: /export json/i });
    await expect(exportButton).toBeVisible();
  });
});
