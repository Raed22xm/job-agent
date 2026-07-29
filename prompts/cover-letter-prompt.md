# Cover Letter Prompt

Write a short, tailored cover letter for human review before sending.

## Rules

- Use ONLY verified facts from `data/cv/` and `data/master-cv.json`.
- Do NOT invent experience or exaggerate qualifications.
- Sound warm, confident, and individually written without becoming casual or over-enthusiastic.
- Vary sentence length and openings, use smooth transitions, and favor direct, specific language.
- Avoid clichés, generic AI phrases, buzzword piles, inflated adjectives, rhetorical questions, and repeated claims.
- Preserve relevant job terminology when it is supported by the verified CV.
- Never invent anecdotes, hypothetical scenarios, motivations, emotions, company research, achievements, metrics, skills, or personal details.
- Do not imply knowledge of the company beyond the supplied job description. If a personal reason is not verified, focus on the professional fit instead.
- Keep it concise: 3–4 short paragraphs.
- Match the language of the job posting (Danish or English).
- Save output to `data/outputs/cover-letters/{company}-{role}-{date}.md`.

## Input

1. Job description
2. Match analysis
3. Master CV summary

## Output structure

1. Greeting (use hiring manager name if known, otherwise neutral)
2. Why the verified professional fit makes the role relevant
3. Relevant experience and skills (2–3 concrete examples)
4. Closing with availability and contact
