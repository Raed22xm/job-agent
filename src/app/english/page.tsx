"use client";

import { useEffect, useState } from "react";
import PictureDictation from "@/components/english/PictureDictation";
import OfficeVocabulary from "@/components/english/OfficeVocabulary";
import RoleplayPractice from "@/components/english/RoleplayPractice";
import { FileIcon, ImageIcon, MessageIcon } from "@/components/english/Icons";

type Mode = "dictation" | "vocabulary" | "roleplay";

interface Progress {
  minutes: number;
  attempts: number;
  bestScore: number;
  focusWords: string[];
  date: string;
}

const EMPTY_PROGRESS: Progress = { minutes: 0, attempts: 0, bestScore: 0, focusWords: [], date: "" };

const MODES = [
  { id: "dictation" as const, label: "Picture dictation", description: "Listen and write", Icon: ImageIcon },
  { id: "vocabulary" as const, label: "Office vocabulary", description: "Learn from your text", Icon: FileIcon },
  { id: "roleplay" as const, label: "AI roleplay", description: "Speak with a coach", Icon: MessageIcon },
];

export default function EnglishPage() {
  const [mode, setMode] = useState<Mode>("dictation");
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const saved = JSON.parse(localStorage.getItem("english-lab:v1") || "null") as Progress | null;
      setProgress(saved ? { ...saved, minutes: saved.date === today ? saved.minutes : 0, attempts: saved.date === today ? saved.attempts : 0, date: today } : { ...EMPTY_PROGRESS, date: today });
    } catch {
      setProgress({ ...EMPTY_PROGRESS, date: today });
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("english-lab:v1", JSON.stringify(progress));
  }, [progress, ready]);

  const recordAttempt = (score: number) => {
    setProgress((current) => ({
      ...current,
      attempts: current.attempts + 1,
      minutes: Math.min(5, current.minutes + 1),
      bestScore: Math.max(current.bestScore, score),
    }));
  };

  const saveWords = (focusWords: string[]) => {
    setProgress((current) => ({ ...current, focusWords }));
  };

  return (
    <div className="space-y-7">
      <header className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/15 via-surface to-amber-500/10 p-6 sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <span className="badge-success">Workplace English · B1</span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Practice English you can use at work</h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-foreground-secondary">Listen carefully, learn useful office phrases from your own text, and practice real conversations with an encouraging coach.</p>
        </div>
        <div className="relative z-10 mt-6 grid max-w-xl grid-cols-3 gap-3">
          <div className="rounded-2xl border border-border bg-surface/90 p-3"><p className="text-2xl font-bold text-primary">{progress.minutes}/5</p><p className="text-xs text-foreground-secondary">minutes today</p></div>
          <div className="rounded-2xl border border-border bg-surface/90 p-3"><p className="text-2xl font-bold">{progress.attempts}</p><p className="text-xs text-foreground-secondary">attempts</p></div>
          <div className="rounded-2xl border border-border bg-surface/90 p-3"><p className="text-2xl font-bold">{progress.bestScore}%</p><p className="text-xs text-foreground-secondary">best score</p></div>
        </div>
      </header>

      <nav aria-label="English practice modes" className="grid gap-3 md:grid-cols-3">
        {MODES.map(({ id, label, description, Icon }) => {
          const active = mode === id;
          return (
            <button
              type="button"
              key={id}
              onClick={() => setMode(id)}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[76px] cursor-pointer items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${active ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-surface hover:border-primary/40 hover:bg-surface-hover"}`}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${active ? "bg-primary text-white" : "bg-background-secondary text-foreground-secondary"}`}><Icon className="h-5 w-5" /></span>
              <span><span className="block font-semibold">{label}</span><span className="mt-0.5 block text-xs text-foreground-secondary">{description}</span></span>
            </button>
          );
        })}
      </nav>

      {mode === "dictation" && <PictureDictation onComplete={recordAttempt} />}
      {mode === "vocabulary" && <OfficeVocabulary onWords={saveWords} />}
      {mode === "roleplay" && <RoleplayPractice focusWords={progress.focusWords} />}

      <aside className="rounded-2xl border border-border bg-background-secondary p-5">
        <h2 className="font-semibold">A simple practice routine</h2>
        <ol className="mt-3 grid gap-3 text-sm text-foreground-secondary sm:grid-cols-3">
          <li><span className="mr-2 font-bold text-primary">1.</span>Do one picture dictation.</li>
          <li><span className="mr-2 font-bold text-primary">2.</span>Create cards from a real work text.</li>
          <li><span className="mr-2 font-bold text-primary">3.</span>Use two new phrases in roleplay.</li>
        </ol>
      </aside>
    </div>
  );
}
