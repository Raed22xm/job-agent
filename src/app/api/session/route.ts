import { NextResponse } from "next/server";
import {
  AnalysisSessionInputSchema,
  MAX_SESSION_PAYLOAD_BYTES,
  readSessionFromDisk,
  writeSessionToDisk,
} from "@/lib/server/sessionStore";

export async function GET() {
  try {
    const session = await readSessionFromDisk();
    return NextResponse.json({ session });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const declaredLength = Number(request.headers.get("content-length"));
    if (
      Number.isFinite(declaredLength) &&
      declaredLength > MAX_SESSION_PAYLOAD_BYTES
    ) {
      return NextResponse.json(
        { error: "Session payload is too large" },
        { status: 413 }
      );
    }

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_SESSION_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: "Session payload is too large" },
        { status: 413 }
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON" },
        { status: 400 }
      );
    }

    const validation = AnalysisSessionInputSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid session payload",
          issues: validation.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const session = await writeSessionToDisk(validation.data);
    return NextResponse.json({ session });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
