"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AnalyzerEmptyState from "@/components/AnalyzerEmptyState";
import CVFocusAreas from "@/components/CVFocusAreas";
import JobDetailsCard from "@/components/JobDetailsCard";
import JobInput from "@/components/JobInput";
import KeywordList from "@/components/KeywordList";
import MatchScoreCard from "@/components/MatchScoreCard";
import { useJobAgent } from "@/context/JobAgentContext";

export default function AnalyzerPage() {
  const {
    jobUrl,
    jobDescription,
    parsedJob,
    matchResult,
    setJobUrl,
    setJobDescription,
    analyzeJob,
    saveToTracker,
  } = useJobAgent();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isAutoAnalyzing, setIsAutoAnalyzing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runAnalysis = useCallback(() => {
    setError(null);
    setValidationError(null);
    setSavedMessage(null);

    if (!jobDescription.trim()) return;

    setIsLoading(true);
    try {
      analyzeJob();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong during analysis.";
      setError(message);
      setValidationError(message);
    } finally {
      setIsLoading(false);
      setIsAutoAnalyzing(false);
    }
  }, [analyzeJob, jobDescription]);

  // Auto-analyze with 600 ms debounce whenever the job description changes
  useEffect(() => {
    if (!jobDescription.trim()) {
      setIsAutoAnalyzing(false);
      return;
    }
    setIsAutoAnalyzing(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runAnalysis();
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobDescription]);

  const handleAnalyze = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setIsAutoAnalyzing(false);
    runAnalysis();
  };

  // Instant trigger on paste — skip the debounce wait
  const handlePaste = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setIsAutoAnalyzing(false);
    // Small tick to let React flush the textarea value first
    debounceRef.current = setTimeout(() => {
      runAnalysis();
    }, 50);
  }, [runAnalysis]);

  const handleSave = () => {
    const saved = saveToTracker();
    if (saved) {
      setSavedMessage(`Saved "${saved.job.title}" to Application Tracker.`);
    }
  };

  const showResults = Boolean(parsedJob && matchResult);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          v0.2 · Local demo analysis
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Job Analyzer
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Paste a job description to extract structured fields, compare ATS keywords against{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">master-cv.json</code>,
          and get honest focus recommendations — no invented experience.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_1fr]">
        <JobInput
          jobDescription={jobDescription}
          jobUrl={jobUrl}
          onJobDescriptionChange={(value) => {
            setJobDescription(value);
            if (validationError) setValidationError(null);
          }}
          onJobUrlChange={setJobUrl}
          onAnalyze={handleAnalyze}
          onPaste={handlePaste}
          isLoading={isLoading || isAutoAnalyzing}
          validationError={validationError}
          isAutoAnalyzing={isAutoAnalyzing}
        />

        <div className="space-y-6">
          {error && !showResults && (
            <div
              role="alert"
              className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800"
            >
              <p className="font-semibold">Analysis failed</p>
              <p className="mt-1">{error}</p>
            </div>
          )}

          {!showResults && !error && <AnalyzerEmptyState />}

          {showResults && parsedJob && matchResult && (
            <>
              <JobDetailsCard
                job={parsedJob}
                onSave={handleSave}
                savedMessage={savedMessage}
              />

              <MatchScoreCard
                score={matchResult.score}
                summary={matchResult.summary}
                matchedCount={matchResult.matchedKeywords.length}
                missingCount={matchResult.missingKeywords.length}
                scoreBreakdown={matchResult.scoreBreakdown}
              />

              <div className="grid gap-4 lg:grid-cols-2">
                <KeywordList
                  title="Matching Keywords"
                  keywords={matchResult.matchedKeywords}
                  variant="matched"
                  emptyMessage="No matching keywords found in your verified CV."
                />
                <KeywordList
                  title="Missing Keywords"
                  keywords={matchResult.missingKeywords}
                  variant="missing"
                  emptyMessage="No missing keywords — strong coverage from your CV."
                />
              </div>

              <CVFocusAreas areas={matchResult.recommendedFocusAreas ?? []} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
