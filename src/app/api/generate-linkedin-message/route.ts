import { NextResponse } from "next/server";
import { generateLinkedInMessage } from "@/lib/generateLinkedInMessage";
import { getMasterCV } from "@/lib/matchCV";
import {
  normalizeMatchResult,
  normalizeParsedJob,
} from "@/lib/normalizeStoredData";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      job?: unknown;
      match?: unknown;
    };

    const job = normalizeParsedJob(body.job);
    if (!job) {
      return NextResponse.json(
        { error: "Valid job object is required" },
        { status: 400 }
      );
    }

    const match = normalizeMatchResult(body.match);
    const draft = generateLinkedInMessage(getMasterCV(), job, match);

    return NextResponse.json({ draft });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "LinkedIn draft generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
