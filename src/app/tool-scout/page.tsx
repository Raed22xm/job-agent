"use client";

import { useEffect, useState } from "react";
import type { ToolScoutResult } from "@/app/api/tool-scout/route";

export default function ToolScoutPage() {
  const [tools, setTools] = useState<ToolScoutResult[]>([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTools() {
      setLoading(true);
      try {
        const url = query
          ? `/api/tool-scout?query=${encodeURIComponent(query)}`
          : "/api/tool-scout";
        const res = await fetch(url);
        const data = await res.json();
        setTools(data.tools || []);
      } catch {
        setTools([]);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchTools, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const filteredTools = tools.filter((tool) =>
    categoryFilter === "all" ? true : tool.category === categoryFilter
  );

  const handleCopyCmd = (cmd: string) => {
    void navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📡</span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Tools & MCP Scout
          </h1>
          <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
            Open-Source Discovery
          </span>
        </div>
        <p className="text-sm text-foreground-secondary leading-relaxed">
          Discover, audit, and integrate open-source CLI tools, MCP (Model Context Protocol) servers, GitHub repositories, and AI skills for job applications and AI workflows.
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between glass-panel p-4 rounded-xl">
        <div className="relative flex-1 w-full">
          <span className="absolute left-3 top-2.5 text-foreground-tertiary text-sm">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools, MCP servers, keywords (e.g. humanizer, cv, linkedin, mcp)..."
            className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-foreground-tertiary outline-none focus:ring-2 ring-primary"
          />
        </div>

        <div className="flex gap-1.5 w-full sm:w-auto">
          {[
            { id: "all", label: "All" },
            { id: "mcp-server", label: "MCP Servers" },
            { id: "ai-skill", label: "AI Skills" },
            { id: "github-repo", label: "GitHub Repos" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                categoryFilter === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-background-secondary border border-border text-foreground-secondary hover:bg-border"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      {loading ? (
        <div className="py-12 text-center text-foreground-secondary text-sm">
          Scouting open-source tools and MCP servers...
        </div>
      ) : filteredTools.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl space-y-2">
          <span className="text-3xl opacity-50">🔍</span>
          <p className="text-sm font-semibold text-foreground">No tools found matching &quot;{query}&quot;</p>
          <p className="text-xs text-foreground-tertiary">Try searching for &quot;mcp&quot;, &quot;cv&quot;, &quot;humanizer&quot;, or &quot;linkedin&quot;.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredTools.map((tool, idx) => (
            <div
              key={idx}
              className="glass-card p-5 rounded-2xl border border-border space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground text-base">{tool.title}</h3>
                    {tool.starsOrDownloads && (
                      <span className="text-[11px] font-medium text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                        {tool.starsOrDownloads}
                      </span>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      tool.category === "mcp-server"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                        : tool.category === "ai-skill"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                    }`}
                  >
                    {tool.category}
                  </span>
                </div>

                <p className="text-xs text-foreground-secondary leading-relaxed">
                  {tool.description}
                </p>

                <div className="rounded-lg bg-background p-2.5 text-xs border border-border/50">
                  <span className="font-semibold text-foreground-secondary block mb-0.5">Why it helps:</span>
                  <p className="text-foreground-tertiary">{tool.relevance}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground-tertiary">
                    Privacy: <strong className="text-foreground">{tool.privacy}</strong>
                  </span>
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    View Repo ↗
                  </a>
                </div>

                <div className="flex items-center justify-between gap-2 rounded-lg bg-background-secondary border border-border px-3 py-1.5 text-xs font-mono">
                  <span className="truncate text-foreground-secondary">{tool.setupCommand}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCmd(tool.setupCommand)}
                    className="shrink-0 text-xs text-primary font-sans font-medium hover:underline"
                  >
                    {copiedCmd === tool.setupCommand ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
