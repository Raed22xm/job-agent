import { NextResponse } from "next/server";
import { scrapeJobUrl, JobScrapeError } from "@/lib/job/scrapers";
import { saveJobToFile } from "@/lib/job/saveJobFile";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      url?: string;
      save?: boolean;
    };

    const url = body.url?.trim();
    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const scraped = await scrapeJobUrl(url);
    const shouldSave = body.save !== false;
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
