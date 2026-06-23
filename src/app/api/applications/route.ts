import { NextResponse } from "next/server";
import { normalizeApplication } from "@/lib/normalizeStoredData";
import {
  readApplicationsFromDisk,
  replaceApplicationsOnDisk,
  upsertApplicationOnDisk,
} from "@/lib/server/applicationsStore";
import type { Application } from "@/types";

export async function GET() {
  try {
    const applications = await readApplicationsFromDisk();
    return NextResponse.json({ applications });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load applications";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { application?: Application };
    const normalized = normalizeApplication(body.application);

    if (!normalized) {
      return NextResponse.json(
        { error: "Valid application object is required" },
        { status: 400 }
      );
    }

    const applications = await upsertApplicationOnDisk(normalized);
    return NextResponse.json({ applications, application: normalized });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save application";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Replace all applications (import backup). */
export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { applications?: unknown[] };

    if (!Array.isArray(body.applications)) {
      return NextResponse.json(
        { error: "applications array is required" },
        { status: 400 }
      );
    }

    const applications = body.applications
      .map(normalizeApplication)
      .filter((app): app is Application => app !== null);

    if (body.applications.length > 0 && applications.length === 0) {
      return NextResponse.json(
        { error: "No valid applications found in backup" },
        { status: 400 }
      );
    }

    const saved = await replaceApplicationsOnDisk(applications);
    return NextResponse.json({ applications: saved });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to import applications";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
