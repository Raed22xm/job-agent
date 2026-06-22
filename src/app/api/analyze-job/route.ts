import { NextResponse } from "next/server";
import { getAIConfig } from "@/lib/ai/providers";
import { parseMasterCV, ParsedJobSchema } from "@/lib/ai/schemas";
import { generateCoverLetter } from "@/lib/generateCoverLetter";
import { generateCV } from "@/lib/generateCV";
import { getMasterCV, matchCV } from "@/lib/matchCV";
import { parseJob } from "@/lib/parseJob";
import { validateGeneratedCV } from "@/lib/cv/validateCV";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      jobDescription?: string;
      sourceUrl?: string;
    };

    const jobDescription = body.jobDescription?.trim();
    if (!jobDescription) {
      return NextResponse.json(
        { error: "jobDescription is required" },
        { status: 400 }
      );
    }

    const cv = getMasterCV();
    const cvValidation = parseMasterCV(cv);
    if (!cvValidation.success) {
      return NextResponse.json(
        { error: "Master CV data is invalid", details: cvValidation.error.flatten() },
        { status: 500 }
      );
    }

    const job = parseJob(jobDescription, body.sourceUrl);
    const jobValidation = ParsedJobSchema.safeParse(job);
    if (!jobValidation.success) {
      return NextResponse.json(
        { error: "Parsed job failed validation", details: jobValidation.error.flatten() },
        { status: 422 }
      );
    }

    const match = matchCV(job, cv);
    const tailoredCV = generateCV(cv, job, match);
    const coverLetter = generateCoverLetter(cv, job);
    const cvCheck = validateGeneratedCV(tailoredCV, cv);
    const aiConfig = getAIConfig();

    return NextResponse.json({
      mode: aiConfig.isConfigured ? "local-with-ai-available" : "local",
      job,
      match,
      generatedCV: tailoredCV,
      generatedCoverLetter: coverLetter,
      validation: cvCheck,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
