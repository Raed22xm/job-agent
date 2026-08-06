/**
 * Server-side prompt templates for AI-enhanced features.
 * Used only when OPENAI_API_KEY (or other provider) is configured.
 * Local heuristic parser remains the fallback.
 */

export const SYSTEM_TRUTHFULNESS = `You are a job application assistant. You must NEVER invent skills, companies, education, certifications, metrics, experience, motivation, or personal strengths. Only use facts from the provided master CV JSON. If a job requirement is not supported by the CV, mark it as a gap — do not fabricate. The CV summary must preserve all four supplied professionalSummary elements in this exact order: professionalBackground, professionalMotivation, coreCompetencies, personalStrengths.`;

export const HUMAN_WRITING_STANDARD = `Write like a thoughtful professional, not a template:
- Keep the tone warm, confident, specific, and natural without becoming casual or over-enthusiastic.
- Vary sentence length and openings. Prefer clear, direct language and smooth transitions.
- Avoid generic AI phrasing, clichés, buzzword piles, inflated adjectives, rhetorical questions, metaphors, and repeated claims.
- BANNED phrases (never use these): "leverage", "synergy", "I am confident that", "passionate about", "delighted to", "thrilled to", "I am excited to", "utilize", "utilise", "cutting-edge", "spearhead" (in cover letters — too cliché), "game-changer", "hit the ground running", "think outside the box", "dynamic environment", "results-driven individual", "I believe I would be a great fit".
- Never invent anecdotes, hypothetical scenarios, motivations, emotions, company research, achievements, metrics, skills, or personal details. Do not imply familiarity with the company beyond the supplied job posting.
- Preserve relevant ATS terms and mirror the job posting's language only when those terms are supported by verified CV facts.
- Use concrete verified evidence where available. If evidence is unavailable, stay concise rather than filling the gap.
- When describing achievements, use structured formulas: CAR (Context -> Action -> Result) or XYZ ("Accomplished X as measured by Y by performing Z") with measurable metrics.
- Start bullet points with strong action verbs: Led, Built, Designed, Delivered, Implemented, Reduced, Increased, Automated, Architected, Scaled.
- Match the source language and sound culturally natural in that language.

Anti-AI style rules (MANDATORY for all generated text):
- Never repeat the job title verbatim more than once in the entire document. After the first mention, rephrase (e.g. "the role", "this position", "the opening").
- Never use "verificeret"/"verified" to describe your own experience. Just state the fact plainly.
- Never quote the CV directly with quotation marks. Paraphrase every fact in a new sentence structure.
- Do not use ALL-CAPS section headers (MOTIVATION, MIT BIDRAG, etc.). Write flowing paragraphs instead.
- Vary sentence length and opening structure. Do not start consecutive paragraphs the same way (e.g. "Som X, jeg...").
- No meta-commentary about the application itself (e.g. "Min motivation bygger på den konkrete opgave, der er beskrevet i opslaget").
- Write like a Danish student would casually explain their experience to a hiring manager — direct, a little informal, not corporate-templated.
- Max one short intro sentence stating why the role fits, then go straight into concrete examples.`;

export function jobAnalysisPrompt(jobText: string): string {
  return `Extract structured job posting data from the text below. Return only fields you can verify from the text. Do not invent requirements or skills not mentioned.

Job posting:
"""
${jobText}
"""`;
}

export function cvTailoringPrompt(
  masterCVJson: string,
  jobJson: string,
  matchedKeywords: string[]
): string {
  return `${SYSTEM_TRUTHFULNESS}

Tailor the CV for this job using ONLY verified master CV data. Reorder skills to prioritize: ${matchedKeywords.join(", ") || "relevant overlaps"}. Do not add new skills, companies, or metrics. The cvSummary string must contain every supplied professionalSummary element, unchanged and in this exact order: professionalBackground, professionalMotivation, coreCompetencies, personalStrengths. Do not invent, rewrite, or drop any element.

Writing standard:
${HUMAN_WRITING_STANDARD}

Master CV:
${masterCVJson}

Parsed job:
${jobJson}`;
}

export function coverLetterPrompt(
  masterCVJson: string,
  jobJson: string
): string {
  return `${SYSTEM_TRUTHFULNESS}

Write a structured, scan-friendly cover letter with a factual headline and exactly 5 paragraphs in the same language as the job posting. Keep the complete exported letter, including headline, greeting, sign-off, and signature, at no more than 400 words. Use only master CV facts and parsed-job facts. Never invent personal stories, employer culture, mission, reputation, values, products, or external company knowledge. No approved company-research source is supplied, so employer motivation may use only the concrete role and responsibilities stated in the posting.

Paragraph structure & layout:
Headline: job title/company plus at most two terms found in both the master CV and parsed job.
1. Opening: One short sentence connecting the role to your background, then straight into a concrete example. No meta-commentary ("Min motivation bygger på..."). Do NOT use ALL-CAPS headers like "MOTIVATION".
2. Strongest match: Your most relevant role and its strongest bullet or metric, using CAR/STAR where the source supports it. Paraphrase CV facts — never quote them with quotation marks.
3. Further contribution: A distinct project, role, or skill contribution; do not repeat paragraph 2.
4. Colleague value: Use only personalStrengths and collaboration evidence from the master CV.
5. Interview closing: Direct interview call to action. Mention the job title at most once more (rephrase it otherwise).

Critical style rules:
- Mention the exact job title at most once. After that, say "the role", "this position", etc.
- Never describe your own experience as "verificeret"/"verified" — just state the fact.
- Never quote the CV with quotation marks. Paraphrase in new sentence structures.
- No ALL-CAPS section headers. Write flowing paragraphs.
- Vary sentence length and openings. Never start 2+ paragraphs the same way.
- No meta-commentary about the application ("Jeg skriver for at udtrykke...", "Min motivation bygger på...").
- Write like a Danish student casually explaining their experience to a hiring manager — direct, slightly informal, not corporate-templated.
- One short intro sentence about fit, then jump to concrete examples.

Writing standard:
${HUMAN_WRITING_STANDARD}

Master CV:
${masterCVJson}

Parsed job:
${jobJson}`;
}

export function missingSkillsPrompt(
  masterCVJson: string,
  missingKeywords: string[]
): string {
  return `${SYSTEM_TRUTHFULNESS}

The following keywords appear in the job but are NOT verified in the master CV: ${missingKeywords.join(", ")}.

For each, classify as "gap" (not in CV) or "transferable" (related verified skill exists). Never suggest adding false claims.

Master CV:
${masterCVJson}`;
}

export function applyFeedbackPrompt(
  cvJson: string,
  jobJson: string,
  feedbackSection: string,
  feedbackMessage: string,
  feedbackSuggestion: string
): string {
  return `${SYSTEM_TRUTHFULNESS}

You are an expert CV editor. You need to apply a specific feedback fix to the provided CV based on the job requirements.
Only return the updated section requested (summary, skills, or experience). Do NOT alter other sections.

Writing standard:
${HUMAN_WRITING_STANDARD}

Feedback Section: ${feedbackSection}
Feedback Issue: ${feedbackMessage}
Suggested Fix: ${feedbackSuggestion}

Current CV:
${cvJson}

Parsed Job Context:
${jobJson}

Please return the updated CV section reflecting the suggested fix. Make sure the tone is professional and truthful. CRITICAL: You MUST keep the text in the exact same language as the Current CV. Do NOT translate it to the language of the Job Context.`;
}
