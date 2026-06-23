# Job Agent

A local-first job application assistant built with Next.js, TypeScript, and Tailwind CSS.

Job Agent helps you analyze job postings, compare them against your master CV, generate ATS-friendly tailored documents, and track applications — with **human approval required** before anything is sent. No auto-apply functionality is included.

## Features (v0.3)

- **Job Analyzer** — Paste a job description or import from supported URLs (The Hub, Jobindex; LinkedIn when accessible)
- **AI-enhanced analysis** — Server-side OpenAI via Vercel AI SDK with local heuristic fallback
- **CV Match Score** — Weighted scoring across skills, experience, location, language, junior fit, and portfolio
- **Keyword Insights** — Matching and missing ATS keywords with Danish/English alias support
- **CV Generator** — Editable, ATS-friendly CV preview using verified data only
- **Cover Letter** — Editable tailored draft for human review
- **Application Tracker** — Save jobs with match score, status, dates, notes, recruiter contact, CV version, cover letter status; export/import JSON backup
- **Export** — DOCX and visual PDF export for CV and cover letter (DOCX recommended for ATS)

## Important rules

- Does **not** invent experience, education, companies, numbers, or skills
- Uses only verified data from `data/cv/` and `data/master-cv.json`
- **No auto-apply** — review all outputs before submitting applications
- OpenAI runs **server-side only** when `OPENAI_API_KEY` is set; local heuristics always available as fallback

## Tech stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Vercel AI SDK + Zod schemas for structured AI output
- Local JSON for master CV (`data/master-cv.json`)
- Browser localStorage for application tracker (SQLite planned later)
- Vitest for unit tests (51+ tests)

## Project structure

```
Job Agent/
├── data/
│   ├── cv/                     # Master CV in Markdown (verified source)
│   ├── jobs/                   # Saved job descriptions
│   ├── outputs/                # Generated CVs, cover letters
│   ├── private/                # Imported PDFs/DOCX (gitignored)
│   ├── master-cv.json          # CV data for the app
│   └── import-index.json       # Catalog of imported files
├── prompts/                    # Agent prompts for match, CV, cover letter
├── src/
│   ├── app/
│   │   ├── api/                # analyze-job, fetch-job, generate-cv, generate-cover-letter
│   │   ├── analyzer/           # Job Analyzer
│   │   ├── cv/                 # CV Generator + editor
│   │   ├── cover-letter/       # Cover Letter editor
│   │   └── tracker/            # Application Tracker
│   ├── components/
│   ├── lib/
│   │   ├── ai/                 # OpenAI integration, schemas, merge logic
│   │   ├── job/                # parseJob, scoreJob, scrapers
│   │   └── cv/                 # validateCV, export, edit helpers
│   ├── context/
│   └── types/
└── README.md
```

## Getting started

### Prerequisites

- Node.js 18+
- npm

### Install and run

```bash
cd "Job Agent"
npm install
cp .env.example .env   # add OPENAI_API_KEY for AI-enhanced analysis
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If port 3000 is occupied, use `npm run dev -- -p 3001`.

### Workflow

1. Update `data/master-cv.json` with your real verified CV data
2. Go to **Job Analyzer** — paste a job description or import a URL
3. Click **Analyze Job** to see match score, keywords, and focus areas
4. Edit tailored **CV** and **Cover Letter** before export
5. Click **Save to Tracker** and manage status, dates, and notes
6. Export DOCX for ATS submission

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest unit tests |
| `npm run typecheck` | TypeScript check without emit |
| `npm run check` | Lint, test, typecheck, and build |

## Roadmap

- [x] OpenAI / Vercel AI SDK integration (server-side, with fallback)
- [x] Job URL scraping (The Hub, Jobindex)
- [x] PDF/DOCX export for CV and cover letter
- [x] Editable CV and cover letter before export
- [x] Tracker JSON export/import backup
- [ ] SQLite persistence for application tracker
- [ ] Playwright E2E tests

## License

Private / local use — customize as needed.
