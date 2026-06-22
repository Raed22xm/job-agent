# LinkedIn Message Prompt

Draft a short LinkedIn connection or InMail message for human review before sending.

## Rules

- Use ONLY verified facts from `data/cv/` and `data/master-cv.json`.
- Do NOT invent experience or exaggerate qualifications.
- Keep it brief: 2–4 sentences for a connection note; up to 6 for InMail.
- Match the language of the job posting (Danish or English).
- Save output to `data/outputs/linkedin-messages/{company}-{role}-{date}.md`.

## Input

1. Job description or target role
2. Match analysis (optional)
3. Recipient context (recruiter, hiring manager, or generic)

## Output structure

1. Personalized opener (role or company reference)
2. One concrete reason you fit (verified skill or experience)
3. Clear, low-pressure call to action
