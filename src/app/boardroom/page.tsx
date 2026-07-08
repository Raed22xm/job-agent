"use client";

import { useState } from "react";
import { useCompletion } from "@ai-sdk/react";
import AppShell from "@/components/AppShell";

export default function BoardroomPage() {
  const [jobDescription, setJobDescription] = useState("");

  const { completion, isLoading, complete, error } = useCompletion({
    api: "/api/agent/boardroom",
  });

  const startDebate = () => {
    complete("", {
      body: {
        jobDescription,
        personaId: "default",
      },
    });
  };

  // Basic parser to style the different speakers differently
  const renderDialogue = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("**Recruiter**")) {
        return <div key={i} className="my-2 p-4 rounded-xl bg-primary/10 border border-primary/20 text-blue-900 shadow-sm"><span className="font-bold">Recruiter:</span> {line.replace("**Recruiter**:", "")}</div>;
      }
      if (line.startsWith("**Hiring Manager**")) {
        return <div key={i} className="my-2 p-4 rounded-xl bg-success/10 border border-success/20 text-emerald-900 shadow-sm"><span className="font-bold">Hiring Manager:</span> {line.replace("**Hiring Manager**:", "")}</div>;
      }
      if (line.startsWith("**Reviewer**")) {
        return <div key={i} className="my-2 p-4 rounded-xl bg-violet-50 border border-violet-200 text-violet-900 shadow-sm font-medium"><span className="font-bold">Reviewer:</span> {line.replace("**Reviewer**:", "")}</div>;
      }
      return <p key={i} className="my-1 text-foreground-secondary">{line}</p>;
    });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            The Boardroom
          </h1>
          <p className="mt-2 text-foreground-secondary">
            Multi-Agent Swarm Simulation. Watch three specialized AI agents debate your CV in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-xl border border-border bg-background p-5 shadow-sm">
              <label className="block text-sm font-medium text-foreground mb-2">
                Target Job Description
              </label>
              <textarea
                rows={8}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                className="w-full rounded-lg border border-border bg-background-secondary p-3 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
              />
              <button
                onClick={startDebate}
                disabled={isLoading}
                className="mt-4 w-full rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isLoading ? "Debating..." : "Start Debate"}
              </button>
            </div>
            {error && (
              <div className="rounded-lg bg-danger/10 p-4 border border-danger/20 text-sm text-danger">
                Error starting debate: {error.message}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-background p-6 shadow-sm min-h-[500px]">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-tertiary mb-4">
                Live Debate Feed
              </h2>
              <div className="space-y-2">
                {!completion && !isLoading && (
                  <p className="text-center text-foreground-secondary italic mt-20">
                    The boardroom is quiet. Paste a job description and start the debate.
                  </p>
                )}
                {renderDialogue(completion)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
