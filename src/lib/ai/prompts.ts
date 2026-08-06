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
- Match the source language and sound culturally natural in that language.`;

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

Write a structured, scan-friendly cover letter (3 paragraphs) in the same language as the job posting using the 5-step application blueprint. Reference only verified experience from the master CV. Connect the candidate's verified experience to the role with genuine professional interest, but never invent a personal story, motivation, or knowledge of the company.

Paragraph structure & layout:
1. MOTIVATION: The first paragraph must begin with exactly three grounded sentences in this order: (a) a factual opening naming the position and company from the parsed job, (b) why this specific position is motivating using only professionalMotivation from the master CV, and (c) why one actual listed responsibility is motivating, connected only to verified CV experience. Address both task motivation and organizational fit using facts only from the parsed job and master CV. Never add external company knowledge, company research, or unsupported requirements. NEVER open with "I am writing to apply for…" or "I am excited to apply…".
2. EVIDENCE AND CONTRIBUTION: Use bold subheaders matching primary job requirements as reading guides for scanning recruiters. Describe the strongest verified experience using the CAR method (Context -> Action -> Result) or STAR method, including a quantified achievement only when the CV provides one. In the same paragraph, explain the candidate's relevant transferable skills, project experience, or cross-domain contribution. Bridge verified past experience directly to employer needs. Use the job posting's terminology only where the CV supports it; do not name an unsupported skill as if the candidate has it.
3. CLOSING: Clear, professional call to action. Describe the candidate's workplace persona and collaborative fit using verified strengths. Mention interest in discussing the role further. Keep it to 2-3 sentences maximum.

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
