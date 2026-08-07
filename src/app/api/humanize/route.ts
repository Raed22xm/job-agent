import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { humanizeText } from "@/lib/humanizeText";

const HumanizeRequestSchema = z.object({
  text: z.string().trim().min(1).max(20_000),
  context: z.enum(["cv", "cover-letter", "email", "general"]).default("general"),
  voiceSample: z.string().trim().max(4_000).optional(),
}).strict();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = HumanizeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid humanize request", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const result = await humanizeText(parsed.data.text, {
      context: parsed.data.context,
      voiceSample: parsed.data.voiceSample,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to humanize text";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
