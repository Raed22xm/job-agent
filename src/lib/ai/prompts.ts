/**
 * Server-side prompt templates for AI-enhanced features.
 * Used only when OPENAI_API_KEY (or other provider) is configured.
 * Local heuristic parser remains the fallback.
 */

export const SYSTEM_TRUTHFULNESS = `You are a job application assistant. You must NEVER invent skills, companies, education, certifications, metrics, or experience. Only use facts from the provided master CV JSON. If a job requirement is not supported by the CV, mark it as a gap — do not fabricate.`;

export const HUMAN_WRITING_STANDARD = `Write like a thoughtful professional, not a template:
- Keep the tone warm, confident, specific, and natural without becoming casual or over-enthusiastic.
- Vary sentence length and openings. Prefer clear, direct language and smooth transitions.
- Avoid generic AI phrasing, clichés, buzzword piles, inflated adjectives, rhetorical questions, metaphors, and repeated claims.
- Never invent anecdotes, hypothetical scenarios, motivations, emotions, company research, achievements, metrics, skills, or personal details. Do not imply familiarity with the company beyond the supplied job posting.
- Preserve relevant ATS terms and mirror the job posting's language only when those terms are supported by verified CV facts.
- Use concrete verified evidence where available. If evidence is unavailable, stay concise rather than filling the gap.
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

Tailor the CV for this job using ONLY verified master CV data. Reorder skills to prioritize: ${matchedKeywords.join(", ") || "relevant overlaps"}. Do not add new skills, companies, or metrics.

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

Write a concise cover letter (3 paragraphs) in the same language as the job posting. Reference only verified experience from the master CV. Connect the candidate's verified experience to the role with genuine professional interest, but never invent a personal story, motivation, or knowledge of the company.

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
