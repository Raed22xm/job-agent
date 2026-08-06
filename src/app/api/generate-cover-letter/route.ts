import { NextResponse } from "next/server";
import { validateCoverLetter } from "@/lib/cv/validateCV";
import { generateCoverLetter } from "@/lib/generateCoverLetter";
import { personaIdToLanguage, resolvePersonaId } from "@/lib/cvLanguage";
import { getPersona } from "@/lib/personaManager";
import { normalizeParsedJob } from "@/lib/normalizeStoredData";

/** Local heuristic cover letter regeneration. Use POST /api/analyze-job for the full AI pipeline. */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      job?: unknown;
      personaId?: string;
    };
    const job = normalizeParsedJob(body.job);

    if (!job?.rawText) {
      return NextResponse.json({ error: "Valid job with rawText is required" }, { status: 400 });
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
    const generatedCoverLetter = generateCoverLetter(cv, job, language);
    const validation = validateCoverLetter(
      generatedCoverLetter,
      cv,
      job,
      language
    );

    return NextResponse.json({
      mode: "local-heuristic",
      note: "For AI-enhanced tailoring, use POST /api/analyze-job.",
      generatedCoverLetter,
      validation,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Cover letter generation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
