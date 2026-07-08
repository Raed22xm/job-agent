"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useJobAgent } from "@/context/JobAgentContext";
import type { LinkedInMessageDraft } from "@/lib/generateLinkedInMessage";

export default function LinkedInMessagePage() {
  const { parsedJob, matchResult } = useJobAgent();
  const [draft, setDraft] = useState<LinkedInMessageDraft | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!parsedJob) {
      setDraft(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    void fetch("/api/generate-linkedin-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job: parsedJob, match: matchResult }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = (await response.json()) as {
          error?: string;
          draft?: LinkedInMessageDraft;
        };

        if (!response.ok || !data.draft) {
          throw new Error(data.error ?? `Draft generation failed (${response.status})`);
        }

        setDraft(data.draft);
      })
      .catch((draftError) => {
        if (controller.signal.aborted) return;
        setDraft(null);
        setError(
          draftError instanceof Error
            ? draftError.message
            : "Could not generate LinkedIn draft."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [parsedJob, matchResult]);

  if (!parsedJob || !draft) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
        <h1 className="text-xl font-semibold text-foreground">LinkedIn Outreach</h1>
        <p className="mt-2 text-sm text-foreground-secondary">
          Analyze a job first to draft a short connection note or InMail from verified
          CV data.
        </p>
        <Link
          href="/analyzer"
          className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Go to Job Analyzer
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Human review required
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
          LinkedIn Outreach
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
          Local draft for {parsedJob.title} at {parsedJob.company}. Edit before
          sending — never auto-message on LinkedIn.
        </p>
      </header>

      {isLoading && (
        <p className="text-sm font-medium text-foreground-secondary">
          Generating LinkedIn draft...
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {draft && (
        <>
          <DraftCard
            title="Connection note (2–4 sentences)"
            body={draft.connectionNote}
          />
          <DraftCard title="InMail draft" body={draft.inMail} multiline />
        </>
      )}

      <p className="text-xs text-foreground-secondary">
        For deeper tailoring, use Cursor chat with{" "}
        <code className="rounded bg-background-secondary px-1">prompts/linkedin-message-prompt.md</code>{" "}
        and save to{" "}
        <code className="rounded bg-background-secondary px-1">data/outputs/linkedin-messages/</code>.
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
    <section className="rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground-secondary hover:bg-background-secondary"
        >
          Copy
        </button>
      </div>
      <div className="px-6 py-5">
        {multiline ? (
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
            {body}
          </pre>
        ) : (
          <p className="text-sm leading-relaxed text-foreground">{body}</p>
        )}
      </div>
    </section>
  );
}
