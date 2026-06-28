import fs from "fs";
import path from "path";
import { generateTextEmbedding, cosineSimilarity } from "./ai/embeddings";

interface KnowledgeChunk {
  filename: string;
  content: string;
  embedding?: number[];
}

const KNOWLEDGE_DIR = path.join(process.cwd(), "data", "knowledge");
const CACHE_FILE = path.join(process.cwd(), "data", "rag_cache.json");

/**
 * Loads all markdown/txt files from data/knowledge, chunking them simply by paragraph.
 */
function loadKnowledgeFiles(): KnowledgeChunk[] {
  if (!fs.existsSync(KNOWLEDGE_DIR)) return [];
  
  const chunks: KnowledgeChunk[] = [];
  const files = fs.readdirSync(KNOWLEDGE_DIR);
  
  for (const file of files) {
    if (file.endsWith(".md") || file.endsWith(".txt")) {
      const text = fs.readFileSync(path.join(KNOWLEDGE_DIR, file), "utf-8");
      // Split by double newline to get paragraphs
      const paragraphs = text.split("\n\n").filter(p => p.trim().length > 20);
      
      for (const p of paragraphs) {
        chunks.push({
          filename: file,
          content: p.trim(),
        });
      }
    }
  }
  
  return chunks;
}

/**
 * Ensures all chunks have embeddings, using a local JSON cache to avoid redundant API calls.
 */
async function getEmbeddedChunks(): Promise<KnowledgeChunk[]> {
  const chunks = loadKnowledgeFiles();
  let cache: Record<string, number[]> = {};
  
  if (fs.existsSync(CACHE_FILE)) {
    try {
      cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    } catch {
      cache = {};
    }
  }
  
  let cacheUpdated = false;

  for (const chunk of chunks) {
    // We use the content itself as a simple hash key for the cache
    const cacheKey = Buffer.from(chunk.content).toString("base64").substring(0, 255);
    
    if (cache[cacheKey]) {
      chunk.embedding = cache[cacheKey];
    } else {
      console.log(`[RAG] Generating embedding for new chunk in ${chunk.filename}...`);
      chunk.embedding = await generateTextEmbedding(chunk.content);
      if (chunk.embedding && chunk.embedding.length > 0) {
        cache[cacheKey] = chunk.embedding;
        cacheUpdated = true;
      }
    }
  }

  if (cacheUpdated) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
  }

  return chunks.filter(c => c.embedding && c.embedding.length > 0);
}

/**
 * Searches the local knowledge base for the top K most relevant chunks given a query.
 */
export async function searchKnowledgeBase(query: string, topK: number = 2): Promise<string[]> {
  const queryEmbedding = await generateTextEmbedding(query);
  if (!queryEmbedding || queryEmbedding.length === 0) return [];

  const chunks = await getEmbeddedChunks();
  
  // Score chunks
  const scoredChunks = chunks.map(chunk => ({
    ...chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding!),
  }));
  
  // Sort descending by score
  scoredChunks.sort((a, b) => b.score - a.score);
  
  // Return top K contents, mapping them to include filename for context
  return scoredChunks
    .slice(0, topK)
    .filter(c => c.score > 0.4) // minimum relevance threshold
    .map(c => `[From ${c.filename}]: ${c.content}`);
}
