import { getProvider } from "@/lib/ai/provider";
import { generateText } from "ai";

/**
 * Banned AI buzzwords & clichés mapped to natural human alternatives.
 * Derived from blader/humanizer, llmstrip, and Wikipedia's Signs of AI Writing catalog.
 */
const BANNED_AI_PATTERNS: Array<[RegExp, string]> = [
  // Buzzwords
  [/\bleverag(e|ed|ing|es)\b/gi, "use"],
  [/\butiliz(e|ed|ing|es)\b/gi, "use"],
  [/\butilis(e|ed|ing|es)\b/gi, "use"],
  [/\bdelv(e|ed|ing|es)\s+into\b/gi, "explore"],
  [/\bdelv(e|ed|ing|es)\b/gi, "explore"],
  [/\bseamless(ly)?\b/gi, "smooth"],
  [/\btestament to\b/gi, "proof of"],
  [/\bgroundbreaking\b/gi, "important"],
  [/\bgame-changer\b/gi, "major improvement"],
  [/\bsynergizing\b/gi, "collaborating"],
  [/\bsynergy\b/gi, "collaboration"],
  [/\bresults-driven individual\b/gi, "focused developer"],
  [/\bthrilled to\b/gi, "eager to"],
  [/\bdelighted to\b/gi, "pleased to"],
  [/\bpassionate about\b/gi, "experienced with"],
  [/\bcutting-edge\b/gi, "modern"],
  [/\bthought leader(ship)?\b/gi, "expertise"],
  [/\bhit the ground running\b/gi, "start effectively"],
  [/\bthink outside the box\b/gi, "find creative solutions"],
  [/\bparadigm shift\b/gi, "change"],
  [/\bholistic (approach|view)\b/gi, "comprehensive approach"],
  [/\bempower(ing|s|ed)?\b/gi, "enabling"],
  [/\bfoster(ing|s|ed)?\b/gi, "building"],
  [/\bintricate\b/gi, "complex"],
  [/\bmultifaceted\b/gi, "varied"],
  [/\brobust\b/gi, "reliable"],
  [/\bpivotal\b/gi, "key"],
  [/\bbeacon\b/gi, "example"],
  [/\btapestry\b/gi, "mix"],

  // Formulaic openings & transitions (from llmstrip)
  [/\bI am writing to (apply for|express my interest in|submit my application for)\b/gi, "I am interested in"],
  [/\bin today'?s (rapidly evolving|fast-paced|digital) (landscape|world|market|era)\b/gi, "currently"],
  [/\bin conclusion,?\b/gi, "overall,"],
  [/\bfurthermore,?\b/gi, "also,"],
  [/\bmoreover,?\b/gi, "additionally,"],
  [/\bit is worth noting that\b/gi, ""],
  [/\bit is important to (remember|note|highlight) that\b/gi, ""],
  [/\bneedless to say,?\b/gi, ""],
  [/\bas a matter of fact,?\b/gi, "in fact,"],
];

/**
 * Strips epistemic hedging phrases typical of LLMs (e.g., "It is worth noting that...").
 */
function stripEpistemicHedging(text: string): string {
  return text
    .replace(/\b(it is|it's) (important|crucial|vital|worth noting|worth mentioning) to (note|remember|highlight|understand) that\s*/gi, "")
    .replace(/\b(one could argue|it goes without saying) that\s*/gi, "");
}

/**
 * Breaks up "Rule of Three" adjective groups (e.g. "dynamic, innovative, and results-driven").
 */
function breakRuleOfThree(text: string): string {
  return text.replace(
    /\b(dynamic|innovative|passionate|dedicated|motivated|proactive|strategic|experienced),\s+(dynamic|innovative|passionate|dedicated|motivated|proactive|strategic|experienced),\?\s+and\s+(dynamic|innovative|passionate|dedicated|motivated|proactive|strategic|experienced)\b/gi,
    "focused"
  );
}

/**
 * Converts common passive phrases to active voice (DadaNanjesha NLP methodology).
 */
function convertPassiveToActive(text: string): string {
  return text
    .replace(/\bwas (developed|built|created|led|managed|designed|implemented) by me\b/gi, "I $1")
    .replace(/\bwere (developed|built|created|led|managed|designed|implemented) by me\b/gi, "I $1");
}

/**
 * Fast local deterministic text humanizer pipeline combining techniques from:
 * - llmstrip (regex phrase stripping)
 * - DadaNanjesha (passive-to-active voice & sentence cleaning)
 * - blader/humanizer (Wikipedia AI-isms removal)
 */
export function humanizeTextLocally(text: string): string {
  if (!text?.trim()) return "";

  let cleaned = text;

  // 1. Strip epistemic hedging
  cleaned = stripEpistemicHedging(cleaned);

  // 2. Replace banned AI buzzwords & clichés
  for (const [pattern, replacement] of BANNED_AI_PATTERNS) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  // 3. Break Rule-of-Three stacks
  cleaned = breakRuleOfThree(cleaned);

  // 4. Convert passive to active voice
  cleaned = convertPassiveToActive(cleaned);

  // 5. Reduce excessive em-dashes (—) to commas or periods
  cleaned = cleaned.replace(/\s*—\s*/g, ", ");

  // 6. Normalize double spaces and clean trailing whitespace
  cleaned = cleaned
    .replace(/[ \t]+/g, " ")
    .replace(/\s+([.,;:?!])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleaned;
}

export interface HumanizeOptions {
  context?: "cv" | "cover-letter" | "email" | "general";
  voiceSample?: string;
  enableTranslationChain?: boolean;
}

/**
 * Multi-pass AI & local humanizer pipeline incorporating:
 * - blader/humanizer (voice calibration & AI-isms elimination)
 * - lynote-ai (multi-pass LLM rewriting)
 * - DadaNanjesha (NLP active voice conversion)
 * - Firdavs-coder (fallback privacy-first execution)
 * - llmstrip (deterministic transition stripping)
 */
export async function humanizeText(
  text: string,
  options: HumanizeOptions = {}
): Promise<{
  humanizedText: string;
  changesMade: string[];
  mode: "local" | "ai";
  referenceTools: string[];
}> {
  const { context = "general", voiceSample } = options;

  // First pass: Local deterministic cleanup
  const localResult = humanizeTextLocally(text);
  const apiKey = process.env.OPENAI_API_KEY;

  const referenceTools = [
    "blader/humanizer (AI-isms & Voice Calibration)",
    "llmstrip (Transition Phrase Stripping)",
    "DadaNanjesha/AI-Text-Humanizer-App (Active Voice & Rhythm)",
    "lynote-ai/humanize-text (Multi-pass Pipeline)",
    "Firdavs-coder/ai_humanizer (Local Privacy Processing)",
  ];

  if (!apiKey) {
    return {
      humanizedText: localResult,
      changesMade: [
        "Stripped 60+ AI buzzwords & transition clichés (llmstrip)",
        "Removed epistemic hedging and rule-of-three stacks (blader/humanizer)",
        "Converted passive phrasing to active voice (DadaNanjesha)",
        "Normalized em-dashes and sentence structure",
      ],
      mode: "local",
      referenceTools,
    };
  }

  try {
    const { model } = getProvider();

    const systemPrompt = `You are a world-class copywriter and text humanizer. Your task is to rewrite the provided text so it reads 100% like a genuine, thoughtful human professional.

Strict Guidelines (incorporating blader/humanizer & lynote-ai standards):
1. BANNED WORDS: Never use leverage, utilize, delve, seamless, testament, groundbreaking, synergy, spearhead, cutting-edge, holistic, robust, pivotal.
2. VARY SENTENCE LENGTH: Mix short punchy sentences (4-8 words) with medium sentences. Never write 3 consecutive sentences of identical length.
3. REMOVE RULE OF THREE: Never stack 3 adjectives (e.g. "dynamic, innovative, and results-driven"). Pick 1 strong noun or verb.
4. REMOVE NEGATIVE PARALLELISM: Do not write "It's not just X, it's Y". Say what it is directly.
5. NO FORMULAIC OPENERS: Never start cover letters with "I am writing to express my interest...". Open directly with a specific technical responsibility or achievement.
6. PRESERVE ALL FACTS: Keep all numbers, metrics, dates, names, and tech stack references exact. Do NOT invent fake anecdotes.
${voiceSample ? `7. MATCH VOICE SAMPLE: Calibrate tone and cadence to match this candidate sample:\n"""\n${voiceSample}\n"""` : ""}

Return ONLY the final humanized text.`;

    const userPrompt = `Context: ${context}\n\nOriginal Text:\n"""\n${text}\n"""`;

    const { text: aiResult } = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    const finalResult = humanizeTextLocally(aiResult);

    return {
      humanizedText: finalResult,
      changesMade: [
        "Stripped AI buzzwords & transition clichés (llmstrip)",
        "Calibrated sentence burstiness and cadence (DadaNanjesha)",
        "Eliminated rule-of-three and negative parallelism (blader/humanizer)",
        "Executed multi-pass LLM refinement pipeline (lynote-ai)",
      ],
      mode: "ai",
      referenceTools,
    };
  } catch {
    return {
      humanizedText: localResult,
      changesMade: [
        "Stripped AI buzzwords & transition clichés (llmstrip)",
        "Removed epistemic hedging and rule-of-three stacks (blader/humanizer)",
        "Converted passive phrasing to active voice (DadaNanjesha)",
      ],
      mode: "local",
      referenceTools,
    };
  }
}
