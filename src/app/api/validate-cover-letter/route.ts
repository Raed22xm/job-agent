import { NextResponse } from "next/server";
import { personaIdToLanguage, resolvePersonaId } from "@/lib/cvLanguage";
import { validateCoverLetter } from "@/lib/cv/validateCV";
import { getPersona } from "@/lib/personaManager";
import {
  normalizeGeneratedCoverLetter,
  normalizeParsedJob,
} from "@/lib/normalizeStoredData";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      generatedCoverLetter?: unknown;
      job?: unknown;
      personaId?: string;
    };
    const letter = normalizeGeneratedCoverLetter(body.generatedCoverLetter);
    const job = normalizeParsedJob(body.job);

    if (!letter || !job) {
      return NextResponse.json(
        { error: "Valid generatedCoverLetter and job objects are required" },
        { status: 400 }
      );
    }

    const personaId = resolvePersonaId(body.personaId);
    const master = getPersona(personaId);
    if (!master) {
      return NextResponse.json(
        { error: `No CV persona found for "${personaId}"` },
        { status: 404 }
      );
    }

    const validation = validateCoverLetter(
      letter,
      master,
      job,
      personaIdToLanguage(personaId)
    );
    return NextResponse.json({ validation });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Cover letter validation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
