# Job Agent

A local-first job application assistant built with Next.js, TypeScript, and Tailwind CSS.

Job Agent helps you analyze job postings, compare them against your master CV, generate ATS-friendly tailored documents, and track applications — with **human approval required** before anything is sent. No auto-apply functionality is included.

## Features (v0.2)

- **Job Analyzer (functional)** — Paste a job description, extract title/company/location/skills/tools/responsibilities/ATS keywords, score match vs master CV, view matching/missing keywords and recommended CV focus areas
- **CV Match Score** — Compare job keywords against verified master CV data
- **Keyword Insights** — View matching and missing ATS keywords
- **CV Generator** — One-column ATS-friendly CV preview using verified data only
- **Cover Letter** — Short tailored draft for human review
- **Application Tracker** — Save jobs and track status locally (browser storage)

## Important rules

- Does **not** invent experience, education, companies, numbers, or skills
- Uses only verified data from `data/master-cv.json`
- **No auto-apply** — review all outputs before submitting applications
- OpenAI API is **not connected** in this version (placeholder logic only)

## Tech stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Local JSON for master CV (`data/master-cv.json`)
- Browser localStorage for application tracker (SQLite planned later)

## Project structure

```
Job Agent/
├── data/
│   └── master-cv.json          # Your verified master CV data
├── src/
│   ├── app/
│   │   ├── page.tsx            # Home
│   │   ├── analyzer/           # Job Analyzer
│   │   ├── cv/                 # CV Generator
│   │   ├── cover-letter/       # Cover Letter
│   │   └── tracker/            # Application Tracker
│   ├── components/
│   │   ├── JobInput.tsx
│   │   ├── MatchScoreCard.tsx
│   │   ├── KeywordList.tsx
│   │   ├── CVPreview.tsx
│   │   ├── CoverLetterPreview.tsx
│   │   └── ApplicationTable.tsx
│   ├── lib/
│   │   ├── parseJob.ts         # Placeholder job parser
│   │   ├── matchCV.ts          # Keyword match scoring
│   │   ├── generateCV.ts       # Tailored CV generator
│   │   ├── generateCoverLetter.ts
│   │   └── storage.ts          # Local tracker persistence
│   ├── context/
│   │   └── JobAgentContext.tsx # Shared analysis state
│   └── types/
│       └── index.ts
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
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Workflow

1. Update `data/master-cv.json` with your real verified CV data
2. Go to **Job Analyzer** and paste a job description
3. Click **Analyze Job** to see extracted fields, match score, and keywords
4. Visit **CV Generator** and **Cover Letter** for tailored previews
5. Click **Save to Tracker** to store the application locally
6. Manage status in **Application Tracker**

## Scripts

| Command       | Description              |
|---------------|--------------------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build       |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint              |

## Roadmap

- [ ] OpenAI / LLM integration for smarter parsing and writing
- [ ] Job URL scraping
- [ ] PDF/DOCX export for CV and cover letter
- [ ] SQLite persistence for application tracker
- [ ] Editable CV and cover letter before export

## License

Private / local use — customize as needed.
