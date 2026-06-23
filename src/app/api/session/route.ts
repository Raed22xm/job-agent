import { NextResponse } from "next/server";
import {
  readSessionFromDisk,
  writeSessionToDisk,
  type AnalysisSessionSnapshot,
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
    const body = (await request.json()) as Omit<
      AnalysisSessionSnapshot,
      "updatedAt"
    >;

    const session = await writeSessionToDisk(body);
    return NextResponse.json({ session });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
