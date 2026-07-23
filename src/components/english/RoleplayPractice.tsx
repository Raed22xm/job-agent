"use client";

import { useEffect, useRef, useState } from "react";
import type { RoleplayTurn } from "@/lib/english";
import { MessageIcon, MicIcon, SparkIcon, StopIcon } from "@/components/english/Icons";

interface SpeechRecognitionResultLike { 0: { transcript: string }; isFinal: boolean }
interface SpeechRecognitionEventLike { resultIndex: number; results: ArrayLike<SpeechRecognitionResultLike> }
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionConstructor { new (): SpeechRecognitionLike }

const SCENARIOS = ["Daily stand-up", "Ask for clarification", "Share a project update", "Workplace small talk"];

export default function RoleplayPractice({ focusWords }: { focusWords: string[] }) {
  const [scenario, setScenario] = useState(SCENARIOS[0]);
  const [message, setMessage] = useState("");
  const [turns, setTurns] = useState<Array<{ user: string; coach: RoleplayTurn }>>([]);
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const speechWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Constructor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    setSpeechSupported(Boolean(Constructor));
    if (!Constructor) return;
    const recognition = new Constructor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) transcript += event.results[index][0].transcript;
      setMessage(transcript.trim());
    };
    recognition.onerror = () => { setError("I could not hear you. You can type your answer instead."); setIsListening(false); };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    return () => recognition.stop();
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    setError("");
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const send = async () => {
    if (!message.trim()) return;
    const userMessage = message.trim();
    setMessage("");
    setIsSending(true);
    setError("");
    try {
      const response = await fetch("/api/english/roleplay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario, message: userMessage, focusWords: focusWords.slice(0, 8) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The coach could not reply.");
      setTurns((current) => [...current, { user: userMessage, coach: data.turn }]);
    } catch (requestError) {
      setMessage(userMessage);
      setError(requestError instanceof Error ? requestError.message : "The coach could not reply.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]" aria-labelledby="roleplay-title">
      <div className="glass-card">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">AI workplace coach</p>
        <h2 id="roleplay-title" className="mt-2 text-2xl font-bold tracking-tight">Practice a real conversation</h2>
        <p className="mt-2 text-sm leading-6 text-foreground-secondary">Speak or type. The coach replies naturally and gives one useful correction at a time.</p>

        <label htmlFor="roleplay-scenario" className="mt-6 block text-sm font-semibold">Choose a situation</label>
        <select id="roleplay-scenario" value={scenario} onChange={(event) => { setScenario(event.target.value); setTurns([]); }} className="field-input mt-2">
          {SCENARIOS.map((item) => <option key={item}>{item}</option>)}
        </select>

        <div className="mt-5 rounded-xl border border-border bg-background-secondary p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground-tertiary">Your opening prompt</p>
          <p className="mt-2 text-sm leading-6">You are speaking to a colleague. Start with a short update, then explain what you need next.</p>
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold">Words from your text</p>
          {focusWords.length ? (
            <div className="mt-2 flex flex-wrap gap-2">{focusWords.slice(0, 5).map((word) => <span key={word} className="badge-success">{word}</span>)}</div>
          ) : <p className="mt-2 text-sm text-foreground-secondary">Create office vocabulary first, then the coach will encourage you to use those phrases.</p>}
        </div>
      </div>

      <div className="glass-card flex min-h-[540px] flex-col">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><MessageIcon className="h-5 w-5" /></span><div><h3 className="font-semibold">English coach</h3><p className="text-xs text-foreground-tertiary">{scenario}</p></div></div>
          <span className="badge-success">B1</span>
        </div>

        <div className="flex-1 space-y-5 py-5" aria-live="polite">
          {!turns.length && (
            <div className="mx-auto mt-12 max-w-sm text-center"><SparkIcon className="mx-auto h-8 w-8 text-primary"/><p className="mt-3 font-medium">Start when you are ready</p><p className="mt-2 text-sm leading-6 text-foreground-secondary">Try: “Good morning. I would like to share an update on my project.”</p></div>
          )}
          {turns.map((turn, index) => (
            <div key={`${turn.user}-${index}`} className="space-y-3">
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm leading-6 text-white">{turn.user}</div>
              <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-background-secondary px-4 py-3 text-sm leading-6">{turn.coach.reply}</div>
              {(turn.coach.correction || turn.coach.suggestions.length > 0) && (
                <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 text-sm">
                  <p className="font-semibold text-primary">Coach note</p>
                  {turn.coach.correction && <p className="mt-2"><span className="font-medium">Try:</span> {turn.coach.correction}</p>}
                  {turn.coach.explanation && <p className="mt-1 text-foreground-secondary">{turn.coach.explanation}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">{turn.coach.suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => setMessage(suggestion)} className="rounded-full border border-primary/25 bg-surface px-3 py-1.5 text-left text-xs font-medium hover:border-primary">{suggestion}</button>)}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {error && <p role="alert" className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="border-t border-border pt-4">
          <label htmlFor="roleplay-message" className="sr-only">Your reply</label>
          <textarea id="roleplay-message" value={message} onChange={(event) => setMessage(event.target.value.slice(0, 1000))} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} rows={3} className="field-textarea" placeholder="Type your reply…" />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={toggleListening} disabled={!speechSupported} className="btn-secondary min-h-11" aria-pressed={isListening}>
              {isListening ? <StopIcon className="h-5 w-5" /> : <MicIcon className="h-5 w-5" />} {isListening ? "Stop listening" : "Speak"}
            </button>
            <button type="button" onClick={send} disabled={!message.trim() || isSending} className="btn-primary min-h-11">{isSending ? "Coach is replying…" : "Send reply"}</button>
            {!speechSupported && <span className="text-xs text-foreground-tertiary">Voice input is unavailable; typing still works.</span>}
          </div>
        </div>
      </div>
    </section>
  );
}
