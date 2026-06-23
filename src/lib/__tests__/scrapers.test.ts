import { describe, expect, it, vi, afterEach } from "vitest";
import {
  buildJobDescriptionText,
  htmlToPlainText,
} from "@/lib/job/scrapers/htmlUtils";
import {
  detectJobScraperProvider,
  parseJobUrl,
  scrapeJobUrl,
} from "@/lib/job/scrapers";
import { jobindexScraper } from "@/lib/job/scrapers/jobindex";
import { theHubScraper } from "@/lib/job/scrapers/theHub";
import { buildJobFileSlug } from "@/lib/job/saveJobFile";

const JOBINDEX_HTML = `
<article class="jobtext-jobad">
  <header class="jobtext-jobad__header">
    <h1 class="h2">Frontend Developer</h1>
    <div class="jobtext-jobad__metadata">
      <div class="jobtext-jobad__metadata-item">
        <svg aria-label="Virksomhed:"></svg>
        Acme ApS
      </div>
      <div class="jobtext-jobad__metadata-item">
        <svg aria-label="Lokation:"></svg>
        København
      </div>
    </div>
  </header>
  <section class="jobtext-jobad__body">
    <p>Vi søger en frontend-udvikler med erfaring i React og TypeScript.</p>
    <ul><li>Byg brugervenlige interfaces</li><li>Samarbejd med design</li></ul>
  </section>
</article>`;

describe("htmlToPlainText", () => {
  it("converts basic HTML to readable text", () => {
    const text = htmlToPlainText(
      "<h4>Title</h4><p>Line one</p><ul><li>Item A</li></ul>"
    );
    expect(text).toContain("Title");
    expect(text).toContain("Line one");
    expect(text).toContain("- Item A");
  });
});

describe("buildJobDescriptionText", () => {
  it("builds a header plus body block", () => {
    const text = buildJobDescriptionText({
      title: "Developer",
      company: "Acme",
      location: "Copenhagen",
      body: "Requirements:\n- React",
    });

    expect(text).toContain("Developer");
    expect(text).toContain("Acme · Copenhagen");
    expect(text).toContain("Requirements:");
  });
});

describe("detectJobScraperProvider", () => {
  it("detects supported providers", () => {
    expect(
      detectJobScraperProvider(
        parseJobUrl("https://thehub.io/jobs/690db4736432fa69fa1d2ef3")
      )
    ).toBe("thehub");

    expect(
      detectJobScraperProvider(
        parseJobUrl(
          "https://www.jobindex.dk/jobannonce/h1672756/frontend-udvikler"
        )
      )
    ).toBe("jobindex");

    expect(
      detectJobScraperProvider(
        parseJobUrl("https://www.linkedin.com/jobs/view/1234567890")
      )
    ).toBe("linkedin");
  });

  it("returns null for unsupported hosts", () => {
    expect(
      detectJobScraperProvider(parseJobUrl("https://example.com/jobs/1"))
    ).toBeNull();
  });
});

describe("buildJobFileSlug", () => {
  it("slugifies company and title", () => {
    expect(buildJobFileSlug("Bodil Energi", "Junior Developer")).toBe(
      "bodil-energi-junior-developer"
    );
  });
});

describe("jobindexScraper", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses Jobindex HTML into structured text", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JOBINDEX_HTML, { status: 200 })
    );

    const result = await jobindexScraper.scrape(
      new URL(
        "https://www.jobindex.dk/jobannonce/h123456/frontend-developer"
      )
    );

    expect(result.provider).toBe("jobindex");
    expect(result.title).toBe("Frontend Developer");
    expect(result.company).toBe("Acme ApS");
    expect(result.location).toBe("København");
    expect(result.jobDescription).toContain("React og TypeScript");
  });
});

describe("theHubScraper", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses The Hub API and converts HTML description", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          doc: {
            id: "690db4736432fa69fa1d2ef3",
            title: "Junior Developer",
            description:
              "<h4>About</h4><p>Build features with <strong>React</strong> and TypeScript in our energy platform for real customers.</p>",
            location: {
              address: "Copenhagen, Denmark",
              locality: "Copenhagen",
              country: "Denmark",
            },
            status: "ACTIVE",
            absoluteJobUrl: "https://thehub.io/jobs/690db4736432fa69fa1d2ef3",
            company: { name: "Bodil Energy" },
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );

    const result = await theHubScraper.scrape(
      new URL("https://thehub.io/jobs/690db4736432fa69fa1d2ef3")
    );

    expect(result.provider).toBe("thehub");
    expect(result.company).toBe("Bodil Energy");
    expect(result.jobDescription).toContain("React");
    expect(result.inactive).toBe(false);
  });
});

describe("scrapeJobUrl", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects unsupported URLs", async () => {
    await expect(scrapeJobUrl("https://example.com/jobs/1")).rejects.toThrow(
      /Unsupported job URL/
    );
  });
});
