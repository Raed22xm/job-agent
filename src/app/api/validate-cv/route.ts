import { NextResponse } from "next/server";
import { validateGeneratedCV } from "@/lib/cv/validateCV";
import { getMasterCV } from "@/lib/matchCV";
import { normalizeGeneratedCV } from "@/lib/normalizeStoredData";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { generatedCV?: unknown };
    const generatedCV = normalizeGeneratedCV(body.generatedCV);

    if (!generatedCV) {
      return NextResponse.json(
        { error: "Valid generatedCV object is required" },
        { status: 400 }
      );
    }

    const validation = validateGeneratedCV(generatedCV, getMasterCV());
    return NextResponse.json({ validation });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "CV validation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
