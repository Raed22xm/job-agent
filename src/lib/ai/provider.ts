import { openai } from "@ai-sdk/openai";
import { ollama } from "ollama-ai-provider";

export function getProvider() {
  const providerType = process.env.AI_PROVIDER || "openai";
  
  if (providerType === "ollama") {
    // Return Ollama wrapper with Llama 3 as the default language model
    return {
      model: ollama("llama3") as any,
      embeddingModel: ollama.embedding("nomic-embed-text") as any,
    };
  }

  // Fallback to OpenAI
  const modelName = process.env.OPENAI_MODEL || "gpt-4o";
  return {
    model: openai(modelName) as any,
    embeddingModel: openai.embedding("text-embedding-3-small") as any,
  };
}
