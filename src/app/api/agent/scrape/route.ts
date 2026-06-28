import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { query = "frontend", limit = 10 } = body;

    // Launch headless browser for scraping
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Navigate to TheHub.io
    const searchUrl = `https://thehub.io/jobs?search=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: "networkidle" });

    // Wait for job cards to load
    try {
      await page.waitForSelector(".job-card", { timeout: 10000 });
    } catch (e) {
      // If no jobs found, return empty array
      await browser.close();
      return NextResponse.json({ jobs: [] });
    }

    // Extract job data
    const scrapedJobs = await page.evaluate((limit) => {
      const cards = Array.from(document.querySelectorAll(".job-card")).slice(0, limit);
      return cards.map((card) => {
        const titleEl = card.querySelector(".job-card__title");
        const companyEl = card.querySelector(".job-card__company-name");
        const linkEl = card.querySelector("a.job-card__link");
        
        return {
          id: `thehub-${Math.random().toString(36).substring(2, 9)}`,
          title: titleEl?.textContent?.trim() || "Unknown Title",
          company: companyEl?.textContent?.trim() || "Unknown Company",
          url: linkEl ? (linkEl as HTMLAnchorElement).href : "",
          location: "Denmark",
          tags: ["TheHub", "Startup"],
          source: "thehub",
        };
      });
    }, limit);

    await browser.close();

    return NextResponse.json({ jobs: scrapedJobs });
  } catch (err: any) {
    console.error("Scraper Subagent Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
