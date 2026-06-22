# Job Match Prompt

Analyze the job description against the verified CV data in `data/cv/` and `data/master-cv.json`.

## Rules

- Use ONLY verified information from the master CV files.
- Do NOT invent skills, experience, or qualifications.
- Output match score (0–100), matched keywords, missing keywords, and recommended CV focus areas.

## Input

1. Job description — any of:
   - Pasted text (from chat)
   - Saved file in `data/jobs/`
   - **Job URL** (The Hub, Greenhouse, company site, etc.) — fetch and extract the full posting
   - **LinkedIn job URL** — fetch if public; if blocked, ask user to paste the description
2. Master CV (`data/cv/*.md` and `data/master-cv.json`)

## Output format

- **Match score:** X/100
- **Matched keywords:** list
- **Missing keywords:** list
- **Recommended focus areas:** which experiences/projects to emphasize
- **Honest gaps:** requirements not supported by verified CV data
