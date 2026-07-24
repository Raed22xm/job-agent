"use client";

import { useState } from "react";
import type { ScoutedJob } from "@/lib/agent/jobScout";
import type { OutreachDraft } from "@/app/api/agent/outreach/route";

interface OutreachModalProps {
  job: ScoutedJob;
  onClose: () => void;
}

export default function OutreachModal({ job, onClose }: OutreachModalProps) {
  const [draft, setDraft] = useState<OutreachDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [recruiterEmail, setRecruiterEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: job.title,
          company: job.company,
          tags: job.tags,
        }),
      });
      const data = (await res.json()) as { draft: OutreachDraft };
      setDraft(data.draft);
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSendEmail = async () => {
    if (!draft || !recruiterEmail) return;
    setSendingEmail(true);
    setEmailStatus("idle");
    try {
      const res = await fetch("/api/agent/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recruiterEmail,
          subject: draft.emailSubject,
          text: draft.emailBody,
        }),
      });
      if (res.ok) {
        setEmailStatus("success");
      } else {
        setEmailStatus("error");
      }
    } catch {
      setEmailStatus("error");
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-background shadow-2xl border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-primary px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-primary-foreground font-semibold">{job.title}</p>
            <p className="text-primary-foreground/80 text-sm">{job.company}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-primary-foreground/70 hover:text-primary-foreground text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {!draft && (
            <div className="text-center py-4">
              <p className="text-foreground-secondary text-sm mb-4">
                Generate a tailored LinkedIn note and cold email using your verified CV data.
              </p>
              <button
                type="button"
                onClick={generate}
                disabled={loading}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? "Generating…" : "✉ Generate Outreach"}
              </button>
            </div>
          )}

          {draft && (
            <div className="space-y-4">
              {/* LinkedIn Note */}
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
                    LinkedIn Note
                  </p>
                  <button
                    type="button"
                    onClick={() => copy(draft.linkedinNote, "li")}
                    className="text-xs text-primary hover:underline"
                  >
                    {copied === "li" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-sm text-foreground-secondary leading-relaxed">
                  {draft.linkedinNote}
                </p>
                <p className="text-xs text-foreground-tertiary mt-1">
                  {draft.linkedinNote.length}/300 chars
                </p>
              </div>

              {/* Email */}
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
                    Cold Email
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      copy(
                        `Subject: ${draft.emailSubject}\n\n${draft.emailBody}`,
                        "email"
                      )
                    }
                    className="text-xs text-primary hover:underline"
                  >
                    {copied === "email" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-xs font-medium text-foreground-secondary mb-2">
                  Subject: {draft.emailSubject}
                </p>
                <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed mb-4">
                  {draft.emailBody}
                </pre>

                <div className="border-t border-border pt-3 mt-3 flex items-center gap-2">
                  <input
                    type="email"
                    value={recruiterEmail}
                    onChange={(e) => setRecruiterEmail(e.target.value)}
                    placeholder="recruiter@company.com"
                    className="flex-1 rounded-md border border-border px-3 py-1.5 text-sm outline-none ring-primary focus:ring-2 bg-background text-foreground"
                  />
                  <button
                    type="button"
                    onClick={handleSendEmail}
                    disabled={sendingEmail || !recruiterEmail}
                    className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {sendingEmail ? "Sending…" : "Send"}
                  </button>
                </div>
                {emailStatus === "success" && (
                  <p className="text-xs text-success mt-1">✓ Sent successfully</p>
                )}
                {emailStatus === "error" && (
                  <p className="text-xs text-danger mt-1">
                    ✗ Failed to send. Check SMTP in .env
                  </p>
                )}
              </div>

              {/* Follow-up */}
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
                    Follow-up (1 week)
                  </p>
                  <button
                    type="button"
                    onClick={() => copy(draft.followUpMessage, "fu")}
                    className="text-xs text-primary hover:underline"
                  >
                    {copied === "fu" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-sm text-foreground-secondary leading-relaxed">
                  {draft.followUpMessage}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
