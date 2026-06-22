export default function AnalyzerEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.875c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9H5.625c-.621 0-1.125.504-1.125 1.125v8.25c0 .621.504 1.125 1.125 1.125Z"
          />
        </svg>
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-900">No analysis yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
        Paste a job description on the left and click{" "}
        <span className="font-medium text-slate-700">Analyze Job</span> to extract
        keywords, score ATS match against your master CV, and see focus recommendations.
      </p>
    </div>
  );
}
