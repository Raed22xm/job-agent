"use client";

import { useState } from "react";
import type { EnglishLevel, VocabularyItem } from "@/lib/english";
import { CheckIcon, SparkIcon, VolumeIcon } from "@/components/english/Icons";

const SAMPLE_TEXT = "Please send a project update before Friday's meeting. We need to clarify the requirements, review the timeline, and agree on the next action items before the deadline.";

export default function OfficeVocabulary({ onWords }: { onWords: (words: string[]) => void }) {
  const [text, setText] = useState("");
  const [level, setLevel] = useState<EnglishLevel>("B1");
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"ai" | "local-fallback" | null>(null);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceAnswer, setPracticeAnswer] = useState("");
  const [practiceCorrect, setPracticeCorrect] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  const generate = async () => {
    if (text.trim().length < 20) {
      setError("Add at least 20 characters so the practice can use enough context.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/english/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, level }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create practice.");
      setItems(data.items);
      setMode(data.mode);
      setPracticeIndex(0);
      setPracticeAnswer("");
      setPracticeCorrect(null);
      onWords(data.items.map((item: VocabularyItem) => item.phrase));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create practice.");
    } finally {
      setIsLoading(false);
    }
  };

  const speak = (phrase: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = "en-US";
    utterance.rate = 0.88;
    window.speechSynthesis.speak(utterance);
  };

  const checkPractice = () => {
    const expected = items[practiceIndex]?.phrase.toLowerCase().trim();
    setPracticeCorrect(practiceAnswer.toLowerCase().trim() === expected);
  };

  const nextCard = () => {
    setPracticeIndex((current) => (current + 1) % items.length);
    setPracticeAnswer("");
    setPracticeCorrect(null);
  };

  const activeItem = items[practiceIndex];

  return (
    <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]" aria-labelledby="vocabulary-title">
      <div className="glass-card">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Your text, your vocabulary</p>
        <h2 id="vocabulary-title" className="mt-2 text-2xl font-bold tracking-tight">Build an office word bank</h2>
        <p className="mt-2 text-sm leading-6 text-foreground-secondary">Paste an email, meeting note, or job description. The coach finds useful workplace phrases and turns them into practice.</p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <label htmlFor="office-text" className="text-sm font-semibold">Office text</label>
          <button type="button" onClick={() => setText(SAMPLE_TEXT)} className="text-sm font-medium text-primary hover:underline">Use an example</button>
        </div>
        <textarea
          id="office-text"
          value={text}
          onChange={(event) => setText(event.target.value.slice(0, 4000))}
          rows={8}
          className="field-textarea mt-2"
          placeholder="Paste an email, a meeting note, or a job description…"
          aria-describedby="office-text-help"
        />
        <div id="office-text-help" className="mt-2 flex justify-between text-xs text-foreground-tertiary">
          <span>Your text is used only for this practice request.</span><span>{text.length}/4000</span>
        </div>

        <label htmlFor="english-level" className="mt-4 block text-sm font-semibold">English level</label>
        <select id="english-level" value={level} onChange={(event) => setLevel(event.target.value as EnglishLevel)} className="field-input mt-2">
          <option value="A2">A2 · Elementary</option>
          <option value="B1">B1 · Intermediate</option>
          <option value="B2">B2 · Upper intermediate</option>
        </select>

        {error && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button type="button" onClick={generate} disabled={isLoading} className="btn-primary mt-5 min-h-11 w-full">
          <SparkIcon className="h-5 w-5" /> {isLoading ? "Creating your practice…" : "Create vocabulary practice"}
        </button>
      </div>

      <div className="glass-card min-h-[460px]">
        {!activeItem ? (
          <div className="flex h-full min-h-[410px] flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><SparkIcon className="h-7 w-7" /></div>
            <h3 className="mt-4 text-lg font-semibold">Your practice cards will appear here</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-foreground-secondary">You will get clear definitions, natural examples, and a quick fill-in-the-blank exercise.</p>
          </div>
        ) : (
          <div aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="badge-success">Card {practiceIndex + 1} of {items.length}</span>
              <span className="text-xs text-foreground-tertiary">{mode === "ai" ? "AI-personalized" : "Local practice"}</span>
            </div>

            <div className="mt-7 flex items-center gap-3">
              <h3 className="text-3xl font-bold tracking-tight">{activeItem.phrase}</h3>
              <button type="button" onClick={() => speak(activeItem.phrase)} className="btn-ghost min-h-11 min-w-11 px-3" aria-label={`Hear ${activeItem.phrase}`}><VolumeIcon className="h-5 w-5" /></button>
            </div>
            <p className="mt-3 leading-7 text-foreground-secondary">{activeItem.definition}</p>
            <div className="mt-5 rounded-xl border border-border bg-background-secondary p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground-tertiary">Example</p>
              <p className="mt-2 text-sm leading-6">{activeItem.example}</p>
            </div>

            <div className="mt-6 border-t border-border pt-6">
              <label htmlFor="cloze-answer" className="text-sm font-semibold">Complete the sentence</label>
              <p className="mt-2 text-sm text-foreground-secondary">{activeItem.cloze}</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input id="cloze-answer" value={practiceAnswer} onChange={(event) => { setPracticeAnswer(event.target.value); setPracticeCorrect(null); }} className="field-input" placeholder="Type the missing phrase" />
                <button type="button" onClick={checkPractice} disabled={!practiceAnswer.trim()} className="btn-primary min-h-11 shrink-0"><CheckIcon className="h-5 w-5" /> Check</button>
              </div>
              {practiceCorrect !== null && (
                <div role="status" className={`mt-3 rounded-xl p-3 text-sm ${practiceCorrect ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-800 dark:text-amber-200"}`}>
                  {practiceCorrect ? "Correct — nice work." : `Almost. The phrase is “${activeItem.phrase}”.`}
                </div>
              )}
              <button type="button" onClick={nextCard} className="btn-secondary mt-4 min-h-11">Next card</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
