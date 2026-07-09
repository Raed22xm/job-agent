import { NextResponse } from "next/server";
import { resolvePersonaId } from "@/lib/cvLanguage";
import { validateGeneratedCV } from "@/lib/cv/validateCV";
import { getPersona } from "@/lib/personaManager";
import { normalizeGeneratedCV } from "@/lib/normalizeStoredData";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      generatedCV?: unknown;
      personaId?: string;
    };
    const generatedCV = normalizeGeneratedCV(body.generatedCV);
    const personaId = resolvePersonaId(body.personaId);

    if (!generatedCV) {
      return NextResponse.json(
        { error: "Valid generatedCV object is required" },
        { status: 400 }
      );
    }

    const masterCv = getPersona(personaId);
    if (!masterCv) {
      return NextResponse.json(
        { error: `No CV persona found for "${personaId}"` },
        { status: 404 }
      );
    }

    const validation = validateGeneratedCV(generatedCV, masterCv);
    return NextResponse.json({ validation });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "CV validation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
