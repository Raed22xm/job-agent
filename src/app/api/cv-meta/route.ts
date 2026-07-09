import { NextResponse } from "next/server";
import { resolvePersonaId } from "@/lib/cvLanguage";
import { getPersona } from "@/lib/personaManager";

/**
 * Returns only the non-sensitive metadata fields from master CV
 * (languages and certifications) for display in the CV preview.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const personaId = resolvePersonaId(searchParams.get("personaId") ?? undefined);
    const cv = getPersona(personaId);
    if (!cv) {
      return NextResponse.json({ languages: [], certifications: [], portfolio: "" });
    }
    return NextResponse.json({
      languages: cv.languages ?? [],
      certifications: cv.certifications ?? [],
      portfolio: cv.personalInfo.portfolio ?? "",
    });
  } catch {
    return NextResponse.json({ languages: [], certifications: [], portfolio: "" });
  }
}
