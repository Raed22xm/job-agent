"use client";

import { useState, useEffect, useRef } from "react";
import AppShell from "@/components/AppShell";

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface CopilotInsight {
  detectedQuestion: string;
  starPoints: string[];
}

export default function CopilotPage() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [insight, setInsight] = useState<CopilotInsight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript((prev) => prev + " " + currentTranscript);
          
          // Debounce the AI analysis so we don't spam the API on every word
          if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
          analysisTimeoutRef.current = setTimeout(() => {
            analyzeTranscript(currentTranscript);
          }, 3000); // Analyze after 3 seconds of pause
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      setInsight(null);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const analyzeTranscript = async (text: string) => {
    if (!text || text.trim().length < 20) return;
    
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/agent/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text, personaId: "default" })
      });
      
      if (res.ok) {
        const data = await res.json();
        setInsight(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Interview Copilot
          </h1>
          <p className="mt-2 text-foreground-secondary">
            Live AI interview assistance. Uses your microphone to transcribe questions and flash STAR method talking points.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleListening}
            className={`flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition-all ${
              isListening
                ? "bg-rose-600 hover:bg-rose-700 animate-pulse"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {isListening ? "⏹ Stop Listening" : "🎙 Start Copilot"}
          </button>
          
          {isAnalyzing && (
            <span className="text-sm font-medium text-primary animate-pulse">
              Analyzing question...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Live Transcript Box */}
          <div className="rounded-xl border border-border bg-background shadow-sm p-6 flex flex-col h-[500px]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-tertiary mb-4">
              Live Transcript
            </h2>
            <div className="flex-1 overflow-y-auto bg-background-secondary rounded-lg p-4 border border-border">
              <p className="text-foreground leading-relaxed">
                {transcript || (isListening ? "Listening..." : "Click 'Start Copilot' to begin transcription.")}
              </p>
            </div>
          </div>

          {/* AI Insights Box */}
          <div className="rounded-xl border border-primary/20 bg-primary/10 shadow-sm p-6 flex flex-col h-[500px]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary-dark mb-4">
              AI Talking Points (STAR)
            </h2>
            <div className="flex-1 overflow-y-auto">
              {!insight ? (
                <div className="flex h-full items-center justify-center text-center">
                  <p className="text-primary/60 text-sm">
                    Waiting for interviewer to ask a question...
                  </p>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h3 className="font-semibold text-primary-dark">Detected Question:</h3>
                    <p className="text-primary-dark italic mt-1">&quot;{insight.detectedQuestion}&quot;</p>
                  </div>
                  
                  <div className="space-y-3">
                    {insight.starPoints.map((point, i) => (
                      <div key={i} className="flex gap-3 items-start bg-surface p-3 rounded-lg border border-primary/15 shadow-sm">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary-dark">
                          {i + 1}
                        </div>
                        <p className="text-sm text-foreground-secondary leading-relaxed">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
