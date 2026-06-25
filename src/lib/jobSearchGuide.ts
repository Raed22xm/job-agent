export type GuideCategory =
  | "find-jobs"
  | "methods"
  | "cv"
  | "app"
  | "agent";

export interface GuideResource {
  id: string;
  category: GuideCategory;
  title: string;
  description: string;
  tags: string[];
  url?: string;
  appLink?: string;
  badge?: "recommended" | "supported-import" | "danish";
  steps?: string[];
}

export const GUIDE_CATEGORIES: {
  id: GuideCategory | "all";
  label: string;
  description: string;
}[] = [
  {
    id: "all",
    label: "All",
    description: "Every method, tool, and workflow tip.",
  },
  {
    id: "find-jobs",
    label: "Find jobs",
    description: "Job boards and platforms for Denmark and remote EU roles.",
  },
  {
    id: "methods",
    label: "Methods",
    description: "How to search effectively as a junior candidate.",
  },
  {
    id: "cv",
    label: "CV & apply",
    description: "ATS-friendly CV rules and application best practices.",
  },
  {
    id: "app",
    label: "This app",
    description: "Use Job Agent features in the right order.",
  },
  {
    id: "agent",
    label: "Search agent",
    description: "When to use the app vs Cursor chat for job help.",
  },
];

