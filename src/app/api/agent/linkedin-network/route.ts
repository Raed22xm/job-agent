import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import { logger } from "@/lib/logger";
import { generateObject } from "ai";
import { z } from "zod";
import { getProvider } from "@/lib/ai/provider";

const NetworkOutreachSchema = z.object({
  coffeeChatScript: z.string().describe("A professional, casual LinkedIn connection request or InMail asking for a coffee chat regarding the target company."),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { company = "Google" } = body;

    // Launch visible browser so user can log in if needed
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Navigate to LinkedIn Search
    const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(company)}`;
    await page.goto(searchUrl);

    // We give the user 60 seconds to log in and ensure search results appear
    try {
      await page.waitForSelector(".reusable-search__result-container", { timeout: 60000 });
    } catch (e) {
      await browser.close();
      return NextResponse.json({ error: "Did not reach search results in time. Please log in." }, { status: 408 });
    }

    // Extract the top 5 profiles
    const profiles = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll(".reusable-search__result-container")).slice(0, 5);
      return cards.map(card => {
        const nameEl = card.querySelector(".entity-result__title-text");
        const titleEl = card.querySelector(".entity-result__primary-subtitle");
        const linkEl = card.querySelector("a.app-aware-link");
        
        return {
          name: nameEl?.textContent?.replace(/\n/g, "").trim() || "Unknown",
          title: titleEl?.textContent?.replace(/\n/g, "").trim() || "Unknown Role",
          url: linkEl ? (linkEl as HTMLAnchorElement).href : "",
        };
      });
    });

    await browser.close();

    // 2. Generate Outreach Script for the first profile
    let script = "";
    if (profiles.length > 0) {
      const { model } = getProvider();
      const prompt = `
Generate a professional, casual LinkedIn connection request message (max 300 characters) 
asking ${profiles[0].name} (${profiles[0].title} at ${company}) for a quick coffee chat to learn about their experience at ${company}.
`;
      const { object } = await generateObject({
        model,
        schema: NetworkOutreachSchema,
        prompt,
      });
      script = object.coffeeChatScript;
    }

    return NextResponse.json({
      success: true,
      company,
      profiles,
      suggestedScript: script,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "LinkedIn network error";
    logger.error("LinkedIn Subagent Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
