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
      className="glass-card"
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">Job Description</h2>
        <p className="mt-1 text-sm leading-relaxed text-foreground-secondary">
          Paste a posting or import from URL. Local scoring runs instantly; use
          Enhance with AI only when you want tailored summary and cover letter.
        </p>
      </div>

      {onJobUrlChange && (
        <div className="mb-4">
          <label
            htmlFor="job-url"
            className="mb-1.5 block text-xs font-medium text-foreground-secondary"
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
              className="field-input"
            />
            {onImportUrl && (
              <button
                type="button"
                onClick={onImportUrl}
                disabled={!canImport || isImporting || isLoading}
                className="btn-secondary shrink-0"
              >
                {isImporting ? "Importing…" : "Import URL"}
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-foreground-tertiary">
            Supported: thehub.io, jobindex.dk, linkedin.com/jobs/view/…
          </p>
          {importMessage && (
            <p className="mt-2 text-xs font-medium text-primary">{importMessage}</p>
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
          className={`field-textarea resize-y ${
            validationError
              ? "border-danger"
              : ""
          }`}
          style={validationError ? { boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.15)" } : undefined}
          aria-invalid={Boolean(validationError)}
          aria-describedby={validationError ? "job-description-error" : "job-description-hint"}
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p id="job-description-hint" className="text-xs text-foreground-tertiary">
            {isEmpty
              ? "Paste a posting or import from URL."
              : `${charCount.toLocaleString()} characters`}
          </p>
          {validationError && (
            <p id="job-description-error" className="text-xs font-medium text-danger">
              {validationError}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {isAutoAnalyzing && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
            Scoring locally…
          </span>
        )}
        {analysisMode === "local" && showEnhanceButton && onEnhanceWithAI && (
          <button
            type="button"
            disabled={isEnhancing || isLoading || isImporting}
            onClick={onEnhanceWithAI}
            className="btn-secondary"
            style={{ borderColor: "rgba(16, 185, 129, 0.3)", color: "var(--primary)" }}
          >
            {isEnhancing ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
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
          className="btn-primary"
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
            className="btn-ghost"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
