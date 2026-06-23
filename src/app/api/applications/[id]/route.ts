import { NextResponse } from "next/server";
import {
  deleteApplicationOnDisk,
  patchApplicationOnDisk,
} from "@/lib/server/applicationsStore";
import type { Application } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const patch = (await request.json()) as Partial<
      Pick<
        Application,
        | "status"
        | "notes"
        | "deadline"
        | "cvVersion"
        | "coverLetterStatus"
        | "recruiterContact"
        | "appliedDate"
        | "followUpDate"
      >
    >;

    const updated = await patchApplicationOnDisk(id, patch);
    if (!updated) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json({ application: updated });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update application";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const applications = await deleteApplicationOnDisk(id);
    return NextResponse.json({ applications });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete application";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
