import { NextResponse } from "next/server";
import { saveApplicationOutputs } from "@/lib/job/saveApplicationOutputs";
import type { GeneratedCoverLetter, GeneratedCV } from "@/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      company?: string;
      title?: string;
      generatedCV?: GeneratedCV | null;
      generatedCoverLetter?: GeneratedCoverLetter | null;
    };

    const company = body.company?.trim();
    const title = body.title?.trim();

    if (!company || !title) {
      return NextResponse.json(
        { error: "company and title are required" },
        { status: 400 }
      );
    }

    if (!body.generatedCV && !body.generatedCoverLetter) {
      return NextResponse.json(
        { error: "generatedCV or generatedCoverLetter is required" },
        { status: 400 }
      );
    }

    const paths = await saveApplicationOutputs({
      company,
      title,
      generatedCV: body.generatedCV,
      generatedCoverLetter: body.generatedCoverLetter,
    });

    return NextResponse.json(paths);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save application outputs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
