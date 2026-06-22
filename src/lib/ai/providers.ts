/**
 * AI provider configuration. Server-side only.
 * Install when ready: npm install ai @ai-sdk/openai
 *
 * Until then, all features use local heuristic fallbacks.
 */

export type AIProvider = "openai" | "anthropic" | "none";

export interface AIConfig {
  provider: AIProvider;
  isConfigured: boolean;
  model: string;
}

export function getAIConfig(): AIConfig {
  if (process.env.OPENAI_API_KEY) {
    return {
      provider: "openai",
      isConfigured: true,
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    };
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return {
      provider: "anthropic",
      isConfigured: true,
      model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest",
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
