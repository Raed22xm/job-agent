import { NextResponse } from "next/server";
import { getMasterCV } from "@/lib/matchCV";

/**
 * Returns only the non-sensitive metadata fields from master CV
 * (languages and certifications) for display in the CV preview.
 */
export async function GET() {
  try {
    const cv = getMasterCV();
    return NextResponse.json({
      languages: cv.languages ?? [],
      certifications: cv.certifications ?? [],
    });
  } catch {
    return NextResponse.json({ languages: [], certifications: [] });
  }
}
