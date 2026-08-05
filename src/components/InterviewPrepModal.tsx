"use client";

import { useState, useEffect, useMemo } from "react";
import type { Application } from "@/types";
import type { InterviewPrepResult } from "@/app/api/agent/interview-prep/route";

interface InterviewPrepModalProps {
  application: Application;
  onClose: () => void;
}

export default function InterviewPrepModal({ application, onClose }: InterviewPrepModalProps) {
  const [prep, setPrep] = useState<InterviewPrepResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"questions" | "stories">("questions");

  useEffect(() => {
    async function fetchPrep() {
      try {
        const res = await fetch("/api/agent/interview-prep", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobTitle: application.jobTitle,
            company: application.company,
            jobDescription: application.job?.rawText || application.notes || "",
          }),
        });

        if (!res.ok) throw new Error("Failed to generate prep guide");
        const data = await res.json();
        setPrep(data.prep);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    void fetchPrep();
  }, [application]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-background shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-background-secondary">
          <div>
            <h2 className="text-lg font-bold text-foreground">Interview Prep Guide</h2>
            <p className="text-sm text-foreground-secondary mt-0.5">
              {application.jobTitle} at {application.company}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-foreground-tertiary hover:bg-border hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-4xl animate-pulse mb-4">🧠</span>
              <p className="text-foreground-secondary font-medium">Analyzing job and CV...</p>
              <p className="text-sm text-foreground-tertiary mt-2">Generating customized questions</p>
            </div>
          ) : error ? (
            <div className="rounded-lg bg-danger/10 p-4 text-danger text-center">
              {error}
            </div>
          ) : prep ? (
            <>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <h3 className="font-semibold text-primary mb-1">Company Context</h3>
                <p className="text-sm text-foreground-secondary">{prep.companyContext}</p>
              </div>

              <div className="space-y-4">
                {/* Tab Switcher */}
                <div className="flex gap-2 border-b border-border pb-2">
                  <button
                    type="button"
                    onClick={() => setTab("questions")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      tab === "questions"
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground-secondary hover:bg-border"
                    }`}
                  >
                    Questions ({prep.questions.length})
                  </button>
                  {prep.starStories && prep.starStories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTab("stories")}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        tab === "stories"
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground-secondary hover:bg-border"
                      }`}
                    >
                      STAR Stories ({prep.starStories.length})
                    </button>
                  )}
                </div>

                {tab === "questions" && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-foreground text-lg">High-Probability Questions</h3>
                    {prep.questions.map((q, idx) => (
                      <div key={idx} className="rounded-xl border border-border bg-background-secondary p-5 space-y-3">
                        <div className="flex items-start gap-2">
                          <p className="font-semibold text-foreground flex-1">
                            <span className="text-primary mr-2">Q{idx + 1}.</span>
                            {q.question}
                          </p>
                          {q.category && (
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                q.category === "technical"
                                  ? "bg-blue-100 text-blue-800"
                                  : q.category === "behavioral"
                                  ? "bg-purple-100 text-purple-800"
                                  : q.category === "cultural"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {q.category}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-foreground-tertiary bg-background p-3 rounded-lg">
                          <span className="font-medium text-foreground-secondary">Why they ask:</span> {q.whyTheyAsk}
                        </div>
                        <div className="text-sm">
                          <span className="font-semibold text-foreground-secondary block mb-1">Suggested Answer (STAR):</span>
                          <p className="text-foreground-secondary leading-relaxed">{q.suggestedAnswerFramework}</p>
                        </div>
                        <div className="text-xs font-medium text-success bg-success/10 inline-block px-2 py-1 rounded">
                          CV Ref: {q.cvReference}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {tab === "stories" && prep.starStories && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-foreground text-lg">Reusable STAR Stories</h3>
                    <p className="text-sm text-foreground-secondary">
                      These pre-built stories can be adapted to many behavioral questions. Practice telling each in under 2 minutes.
                    </p>
                    {prep.starStories.map((story, idx) => (
                      <div key={idx} className="rounded-xl border border-border bg-background-secondary p-5 space-y-3">
                        <h4 className="font-semibold text-foreground">{story.title}</h4>
                        <div className="grid gap-2">
                          <div className="rounded-lg bg-background p-3">
                            <span className="text-xs font-bold text-primary uppercase tracking-wide">S — Situation</span>
                            <p className="mt-1 text-sm text-foreground-secondary">{story.situation}</p>
                          </div>
                          <div className="rounded-lg bg-background p-3">
                            <span className="text-xs font-bold text-primary uppercase tracking-wide">T — Task</span>
                            <p className="mt-1 text-sm text-foreground-secondary">{story.task}</p>
                          </div>
                          <div className="rounded-lg bg-background p-3">
                            <span className="text-xs font-bold text-primary uppercase tracking-wide">A — Action</span>
                            <p className="mt-1 text-sm text-foreground-secondary">{story.action}</p>
                          </div>
                          <div className="rounded-lg bg-background p-3">
                            <span className="text-xs font-bold text-success uppercase tracking-wide">R — Result</span>
                            <p className="mt-1 text-sm text-foreground-secondary">{story.result}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="text-[10px] font-medium uppercase tracking-wide text-foreground-tertiary">Usable for:</span>
                          {story.usableFor.map((use) => (
                            <span
                              key={use}
                              className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                            >
                              {use}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-warning/5 p-5 mt-6">
                <h3 className="font-bold text-warning mb-2">Weakness Strategy</h3>
                <p className="text-sm text-foreground-secondary leading-relaxed">{prep.weaknessStrategy}</p>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
