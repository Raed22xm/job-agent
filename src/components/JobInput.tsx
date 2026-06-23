"use client";

interface JobInputProps {
  jobDescription: string;
  jobUrl?: string;
  onJobDescriptionChange: (value: string) => void;
  onJobUrlChange?: (value: string) => void;
  onAnalyze: () => void;
  onEnhanceWithAI?: () => void;
  onImportUrl?: () => void;
  onPaste?: () => void;
  isLoading?: boolean;
  isEnhancing?: boolean;
  isImporting?: boolean;
  isAutoAnalyzing?: boolean;
  showEnhanceButton?: boolean;
  analysisMode?: string | null;
  importMessage?: string | null;
  validationError?: string | null;
}

export default function JobInput({
  jobDescription,
  jobUrl = "",
  onJobDescriptionChange,
  onJobUrlChange,
  onAnalyze,
  onEnhanceWithAI,
  onImportUrl,
  onPaste,
  isLoading = false,
  isEnhancing = false,
  isImporting = false,
  isAutoAnalyzing = false,
  showEnhanceButton = false,
  analysisMode = null,
  importMessage = null,
  validationError = null,
}: JobInputProps) {
  const charCount = jobDescription.length;
  const isEmpty = !jobDescription.trim();
  const canImport = Boolean(onImportUrl && jobUrl.trim());

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onAnalyze();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Job Description</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          Paste a posting or import from URL. Local scoring runs instantly; use
          Enhance with AI only when you want tailored summary and cover letter.
        </p>
      </div>

      {onJobUrlChange && (
        <div className="mb-4">
          <label
            htmlFor="job-url"
            className="mb-1.5 block text-xs font-medium text-slate-600"
          >
            Job URL
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="job-url"
              type="url"
              value={jobUrl}
              onChange={(e) => onJobUrlChange(e.target.value)}
              placeholder="https://thehub.io/jobs/..."
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500"
            />
            {onImportUrl && (
              <button
                type="button"
                onClick={onImportUrl}
                disabled={!canImport || isImporting || isLoading}
                className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isImporting ? "Importing…" : "Import URL"}
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Supported: thehub.io, jobindex.dk, linkedin.com/jobs/view/…
          </p>
          {importMessage && (
            <p className="mt-2 text-xs font-medium text-brand-700">{importMessage}</p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="job-description" className="sr-only">
          Job Description
        </label>
        <textarea
          id="job-description"
          value={jobDescription}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
          onPaste={onPaste}
          rows={14}
          placeholder={`Example:\n\nSenior Full-Stack Developer\nAcme Corp · San Francisco, CA (Hybrid)\n\nRequirements:\n- 5+ years experience with TypeScript, React, and Node.js\n- Experience with PostgreSQL and Docker\n- Strong communication and Agile experience\n\nResponsibilities:\n- Build customer-facing web applications\n- Design REST APIs and collaborate with product teams`}
          className={`w-full resize-y rounded-xl border px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none transition focus:ring-2 ${
            validationError
              ? "border-rose-300 ring-rose-200 focus:border-rose-400"
              : "border-slate-300 ring-brand-500 focus:border-brand-400"
          }`}
          aria-invalid={Boolean(validationError)}
          aria-describedby={validationError ? "job-description-error" : "job-description-hint"}
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p id="job-description-hint" className="text-xs text-slate-500">
            {isEmpty
              ? "Paste a posting or import from URL."
              : `${charCount.toLocaleString()} characters`}
          </p>
          {validationError && (
            <p id="job-description-error" className="text-xs font-medium text-rose-600">
              {validationError}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {isAutoAnalyzing && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brand-500" />
            Scoring locally…
          </span>
        )}
        {analysisMode === "local" && showEnhanceButton && onEnhanceWithAI && (
          <button
            type="button"
            disabled={isEnhancing || isLoading || isImporting}
            onClick={onEnhanceWithAI}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-300 bg-brand-50 px-5 py-2.5 text-sm font-semibold text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isEnhancing ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-700" />
                Enhancing…
              </>
            ) : (
              "Enhance with AI"
            )}
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading || isImporting || isEnhancing}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading && !isEnhancing ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Analyzing...
            </>
          ) : (
            "Analyze (local)"
          )}
        </button>
        {!isEmpty && !isLoading && (
          <button
            type="button"
            onClick={() => onJobDescriptionChange("")}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
