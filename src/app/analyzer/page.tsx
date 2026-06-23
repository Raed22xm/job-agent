"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AnalyzerEmptyState from "@/components/AnalyzerEmptyState";
import CVFocusAreas from "@/components/CVFocusAreas";
import GapHonestyPanel from "@/components/GapHonestyPanel";
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
    analysisMode,
    setJobUrl,
    setJobDescription,
    importJobFromUrl,
    analyzeJob,
    enhanceWithAI,
    saveToTracker,
  } = useJobAgent();

  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isAutoAnalyzing, setIsAutoAnalyzing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runLocalAnalysis = useCallback(async () => {
    setError(null);
    setValidationError(null);
    setSavedMessage(null);

    if (!jobDescription.trim() && !jobUrl.trim()) return;

    setIsLoading(true);
    try {
      await analyzeJob({ enhanceWithAI: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong during analysis.";
      setError(message);
      setValidationError(message);
    } finally {
      setIsLoading(false);
      setIsAutoAnalyzing(false);
    }
  }, [analyzeJob, jobDescription, jobUrl]);

  const handleEnhanceWithAI = useCallback(async () => {
    setError(null);
    setSavedMessage(null);
    setIsEnhancing(true);
    try {
      await enhanceWithAI();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "AI enhancement failed.";
      setError(message);
    } finally {
      setIsEnhancing(false);
    }
  }, [enhanceWithAI]);

  const handleImportUrl = useCallback(async () => {
    setError(null);
    setValidationError(null);
    setImportMessage(null);
    setSavedMessage(null);
    setIsImporting(true);

    try {
      const result = await importJobFromUrl();
      setImportMessage(result.message);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not import job from URL.";
      setError(message);
      setValidationError(message);
    } finally {
      setIsImporting(false);
    }
  }, [importJobFromUrl]);

  // Local-only auto-analyze — no AI token burn while typing
  useEffect(() => {
    if (!jobDescription.trim()) {
      setIsAutoAnalyzing(false);
      return;
    }
    setIsAutoAnalyzing(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runLocalAnalysis();
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobDescription]);

  const handleAnalyze = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setIsAutoAnalyzing(false);
    runLocalAnalysis();
  };

  const handlePaste = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setIsAutoAnalyzing(false);
    debounceRef.current = setTimeout(() => {
      runLocalAnalysis();
    }, 50);
  }, [runLocalAnalysis]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saved = await saveToTracker();
      if (saved) {
        const paths = [saved.cvVersion, saved.coverLetterOutputPath]
          .filter(Boolean)
          .join(", ");
        setSavedMessage(
          paths
            ? `Saved "${saved.jobTitle}" to tracker. Files: ${paths}`
            : `Saved "${saved.jobTitle}" to Application Tracker.`
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const showResults = Boolean(parsedJob && matchResult);

  const modeLabel =
    analysisMode === "ai"
      ? "AI-enhanced"
      : analysisMode === "ai-fallback"
        ? "Local (AI unavailable)"
        : "Local scoring";

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          v0.3 · {modeLabel}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Job Analyzer
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Instant local match score and keywords. Optional AI enhancement for
          tailored summary and cover letter — you choose when to spend tokens.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_1fr]">
        <JobInput
          jobDescription={jobDescription}
          jobUrl={jobUrl}
          analysisMode={analysisMode}
          showEnhanceButton={showResults && analysisMode !== "ai"}
          onJobDescriptionChange={(value) => {
            setJobDescription(value);
            if (validationError) setValidationError(null);
          }}
          onJobUrlChange={(value) => {
            setJobUrl(value);
            if (importMessage) setImportMessage(null);
          }}
          onAnalyze={handleAnalyze}
          onEnhanceWithAI={handleEnhanceWithAI}
          onImportUrl={handleImportUrl}
          onPaste={handlePaste}
          isLoading={isLoading}
          isEnhancing={isEnhancing}
          isImporting={isImporting}
          importMessage={importMessage}
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
                isSaving={isSaving}
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

              <GapHonestyPanel missingKeywords={matchResult.missingKeywords} />

              <CVFocusAreas areas={matchResult.recommendedFocusAreas ?? []} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
