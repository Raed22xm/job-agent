/**
 * AI provider configuration. Server-side only.
 * Install when ready: npm install ai @ai-sdk/openai
 *
 * Until then, all features use local heuristic fallbacks.
 */

export type AIProvider = "openai" | "none";

/** Default model — widely available on free/tier-1 OpenAI projects. */
export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

export interface AIConfig {
  provider: AIProvider;
  isConfigured: boolean;
  model: string;
}

export function resolveOpenAIModel(): string {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

export function getAIConfig(): AIConfig {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (apiKey) {
    return {
      provider: "openai",
      isConfigured: true,
      model: resolveOpenAIModel(),
    };
  }

  return {
    provider: "none",
    isConfigured: false,
    model: "",
  };
}

export function requireAI(): AIConfig {
  const config = getAIConfig();
  if (!config.isConfigured) {
    throw new Error(
      "AI provider not configured. Set OPENAI_API_KEY or use local analysis in the browser."
    );
  }
  return config;
}
