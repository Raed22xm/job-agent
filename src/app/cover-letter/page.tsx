"use client";

import Link from "next/link";
import CoverLetterPreview from "@/components/CoverLetterPreview";
import { useJobAgent } from "@/context/JobAgentContext";

export default function CoverLetterPage() {
  const { generatedCoverLetter, parsedJob } = useJobAgent();

  if (!generatedCoverLetter || !parsedJob) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Cover Letter</h1>
        <p className="mt-2 text-sm text-slate-600">
          Analyze a job first to generate a cover letter draft for review.
        </p>
        <Link
          href="/analyzer"
          className="mt-4 inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Go to Job Analyzer
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cover Letter</h1>
          <p className="mt-1 text-sm text-slate-600">
            Draft for {parsedJob.title} at {parsedJob.company}. Edit before sending — no auto-submit.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-500"
          title="Export will be available in a future version"
        >
          Export PDF/DOCX (soon)
        </button>
      </div>

      <CoverLetterPreview letter={generatedCoverLetter} />
    </div>
  );
}
