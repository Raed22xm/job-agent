import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { username = "octocat" } = body;

    const res = await fetch(`https://api.github.com/users/${username}/events/public`, {
      headers: {
        "User-Agent": "Job-Agent-Subagent",
        "Accept": "application/vnd.github.v3+json",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `GitHub API returned ${res.status}` }, { status: res.status });
    }

    const events = await res.json();
    
    const recentCommits: string[] = [];
    let processedPushEvents = 0;

    for (const event of events) {
      if (event.type === "PushEvent" && event.payload?.commits) {
        processedPushEvents++;
        for (const commit of event.payload.commits) {
          // Filter out merge commits or generic messages
          if (!commit.message.toLowerCase().includes("merge") && commit.message.length > 10) {
            recentCommits.push(`- Repository: ${event.repo.name}. Commit: ${commit.message}`);
          }
        }
      }
      if (processedPushEvents >= 5) break; // Don't overwhelm the RAG
    }

    if (recentCommits.length === 0) {
      return NextResponse.json({ success: true, message: "No recent meaningful commits found." });
    }

    // Save to knowledge base for RAG to pick up
    const knowledgeDir = path.join(process.cwd(), "data", "knowledge");
    if (!fs.existsSync(knowledgeDir)) {
      fs.mkdirSync(knowledgeDir, { recursive: true });
    }

    const mdContent = `# Recent GitHub Activity for ${username}
    
I am highly active on GitHub. Here are some of my most recent coding achievements:
${recentCommits.join("\n")}
`;

    fs.writeFileSync(path.join(knowledgeDir, "github-activity.md"), mdContent);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully synced ${recentCommits.length} recent commits to RAG knowledge base.`,
      commits: recentCommits
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "GitHub Sync failed";
    logger.error("GitHub Sync Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
