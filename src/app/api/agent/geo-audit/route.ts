import { getProvider } from "@/lib/ai/provider";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { getPersona } from "@/lib/personaManager";
import type { MasterCV } from "@/types";
import {
  fallbackGeoAudit,
  scoreLocation,
  buildGeoAuditPrompt,
  type LocationScore,
  type GeoAuditResult,
} from "@/lib/agent/geoAudit";

const LOCATION_META_IDS = [
  "copenhagen",
  "aarhus",
  "odense",
  "aalborg",
  "remote_eu",
  "remote_global",
];

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  
  const personaId = body.personaId;
  const cv = getPersona(personaId);
  
  if (!cv) {
    return NextResponse.json({ error: "No CV persona found" }, { status: 400 });
  }

  const { query, location } = body;
  const apiKey = process.env.OPENAI_API_KEY;

  // Run local scoring regardless of AI availability
  const allSkills = [...cv.skills, ...cv.tools];

  const locations: LocationScore[] = LOCATION_META_IDS.map((id) => {
    const { score, topSkills, estimatedRoles } = scoreLocation(allSkills, id);
    // Re-import meta inline to avoid circular deps
    return {
      id,
      demandScore: score,
      estimatedRoles,
      topMatchingSkills: topSkills,
    } as Partial<LocationScore> as LocationScore; // filled by fallbackGeoAudit
  });

  // Use fallback to get the complete, fully typed result first
  const fallback = fallbackGeoAudit(cv);

  if (!apiKey) {
    return NextResponse.json(fallback);
  }

  // Enrich with AI narrative
  try {
    const { model } = getProvider();
  
    const { text } = await generateText({
      model,
      prompt: buildGeoAuditPrompt(cv, fallback.locations),
      temperature: 0.4,
      maxOutputTokens: 150,
    });

    const result: GeoAuditResult = {
      ...fallback,
      aiNarrative: text.trim(),
      mode: "ai",
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ...fallback, mode: "local-fallback" });
  }
}
