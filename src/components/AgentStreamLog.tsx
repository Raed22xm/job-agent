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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  const iconMap: Record<LogEntry["type"], string> = {
    info: "›",
    success: "✓",
    error: "✗",
    thinking: "⟳",
  };

  const colorMap: Record<LogEntry["type"], string> = {
    info: "text-cyan-400",
    success: "text-emerald-400",
    error: "text-rose-400",
    thinking: "text-amber-400",
  };

  if (entries.length === 0 && !isRunning) return null;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 font-mono text-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-700 px-4 py-2 bg-slate-800">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-rose-500" />
          <span className="h-3 w-3 rounded-full bg-amber-500" />
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
        </div>
        <span className="text-xs text-slate-400 ml-2">agent — job-search-pipeline</span>
        {isRunning && (
          <span className="ml-auto text-xs text-amber-400 animate-pulse">● running</span>
        )}
      </div>
      <div className="max-h-56 overflow-y-auto p-4 space-y-1">
        {entries.map((entry, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className={`${colorMap[entry.type]} shrink-0 w-4 text-center`}>
              {entry.type === "thinking" ? (
                <span className="inline-block animate-spin">{iconMap[entry.type]}</span>
              ) : (
                iconMap[entry.type]
              )}
            </span>
            <span className="text-slate-300 leading-relaxed">{entry.message}</span>
          </div>
        ))}
        {isRunning && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-amber-400 w-4 text-center">
              <span className="inline-block animate-spin">⟳</span>
            </span>
            <span className="text-slate-500 animate-pulse">Working…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export type { LogEntry };
