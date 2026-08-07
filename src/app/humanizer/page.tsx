"use client";

import { useState } from "react";

const EXAMPLE_DRAFTS = [
  {
    title: "AI-style Cover Letter Bullet",
    text: "Leveraged cutting-edge cloud technologies to seamlessly facilitate cross-functional collaboration and drive impactful synergies in a fast-paced environment.",
    context: "cover-letter",
  },
  {
    title: "Overused Buzzword CV Summary",
    text: "Results-driven individual and thought leader with a holistic approach to building groundbreaking software. Thrilled to utilize my multifaceted skill set to hit the ground running.",
    context: "cv",
  },
  {
    title: "Robotic Cold Email",
    text: "I am writing to express my interest in the Software Engineer position. In today's rapidly evolving digital landscape, it is worth noting that my experience will add immense value.",
    context: "email",
  },
];

export default function HumanizerPage() {
  const [inputText, setInputText] = useState("");
  const [context, setContext] = useState<"general" | "cv" | "cover-letter" | "email">("cover-letter");
  const [voiceSample, setVoiceSample] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    humanizedText: string;
    detectedIssues: string[];
    changesMade: string[];
    mode: "local" | "ai";
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleHumanize = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          context,
          voiceSample: voiceSample.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Humanize request failed");
      }
      const data = await res.json();
      setResult(data);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to rewrite text.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.humanizedText) return;
    void navigator.clipboard.writeText(result.humanizedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl">✍️</span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Text Humanizer
          </h1>
          <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
            Rewrite only
          </span>
        </div>
        <p className="text-sm text-foreground-secondary leading-relaxed">
          Generate a complete, natural alternative while preserving names, facts, numbers, technologies, and links.
        </p>
      </div>

      {/* Main Tool Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Column */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">
              Input Text to Humanize
            </label>
            <select
              value={context}
              onChange={(e) => setContext(e.target.value as any)}
              className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground outline-none focus:ring-2 ring-primary"
            >
              <option value="cover-letter">Cover Letter</option>
              <option value="cv">CV Bullet / Summary</option>
              <option value="email">Cold Email / Outreach</option>
              <option value="general">General Copy</option>
            </select>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your AI-generated text, CV bullet, or cover letter here..."
            rows={8}
            className="w-full rounded-xl border border-border bg-background p-4 text-sm text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary font-sans leading-relaxed"
          />

          <div>
            <label className="text-xs font-medium text-foreground-secondary block mb-1">
              Optional: Voice Calibration Sample (Your Writing Tone)
            </label>
            <input
              type="text"
              value={voiceSample}
              onChange={(e) => setVoiceSample(e.target.value)}
              placeholder="e.g. Concise, direct, technical, conversational..."
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-foreground-tertiary outline-none focus:ring-2 ring-primary"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex flex-wrap gap-1">
              {EXAMPLE_DRAFTS.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setInputText(ex.text);
                    setContext(ex.context as any);
                  }}
                  className="rounded-md bg-background-secondary border border-border px-2 py-1 text-[11px] font-medium text-foreground-secondary hover:text-foreground hover:bg-border transition-colors"
                >
                  Try Ex {i + 1}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleHumanize}
              disabled={loading || !inputText.trim()}
              className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all shadow-md"
            >
              {loading ? "Rewriting…" : "✨ Generate Alternative"}
            </button>
          </div>
        </div>

        {/* Output Column */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-foreground">
                Humanized Output
              </label>
              {result && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  {copied ? "✓ Copied!" : "📋 Copy Text"}
                </button>
              )}
            </div>

            {result ? (
              <div className="space-y-4">
                <textarea
                  value={result.humanizedText}
                  onChange={(event) => setResult({ ...result, humanizedText: event.target.value })}
                  rows={10}
                  aria-label="Editable rewritten text"
                  className="w-full rounded-xl border border-success/30 bg-success/5 p-4 text-sm text-foreground leading-relaxed font-sans outline-none focus:ring-2 focus:ring-primary"
                />

                {result.detectedIssues.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-foreground-secondary">Issues detected</p>
                    <ul className="space-y-1">
                      {result.detectedIssues.map((issue) => <li key={issue} className="text-xs text-foreground-secondary">• {issue}</li>)}
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-foreground-secondary">
                    Transformations Applied
                  </p>
                  <ul className="space-y-1">
                    {result.changesMade.map((change, idx) => (
                      <li key={idx} className="text-xs text-foreground-secondary flex items-center gap-1.5">
                        <span className="text-success font-bold">✓</span> {change}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border rounded-xl">
                <span className="text-3xl mb-2 opacity-50">✨</span>
                <p className="text-sm font-medium text-foreground-secondary">
                  Your rewritten alternative will appear here
                </p>
                <p className="text-xs text-foreground-tertiary mt-1">
                  Paste a draft on the left and generate a replacement
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
