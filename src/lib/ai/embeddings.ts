import { embed } from "ai";
import { getProvider } from "@/lib/ai/provider";

/**
 * Calculates cosine similarity between two vectors.
 * Returns a score between -1 and 1. (1 = identical, 0 = orthogonal, -1 = opposite)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generates an embedding for a given text string using OpenAI.
 */
export async function generateTextEmbedding(text: string): Promise<number[]> {
  const { embeddingModel } = getProvider();
  
  try {
    const { embedding } = await embed({
      model: embeddingModel,
      value: text,
    });
    return embedding;
  } catch (error) {
    console.error("Failed to generate embedding:", error);
    return [];
  }
}
