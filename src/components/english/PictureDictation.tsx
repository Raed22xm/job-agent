"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { scoreDictation, type DictationResult } from "@/lib/english";
import { ArrowIcon, CheckIcon, VolumeIcon } from "@/components/english/Icons";

const EXERCISES = [
  {
    image: "/images/english/meeting-presentation.png",
    alt: "A presenter in a blue blazer shares charts with three colleagues in a bright meeting room.",
    sentence: "She is presenting the quarterly results to her colleagues.",
    hint: "A meeting update",
  },
  {
    image: "/images/english/meeting-presentation.png",
    alt: "Three colleagues listen while a presenter explains charts on a large screen.",
    sentence: "The team is reviewing the latest project figures together.",
    hint: "Team collaboration",
  },
];

export default function PictureDictation({ onComplete }: { onComplete: (score: number) => void }) {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<DictationResult | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const exercise = EXERCISES[exerciseIndex];

  useEffect(() => {
    setSpeechSupported("speechSynthesis" in window && "SpeechSynthesisUtterance" in window);
    return () => window.speechSynthesis?.cancel();
  }, []);

  const speak = (rate = 0.92) => {
    if (!speechSupported) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(exercise.sentence);
    utterance.lang = "en-US";
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  };

  const checkAnswer = () => {
    const nextResult = scoreDictation(answer, exercise.sentence);
    setResult(nextResult);
    onComplete(nextResult.score);
  };

  const nextExercise = () => {
    window.speechSynthesis?.cancel();
    setExerciseIndex((current) => (current + 1) % EXERCISES.length);
    setAnswer("");
    setResult(null);
    setRevealed(false);
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]" aria-labelledby="dictation-title">
      <div className="glass-panel overflow-hidden">
        <div className="relative aspect-[16/9] bg-background-secondary">
          <Image src={exercise.image} alt={exercise.alt} fill priority sizes="(min-width: 1024px) 620px, 100vw" className="object-cover" />
          <span className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white">
            B1 · {exercise.hint}
          </span>
        </div>
        <div className="border-t border-border p-4 text-sm text-foreground-secondary">
          Look at the scene for context. The exact sentence stays hidden until you check or reveal it.
        </div>
      </div>

      <div className="glass-card flex flex-col justify-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Picture dictation</p>
        <h2 id="dictation-title" className="mt-2 text-2xl font-bold tracking-tight">Listen, then write what you hear</h2>
        <p className="mt-2 text-sm leading-6 text-foreground-secondary">Train listening, spelling, and sentence structure together.</p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => speak()} disabled={!speechSupported} className="btn-primary min-h-11">
            <VolumeIcon className="h-5 w-5" /> Listen
          </button>
          <button type="button" onClick={() => speak(0.7)} disabled={!speechSupported} className="btn-secondary min-h-11">
            <VolumeIcon className="h-5 w-5" /> Slower
          </button>
        </div>
        {!speechSupported && <p role="alert" className="mt-3 text-sm text-danger">Audio is unavailable in this browser. You can reveal the sentence and continue.</p>}

        <label htmlFor="dictation-answer" className="mt-5 text-sm font-semibold">What did you hear?</label>
        <textarea
          id="dictation-answer"
          value={answer}
          onChange={(event) => { setAnswer(event.target.value); setResult(null); }}
          rows={3}
          className="field-textarea mt-2"
          placeholder="Type the sentence here…"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={checkAnswer} disabled={!answer.trim()} className="btn-primary min-h-11">
            <CheckIcon className="h-5 w-5" /> Check answer
          </button>
          <button type="button" onClick={() => setRevealed(true)} className="btn-ghost min-h-11">Reveal sentence</button>
        </div>

        {(result || revealed) && (
          <div className="mt-5 rounded-xl border border-primary/20 bg-primary/10 p-4" aria-live="polite">
            {result && <p className="font-semibold">Your score: {result.score}%</p>}
            <p className="mt-2 text-sm font-medium">{exercise.sentence}</p>
            {result && (
              <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Word-by-word feedback">
                {result.expected.map((item, index) => (
                  <span key={`${item.word}-${index}`} className={item.status === "correct" ? "badge-success" : "badge-danger"}>
                    {item.word}{item.status === "missing" ? " (missed)" : ""}
                  </span>
                ))}
                {result.extras.map((item, index) => <span key={`${item.word}-${index}`} className="badge-warning">{item.word} (extra)</span>)}
              </div>
            )}
            <button type="button" onClick={nextExercise} className="btn-secondary mt-4 min-h-11">
              Next sentence <ArrowIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
