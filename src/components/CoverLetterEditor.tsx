"use client";

import { useEffect, useRef, useState } from "react";
import type { GeneratedCoverLetter } from "@/types";
import type { CvLanguage } from "@/lib/cvLanguage";
import {
  paragraphsToText,
  textToParagraphs,
} from "@/lib/cv/editHelpers";

type HumanizeIntensity = "conservative" | "balanced" | "aggressive";

const INTENSITY_DEPTH: Record<HumanizeIntensity, number> = {
  conservative: 1,
  balanced: 2,
  aggressive: 3,
};

const INTENSITY_LABELS: Record<HumanizeIntensity, string> = {
  conservative: "Conservative",
  balanced: "Balanced",
  aggressive: "Aggressive",
};

const INTENSITY_TIPS: Record<HumanizeIntensity, string> = {
  conservative: "Fix AI buzzwords and passive voice. Keeps original structure.",
  balanced: "Rewrite sentences freely, vary rhythm. Recommended.",
  aggressive: "Full conversational voice. Maximum restructuring.",
};

interface CoverLetterEditorProps {
  letter: GeneratedCoverLetter;
  onChange: (letter: GeneratedCoverLetter) => void;
  onReset?: () => void;
  language?: CvLanguage;
}

export default function CoverLetterEditor({
  letter,
  onChange,
  onReset,
  language = "english",
}: CoverLetterEditorProps) {
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [intensity, setIntensity] = useState<HumanizeIntensity>("balanced");
  const [humanizeError, setHumanizeError] = useState<string | null>(null);
  const [humanizeMessage, setHumanizeMessage] = useState<string | null>(null);
  const [letterBeforeHumanize, setLetterBeforeHumanize] =
    useState<GeneratedCoverLetter | null>(null);
  const latestLetterRef = useRef(letter);
  const latestLanguageRef = useRef(language);
  const humanizeControllerRef = useRef<AbortController | null>(null);
  const humanizeRequestRef = useRef(0);
  const mountedRef = useRef(true);

  latestLetterRef.current = letter;
  latestLanguageRef.current = language;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      humanizeRequestRef.current += 1;
      humanizeControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    humanizeRequestRef.current += 1;
    humanizeControllerRef.current?.abort();
    humanizeControllerRef.current = null;
    setIsHumanizing(false);
    setLetterBeforeHumanize(null);
    setHumanizeError(null);
    setHumanizeMessage(null);
  }, [language]);

  const updateField = <K extends keyof GeneratedCoverLetter>(
    field: K,
    value: GeneratedCoverLetter[K]
  ) => {
    const nextLetter = { ...latestLetterRef.current, [field]: value };
    latestLetterRef.current = nextLetter;
    onChange(nextLetter);
  };

  const handleHumanize = async () => {
    const sourceText = paragraphsToText(letter.paragraphs).trim();
    if (!sourceText) return;

    humanizeControllerRef.current?.abort();
    const controller = new AbortController();
    const requestId = humanizeRequestRef.current + 1;
    const requestLanguage = language;
    const sourceParagraphCount = letter.paragraphs.length;
    const depth = INTENSITY_DEPTH[intensity];
    humanizeRequestRef.current = requestId;
    humanizeControllerRef.current = controller;
    setIsHumanizing(true);
    setHumanizeError(null);
    setHumanizeMessage(null);

    try {
      const response = await fetch("/api/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sourceText, context: "cover-letter", depth }),
        signal: controller.signal,
      });
      const result = (await response.json()) as {
        error?: string;
        humanizedText?: string;
        mode?: "local" | "ai";
      };

      if (
        !mountedRef.current ||
        controller.signal.aborted ||
        requestId !== humanizeRequestRef.current ||
        requestLanguage !== latestLanguageRef.current
      ) {
        return;
      }

      if (!response.ok || !result.humanizedText?.trim()) {
        throw new Error(
          result.error ?? `Could not humanize the draft (${response.status}).`
        );
      }

      const paragraphs = textToParagraphs(result.humanizedText);
      if (paragraphs.length !== sourceParagraphCount) {
        throw new Error(
          "The rewrite changed the five-section structure, so the original draft was kept."
        );
      }

      const currentLetter = latestLetterRef.current;
      if (paragraphsToText(currentLetter.paragraphs).trim() !== sourceText) {
        setHumanizeMessage(
          "The draft changed while it was being humanized, so the newer text was kept."
        );
        return;
      }

      setLetterBeforeHumanize({
        ...currentLetter,
        paragraphs: [...currentLetter.paragraphs],
      });
      const nextLetter = { ...currentLetter, paragraphs };
      latestLetterRef.current = nextLetter;
      onChange(nextLetter);
      setHumanizeMessage(
        result.mode === "ai"
          ? `Draft humanized (${INTENSITY_LABELS[intensity]}) with AI. Review before exporting.`
          : `Draft polished locally (${INTENSITY_LABELS[intensity]}). Review before exporting.`
      );
    } catch (error) {
      if (
        controller.signal.aborted ||
        requestId !== humanizeRequestRef.current ||
        !mountedRef.current
      ) {
        return;
      }
      setHumanizeError(
        error instanceof Error ? error.message : "Could not humanize the draft."
      );
    } finally {
      if (
        mountedRef.current &&
        requestId === humanizeRequestRef.current
      ) {
        humanizeControllerRef.current = null;
        setIsHumanizing(false);
      }
    }
  };

  const handleUndoHumanize = () => {
    if (!letterBeforeHumanize) return;
    latestLetterRef.current = letterBeforeHumanize;
    onChange(letterBeforeHumanize);
    setLetterBeforeHumanize(null);
    setHumanizeError(null);
    setHumanizeMessage("Humanization undone.");
  };

  const handleReset = () => {
    humanizeRequestRef.current += 1;
    humanizeControllerRef.current?.abort();
    humanizeControllerRef.current = null;
    setIsHumanizing(false);
    setLetterBeforeHumanize(null);
    setHumanizeError(null);
    setHumanizeMessage(null);
    onReset?.();
  };

  return (
    <div className="glass-panel rounded-xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Edit Cover Letter</h2>
          <p className="mt-1 text-sm text-foreground-secondary dark:text-foreground-tertiary">
            Refine the draft before export. Use only verified facts from your CV.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {letterBeforeHumanize && (
            <button
              type="button"
              onClick={handleUndoHumanize}
              disabled={isHumanizing}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground-secondary transition hover:bg-background-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Undo humanize
            </button>
          )}
          {onReset && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isHumanizing}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground-secondary transition hover:bg-background-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset to generated
            </button>
          )}
        </div>
      </div>

      {/* Humanize controls row */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-3">
        {/* Intensity segmented control */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-foreground-secondary whitespace-nowrap">
            Intensity:
          </span>
          <div className="flex rounded-lg border border-border overflow-hidden" role="group" aria-label="Humanize intensity">
            {(["conservative", "balanced", "aggressive"] as HumanizeIntensity[]).map((level) => (
              <button
                key={level}
                type="button"
                title={INTENSITY_TIPS[level]}
                onClick={() => setIntensity(level)}
                disabled={isHumanizing}
                aria-pressed={intensity === level}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border-r border-border last:border-r-0 disabled:cursor-not-allowed disabled:opacity-50 ${
                  intensity === level
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-foreground-secondary hover:bg-background-secondary hover:text-foreground"
                }`}
              >
                {INTENSITY_LABELS[level]}
              </button>
            ))}
          </div>
        </div>

        {/* Tip text */}
        <p className="text-xs text-foreground-secondary dark:text-foreground-tertiary hidden sm:block flex-1 min-w-0 truncate">
          {INTENSITY_TIPS[intensity]}
        </p>

        {/* Humanize button */}
        <button
          type="button"
          onClick={() => void handleHumanize()}
          disabled={
            isHumanizing ||
            !letter.paragraphs.some((paragraph) => paragraph.trim())
          }
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
        >
          {isHumanizing ? "Humanizing…" : "✨ Humanize draft"}
        </button>
      </div>

      {(humanizeError || humanizeMessage) && (
        <p
          role={humanizeError ? "alert" : "status"}
          aria-live="polite"
          className={`mx-6 mt-4 rounded-lg border px-3 py-2 text-sm ${
            humanizeError
              ? "border-danger/30 bg-danger/5 text-danger"
              : "border-success/30 bg-success/5 text-success"
          }`}
        >
          {humanizeError ?? humanizeMessage}
        </p>
      )}

      <div className="space-y-5 px-6 py-5">
        <div>
          <label
            htmlFor="letter-headline"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-foreground-secondary dark:text-foreground-tertiary"
          >
            {language === "danish" ? "Overskrift" : "Headline"}
          </label>
          <input
            id="letter-headline"
            type="text"
            value={letter.headline}
            onChange={(e) => updateField("headline", e.target.value)}
            className="field-input"
          />
        </div>

        <div>
          <label
            htmlFor="letter-greeting"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-foreground-secondary dark:text-foreground-tertiary"
          >
            Greeting
          </label>
          <input
            id="letter-greeting"
            type="text"
            value={letter.greeting}
            onChange={(e) => updateField("greeting", e.target.value)}
            className="field-input"
          />
        </div>

        <div>
          <label
            htmlFor="letter-body"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-foreground-secondary dark:text-foreground-tertiary"
          >
            Body
          </label>
          <textarea
            id="letter-body"
            value={paragraphsToText(letter.paragraphs)}
            onChange={(e) =>
              updateField("paragraphs", textToParagraphs(e.target.value))
            }
            rows={12}
            className="field-textarea"
          />
          <p className="mt-1.5 text-xs text-foreground-secondary dark:text-foreground-tertiary">
            Separate paragraphs with a blank line.
          </p>
          <p className="mt-1 text-xs text-foreground-secondary dark:text-foreground-tertiary">
            {language === "danish"
              ? "Fem afsnit: motivation → mit bidrag → yderligere værdi → bidrag som kollega → samtale. Uverificerede arbejdsgiverfakta eller CV-påstande blokerer eksport."
              : "Five sections: motivation → value I bring → further contribution → colleague contribution → interview. Unverified employer or CV claims block export."}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="letter-closing"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-foreground-secondary dark:text-foreground-tertiary"
            >
              Closing
            </label>
            <input
              id="letter-closing"
              type="text"
              value={letter.closing}
              onChange={(e) => updateField("closing", e.target.value)}
              className="field-input"
            />
          </div>
          <div>
            <label
              htmlFor="letter-signature"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-foreground-secondary dark:text-foreground-tertiary"
            >
              Signature
            </label>
            <input
              id="letter-signature"
              type="text"
              value={letter.signature}
              onChange={(e) => updateField("signature", e.target.value)}
              className="field-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
