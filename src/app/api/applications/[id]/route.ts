import { NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteApplicationOnDisk,
  patchApplicationOnDisk,
} from "@/lib/server/applicationsStore";

type RouteContext = { params: Promise<{ id: string }> };

const ApplicationPatchSchema = z
  .object({
    status: z
      .enum(["draft", "ready", "applied", "interview", "rejected", "offer"])
      .optional(),
    notes: z.string().optional(),
    deadline: z.string().optional(),
    cvVersion: z.string().optional(),
    coverLetterStatus: z.enum(["none", "draft", "ready", "sent"]).optional(),
    recruiterContact: z.string().optional(),
    appliedDate: z.string().optional(),
    followUpDate: z.string().optional(),
  })
  .strict();

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const validation = ApplicationPatchSchema.safeParse(await request.json());

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid application patch",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const updated = await patchApplicationOnDisk(id, validation.data);
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
