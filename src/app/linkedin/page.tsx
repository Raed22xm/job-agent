"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useJobAgent } from "@/context/JobAgentContext";
import { generateLinkedInMessage } from "@/lib/generateLinkedInMessage";
import { getMasterCV } from "@/lib/matchCV";

export default function LinkedInMessagePage() {
  const { parsedJob, matchResult } = useJobAgent();
  const cv = getMasterCV();

  const draft = useMemo(() => {
    if (!parsedJob) return null;
    return generateLinkedInMessage(cv, parsedJob, matchResult);
  }, [cv, parsedJob, matchResult]);

  if (!parsedJob || !draft) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h1 className="text-xl font-semibold text-slate-900">LinkedIn Outreach</h1>
        <p className="mt-2 text-sm text-slate-600">
          Analyze a job first to draft a short connection note or InMail from verified
          CV data.
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
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Human review required
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          LinkedIn Outreach
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Local draft for {parsedJob.title} at {parsedJob.company}. Edit before
          sending — never auto-message on LinkedIn.
        </p>
      </header>

      <DraftCard
        title="Connection note (2–4 sentences)"
        body={draft.connectionNote}
      />
      <DraftCard title="InMail draft" body={draft.inMail} multiline />

      <p className="text-xs text-slate-500">
        For deeper tailoring, use Cursor chat with{" "}
        <code className="rounded bg-slate-100 px-1">prompts/linkedin-message-prompt.md</code>{" "}
        and save to{" "}
        <code className="rounded bg-slate-100 px-1">data/outputs/linkedin-messages/</code>.
      </p>
    </div>
  );
}

function DraftCard({
  title,
  body,
  multiline = false,
}: {
  title: string;
  body: string;
  multiline?: boolean;
}) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(body);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Copy
        </button>
      </div>
      <div className="px-6 py-5">
        {multiline ? (
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-800">
            {body}
          </pre>
        ) : (
          <p className="text-sm leading-relaxed text-slate-800">{body}</p>
        )}
      </div>
    </section>
  );
}
