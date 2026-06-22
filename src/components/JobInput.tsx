"use client";

interface JobInputProps {
  jobDescription: string;
  jobUrl?: string;
  onJobDescriptionChange: (value: string) => void;
  onJobUrlChange?: (value: string) => void;
  onAnalyze: () => void;
  onPaste?: () => void;
  isLoading?: boolean;
  isAutoAnalyzing?: boolean;
  validationError?: string | null;
}

export default function JobInput({
  jobDescription,
  jobUrl = "",
  onJobDescriptionChange,
  onJobUrlChange,
  onAnalyze,
  onPaste,
  isLoading = false,
  isAutoAnalyzing = false,
  validationError = null,
}: JobInputProps) {
  const charCount = jobDescription.length;
  const isEmpty = !jobDescription.trim();

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
          Paste the full posting below. Analysis runs locally with weighted ATS
          scoring — no auto-apply.
        </p>
      </div>

      {onJobUrlChange && (
        <div className="mb-4">
          <label
            htmlFor="job-url"
            className="mb-1.5 block text-xs font-medium text-slate-600"
          >
            Source URL (optional)
          </label>
          <input
            id="job-url"
            type="url"
            value={jobUrl}
            onChange={(e) => onJobUrlChange(e.target.value)}
            placeholder="https://thehub.io/jobs/..."
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            Used as a company hint when the posting text does not name the employer.
          </p>
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
              ? "Paste at least a few lines for analysis."
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
            Auto-analyzing…
          </span>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Analyzing...
            </>
          ) : (
            "Analyze Job"
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
