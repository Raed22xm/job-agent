import { NextRequest, NextResponse } from "next/server";

export interface ToolScoutResult {
  title: string;
  category: "mcp-server" | "github-repo" | "npm-package" | "ai-skill";
  description: string;
  url: string;
  starsOrDownloads?: string;
  privacy: "local-first" | "api-required" | "hybrid";
  setupCommand: string;
  relevance: string;
}

const FEATURED_SCOUTED_TOOLS: ToolScoutResult[] = [
  {
    title: "cv-forge-mcp",
    category: "mcp-server",
    description: "Model Context Protocol server for local ATS-optimized CV & resume generation.",
    url: "https://github.com/topics/mcp-server",
    privacy: "local-first",
    setupCommand: "npx -y cv-forge-mcp start",
    relevance: "Provides structured JSON to ATS-compliant DOCX/PDF rendering via MCP.",
  },
  {
    title: "magic-resume-mcp",
    category: "mcp-server",
    description: "MCP server that extracts job requirements and performs keyword density alignment.",
    url: "https://glama.ai/mcp/servers",
    privacy: "local-first",
    setupCommand: "npx -y magic-resume-mcp",
    relevance: "Compares CV keyword coverage directly against job descriptions.",
  },
  {
    title: "blader/humanizer",
    category: "ai-skill",
    description: "Open-source agent skill based on Wikipedia's Signs of AI Writing catalog.",
    url: "https://github.com/blader/humanizer",
    starsOrDownloads: "1.2k ⭐",
    privacy: "local-first",
    setupCommand: "Copy to .agents/skills/humanize-text/SKILL.md",
    relevance: "Strips AI-isms (leverage, utilize, delve) to pass human & AI checks.",
  },
  {
    title: "lynote-ai/humanize-text",
    category: "github-repo",
    description: "Python toolkit with multi-pass translation chaining for breaking LLM writing patterns.",
    url: "https://github.com/lynote-ai/humanize-text",
    starsOrDownloads: "850 ⭐",
    privacy: "hybrid",
    setupCommand: "pip install humanize-text",
    relevance: "Multi-pass rewriting for cover letters and long-form bio copy.",
  },
  {
    title: "DadaNanjesha/AI-Text-Humanizer-App",
    category: "github-repo",
    description: "spaCy and NLTK rule-based text humanization engine.",
    url: "https://github.com/DadaNanjesha/AI-Text-Humanizer-App",
    starsOrDownloads: "1.5k ⭐",
    privacy: "local-first",
    setupCommand: "git clone https://github.com/DadaNanjesha/AI-Text-Humanizer-App",
    relevance: "Offline NLP transformation without external API fees.",
  },
  {
    title: "linkedin-outreach-mcp",
    category: "mcp-server",
    description: "MCP server for generating high-converting recruiter connection notes and cold emails.",
    url: "https://smithery.ai",
    privacy: "local-first",
    setupCommand: "npx -y linkedin-outreach-mcp",
    relevance: "Directly drafts recruiter connection notes and follow-up templates.",
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.toLowerCase().trim() || "";

  if (!query) {
    return NextResponse.json({ tools: FEATURED_SCOUTED_TOOLS, count: FEATURED_SCOUTED_TOOLS.length });
  }

  const filtered = FEATURED_SCOUTED_TOOLS.filter(
    (tool) =>
      tool.title.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.relevance.toLowerCase().includes(query) ||
      tool.category.toLowerCase().includes(query)
  );

  return NextResponse.json({ tools: filtered, count: filtered.length });
}
