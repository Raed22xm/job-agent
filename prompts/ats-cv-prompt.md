# ATS CV Prompt

Generate a one-column, ATS-friendly tailored CV for a specific job application.

## Rules

- Source data ONLY from `data/cv/` and `data/master-cv.json`.
- Do NOT invent experience, education, companies, numbers, or skills.
- Prioritize keywords from the job description that are truthfully supported by the CV.
- Keep formatting simple: plain headings, bullet points, no tables or columns.
- Save output to `data/outputs/cvs/{company}-{role}-{date}.md`.

## Input

1. Target job description
2. Match analysis (from job-match prompt)
3. Master CV files

## Output

Tailored CV in Danish or English (match the job posting language).
