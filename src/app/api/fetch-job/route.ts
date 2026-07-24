import { NextResponse } from "next/server";
import { z } from "zod";
import { scrapeJobUrl, JobScrapeError } from "@/lib/job/scrapers";
import { saveJobToFile } from "@/lib/job/saveJobFile";

const FetchJobRequestSchema = z.object({
  url: z.string().url("Must be a valid URL string"),
  save: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const rawBody = (await request.json().catch(() => ({}))) as unknown;
    const parseResult = FetchJobRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid URL or request payload", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { url, save } = parseResult.data;

    const scraped = await scrapeJobUrl(url);
    const shouldSave = save !== false;
    const savedPath = shouldSave ? await saveJobToFile(scraped) : undefined;

    return NextResponse.json({
      ...scraped,
      savedPath,
    });
  } catch (error) {
    if (error instanceof JobScrapeError) {
      const status =
        error.code === "unsupported_url"
          ? 400
          : error.code === "not_found"
            ? 404
            : error.code === "blocked"
              ? 403
              : 422;

      return NextResponse.json(
        { error: error.message, code: error.code },
        { status }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to fetch job URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