export const GUIDE_RESOURCES: GuideResource[] = [
  {
    id: "jobindex",
    category: "find-jobs",
    title: "Jobindex.dk",
    description:
      "Denmark's largest job board. Best for junior, studiejob, praktik, and local Danish postings. Paste the job text or URL into Job Analyzer.",
    tags: ["denmark", "danish", "job board", "junior", "studiejob"],
    url: "https://www.jobindex.dk",
    badge: "supported-import",
  },
  {
    id: "thehub",
    category: "find-jobs",
    title: "The Hub",
    description:
      "Strong for startups and tech roles in Denmark. URL import is supported directly in Job Analyzer.",
    tags: ["denmark", "startup", "tech", "job board"],
    url: "https://thehub.io",
    badge: "supported-import",
  },
  {
    id: "linkedin",
    category: "find-jobs",
    title: "LinkedIn Jobs",
    description:
      "Good for company research and recruiter visibility. Import may be blocked — paste the full job description if URL import fails.",
    tags: ["networking", "job board", "recruiter"],
    url: "https://www.linkedin.com/jobs",
    badge: "supported-import",
  },
  {
    id: "jobnet",
    category: "find-jobs",
    title: "Jobnet",
    description:
      "Official Danish job portal. Useful for public-sector and regulated roles. Copy the posting text into the analyzer.",
    tags: ["denmark", "official", "job board"],
    url: "https://jobnet.dk",
    badge: "danish",
  },
  {
    id: "graduateland",
    category: "find-jobs",
    title: "Graduateland",
    description:
      "Graduate and junior roles across Nordics and EU. Filter by studiejob, graduate, and internship.",
    tags: ["junior", "graduate", "internship", "nordics"],
    url: "https://graduateland.com",
  },
  {
    id: "company-careers",
    category: "methods",
    title: "Company career pages",
    description:
      "Check Novo Nordisk, Ørsted, Danske Bank, TV2, and other target employers directly. Often less competition than aggregators.",
    tags: ["direct apply", "research", "target list"],
    badge: "recommended",
    steps: [
      "Build a list of 10–15 target companies.",
      "Check careers pages weekly.",
      "Save each posting to Job Agent and track in the tracker.",
    ],
  },
  {
    id: "student-network",
    category: "methods",
    title: "DTU / studie network",
    description:
      "Use university job portals, alumni LinkedIn, and studiejob fairs. Junior roles often appear here before Jobindex.",
    tags: ["dtu", "student", "network", "junior"],
    badge: "danish",
  },
  {
    id: "keyword-search",
    category: "methods",
    title: "Keyword search strategy",
    description:
      "Search in Danish and English: junior udvikler, studiejob, frontend, React, digitalisering, Power BI, praktikant.",
    tags: ["search", "keywords", "danish", "english"],
    steps: [
      "Rotate 3–5 keyword sets per week.",
      "Save promising posts even if not applying yet.",
      "Compare match scores before spending time tailoring.",
    ],
  },
  {
    id: "weekly-routine",
    category: "methods",
    title: "Weekly job search routine",
    description:
      "Consistency beats volume. A focused weekly rhythm works better than applying to 50 weak matches.",
    tags: ["routine", "productivity"],
    badge: "recommended",
    steps: [
      "Mon–Tue: find 5–10 new postings.",
      "Wed–Thu: analyze and tailor top 3 matches.",
      "Fri: apply, update tracker, set follow-up dates.",
    ],
  },
  {
    id: "ats-cv",
    category: "cv",
    title: "ATS-friendly CV rules",
    description:
      "One column, clear headings, no graphics tables, standard section names. Export DOCX for ATS — PDF here is visual only.",
    tags: ["ats", "cv", "docx", "format"],
    badge: "recommended",
    appLink: "/cv",
  },
  {
    id: "verified-data",
    category: "cv",
    title: "Verified data only",
    description:
      "Never invent skills, metrics, or dates. If a job requires TypeScript and it is not in your master CV, label it a gap — do not add it.",
    tags: ["truth", "master cv", "gap"],
    badge: "recommended",
  },
  {
    id: "tailor-per-role",
    category: "cv",
    title: "Tailor per role type",
    description:
      "Frontend: React, CSS, Git. Digitalisering: Power BI, SQL, dashboards. UI/UX: Figma + dev overlap. Only use what is verified in master-cv.json.",
    tags: ["tailoring", "frontend", "power bi", "figma"],
    appLink: "/cv",
  },
  {
    id: "cover-letter",
    category: "cv",
    title: "Cover letter best practice",
    description:
      "Short, specific, honest. Mirror the job language (Danish or English). Mention 1–2 verified achievements — not generic AI filler.",
    tags: ["cover letter", "danish", "english"],
    appLink: "/cover-letter",
  },
  {
    id: "pipeline-analyze",
    category: "app",
    title: "1. Job Analyzer",
    description:
      "Paste text or import URL (The Hub, Jobindex, LinkedIn). Local match score first, optional AI enhancement, missing keywords and focus areas.",
    tags: ["analyzer", "match score", "ai"],
    appLink: "/analyzer",
    badge: "recommended",
  },
  {
    id: "pipeline-cv",
    category: "app",
    title: "2. Edit CV",
    description:
      "Review the generated draft, edit bullets and summary, check validation panel. Block export if errors appear.",
    tags: ["cv", "edit", "validation"],
    appLink: "/cv",
  },
  {
    id: "pipeline-letter",
    category: "app",
    title: "3. Edit cover letter",
    description:
      "Adjust greeting, paragraphs, and closing. Keep tone natural and truthful.",
    tags: ["cover letter", "edit"],
    appLink: "/cover-letter",
  },
  {
    id: "pipeline-tracker",
    category: "app",
    title: "4. Tracker & follow-up",
    description:
      "Save applications, set applied and follow-up dates, export JSON backup. Track CV version and cover letter status.",
    tags: ["tracker", "follow-up", "backup"],
    appLink: "/tracker",
  },
  {
    id: "agent-app",
    category: "agent",
    title: "Use the web app for applications",
    description:
      "The app is your runtime: analyze → edit → validate → export → apply manually. Predictable and grounded in master-cv.json.",
    tags: ["workflow", "local-first"],
    badge: "recommended",
  },
  {
    id: "agent-cursor",
    category: "agent",
    title: "Use Cursor chat for hard cases",
    description:
      "Ask Cursor when you need help framing a gap, improving Danish wording, or comparing two roles. Paste the job text and request match analysis.",
    tags: ["cursor", "chat", "tailoring"],
    steps: [
      "Paste full job description in chat.",
      "Ask for match analysis against verified CV only.",
      "Request CV or cover letter edits — then copy into the app for export.",
    ],
  },
  {
    id: "agent-no-auto",
    category: "agent",
    title: "Do not use auto-apply or scraper bots",
    description:
      "No LinkedIn auto-messaging, form bots, or multi-agent auto-apply. High risk, low trust, and against this project's rules.",
    tags: ["rules", "no auto-apply", "human review"],
    badge: "recommended",
  },
];

export function filterGuideResources(
  resources: GuideResource[],
  query: string,
  category: GuideCategory | "all"
): GuideResource[] {
  const normalizedQuery = query.trim().toLowerCase();

  return resources.filter((resource) => {
    const matchesCategory =
      category === "all" || resource.category === category;

    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;

    const haystack = [
      resource.title,
      resource.description,
      ...resource.tags,
      ...(resource.steps ?? []),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export const GUIDE_UPDATES = [
  {
    date: "2026-06-23",
    title: "Job Guide page added",
    summary:
      "Search methods, platforms, CV rules, and agent workflow in one place.",
  },
  {
    date: "2026-06-23",
    title: "v0.4 pipeline",
    summary:
      "Single analyze-job pipeline with AI fallback, editable CV/cover letter, tracker backup.",
  },
  {
    date: "2026-06-22",
    title: "URL import",
    summary: "The Hub and Jobindex supported; LinkedIn when accessible.",
  },
];
