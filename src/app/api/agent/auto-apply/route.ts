import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import { getPersona } from "@/lib/personaManager";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { applyUrl, personaId = "default" } = body;

    if (!applyUrl) {
      return NextResponse.json({ error: "applyUrl is required" }, { status: 400 });
    }

    const cv = getPersona(personaId);
    if (!cv) {
      return NextResponse.json({ error: "Persona not found" }, { status: 400 });
    }

    // Launch visible browser so user can review the application before submitting
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log(`[Auto-Apply] Navigating to ${applyUrl}`);
    await page.goto(applyUrl);

    // Give it a moment to load
    await page.waitForTimeout(3000);

    // Extremely basic heuristics for Greenhouse / Lever
    const fillField = async (selectors: string[], value: string) => {
      for (const sel of selectors) {
        try {
          const el = await page.$(sel);
          if (el) {
            await el.fill(value);
            return true; // Stop after first successful fill
          }
        } catch (e) {
          // ignore
        }
      }
      return false;
    };

    // Fill First Name
    await fillField(
      ['input[name="first_name"]', 'input[id="first_name"]', 'input[name="name"]'],
      cv.personalInfo.fullName.split(" ")[0]
    );

    // Fill Last Name
    await fillField(
      ['input[name="last_name"]', 'input[id="last_name"]'],
      cv.personalInfo.fullName.split(" ").slice(1).join(" ")
    );

    // Fill Email
    await fillField(
      ['input[name="email"]', 'input[id="email"]', 'input[type="email"]'],
      cv.personalInfo.email
    );

    // Fill Phone
    await fillField(
      ['input[name="phone"]', 'input[id="phone"]', 'input[type="tel"]'],
      cv.personalInfo.phone
    );

    // Fill LinkedIn
    await fillField(
      ['input[name="urls[LinkedIn]"]', 'input[id="linkedin"]'],
      cv.personalInfo.linkedin || ""
    );

    // Fill GitHub
    await fillField(
      ['input[name="urls[GitHub]"]', 'input[id="github"]'],
      cv.personalInfo.portfolio || ""
    );

    console.log("[Auto-Apply] Finished filling basic fields. Awaiting user review.");

    // We do NOT close the browser, leaving it open for the user to review and manually submit
    // Return success to the UI
    return NextResponse.json({
      success: true,
      message: "Browser opened and fields populated. Please review and click Submit.",
    });
  } catch (err: any) {
    console.error("Auto-Apply Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
