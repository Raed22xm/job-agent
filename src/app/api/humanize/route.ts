import { NextRequest, NextResponse } from "next/server";
import { humanizeText } from "@/lib/humanizeText";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { text, context = "general", voiceSample } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Parameter 'text' is required" },
        { status: 400 }
      );
    }

    const result = await humanizeText(text, {
      context,
      voiceSample,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to humanize text";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
