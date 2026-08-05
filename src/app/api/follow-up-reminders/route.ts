import { NextResponse } from "next/server";
import { getPersona } from "@/lib/personaManager";
import {
  getApplicationsNeedingFollowUp,
  generateFollowUpEmail,
} from "@/lib/trackerReminders";
import type { Application } from "@/types";

/**
 * GET /api/follow-up-reminders
 * Returns applications needing follow-up (7+ days since applied) with auto-generated email drafts.
 */
export async function GET() {
  try {
    // Fetch applications from SQLite via the existing applications API
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/applications`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch applications" },
        { status: 500 }
      );
    }

    const data = (await res.json()) as { applications?: Application[] };
    const applications = Array.isArray(data.applications)
      ? data.applications
      : [];

    const needsFollowUp = getApplicationsNeedingFollowUp(applications);

    if (needsFollowUp.length === 0) {
      return NextResponse.json({ reminders: [], count: 0 });
    }

    // Get CV data for personalization
    const cv = getPersona();
    const candidateName = cv?.personalInfo.fullName ?? "Raed Ibrahim";
    const topSkills = cv?.skills.slice(0, 3) ?? [];
    const portfolioUrl = cv?.personalInfo.portfolio;

    const reminders = needsFollowUp.map((app) =>
      generateFollowUpEmail(app, candidateName, topSkills, portfolioUrl)
    );

    return NextResponse.json({ reminders, count: reminders.length });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate reminders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
