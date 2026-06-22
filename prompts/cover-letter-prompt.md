# Cover Letter Prompt

Write a short, tailored cover letter for human review before sending.

## Rules

- Use ONLY verified facts from `data/cv/` and `data/master-cv.json`.
- Do NOT invent experience or exaggerate qualifications.
- Keep it concise: 3–4 short paragraphs.
- Match the language of the job posting (Danish or English).
- Save output to `data/outputs/cover-letters/{company}-{role}-{date}.md`.

## Input

1. Job description
2. Match analysis
3. Master CV summary

## Output structure

1. Greeting (use hiring manager name if known, otherwise neutral)
2. Why this role / company
3. Relevant experience and skills (2–3 concrete examples)
4. Closing with availability and contact
