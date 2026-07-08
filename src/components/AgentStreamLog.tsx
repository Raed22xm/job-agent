"use client";

import { useEffect, useRef } from "react";

interface LogEntry {
  type: "info" | "success" | "error" | "thinking";
  message: string;
  timestamp?: string;
}

interface AgentStreamLogProps {
  entries: LogEntry[];
  isRunning: boolean;
}

export default function AgentStreamLog({ entries, isRunning }: AgentStreamLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div className="rounded-xl border border-border bg-background-secondary shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
        <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
          agent — job-search-pipeline
        </h3>
        {isRunning && (
          <span className="text-xs text-warning animate-pulse flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
            running
          </span>
        )}
      </div>
      <div ref={scrollRef} className="max-h-64 overflow-y-auto p-4 space-y-3">
        {entries.length === 0 && !isRunning && (
          <div className="text-foreground-tertiary text-sm italic">
            Waiting to start...
          </div>
        )}
        {entries.map((entry, i) => (
          <div key={i} className="flex gap-3 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <span className="shrink-0 mt-0.5">
              {entry.type === "info" && <span className="text-blue-500">ℹ️</span>}
              {entry.type === "thinking" && <span className="text-purple-500 animate-pulse">⚙️</span>}
              {entry.type === "success" && <span className="text-success">✓</span>}
              {entry.type === "error" && <span className="text-danger">❌</span>}
            </span>
            <span className={`leading-relaxed ${
              entry.type === "error" ? "text-danger font-medium" : 
              entry.type === "success" ? "text-foreground font-medium" : 
              "text-foreground-secondary"
            }`}>
              {entry.message}
            </span>
          </div>
        ))}
        {isRunning && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-warning w-4 text-center">
              <span className="inline-block animate-spin">⟳</span>
            </span>
            <span className="text-foreground-secondary animate-pulse">Working…</span>
          </div>
        )}

      </div>
    </div>
  );
}

export type { LogEntry };
