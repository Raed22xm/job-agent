import { NextResponse } from "next/server";
import {
  personaIdToLanguage,
  resolvePersonaId,
} from "@/lib/cvLanguage";
import { validateGeneratedCV } from "@/lib/cv/validateCV";
import { generateCoverLetter } from "@/lib/generateCoverLetter";
import { generateCV } from "@/lib/generateCV";
import { matchCV } from "@/lib/matchCV";
import { normalizeParsedJob } from "@/lib/normalizeStoredData";
import { getPersona } from "@/lib/personaManager";

/** Regenerate CV + cover letter for an already-parsed job and persona. */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      parsedJob?: unknown;
      personaId?: string;
    };

    const parsedJob = normalizeParsedJob(body.parsedJob);
    if (!parsedJob) {
      return NextResponse.json(
        { error: "Valid parsedJob is required" },
        { status: 400 }
      );
    }

    const personaId = resolvePersonaId(body.personaId);
    const cv = getPersona(personaId);
    if (!cv) {
      return NextResponse.json(
        { error: `No CV persona found for "${personaId}"` },
        { status: 404 }
      );
    }

    const language = personaIdToLanguage(personaId);
    const match = matchCV(parsedJob, cv);
    const generatedCV = generateCV(cv, parsedJob, match);
    const generatedCoverLetter = generateCoverLetter(cv, parsedJob, language);
    const validation = validateGeneratedCV(generatedCV, cv);

    return NextResponse.json({
      mode: "local" as const,
      personaId,
      cvLanguage: language,
      match,
      generatedCV,
      generatedCoverLetter,
      validation,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Regeneration failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
