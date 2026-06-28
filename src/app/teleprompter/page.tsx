"use client";

import { useState, useRef, useEffect } from "react";
import AppShell from "@/components/AppShell";

export default function TeleprompterPage() {
  const [jobDescription, setJobDescription] = useState("");
  const [script, setScript] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const generateScript = async () => {
    if (!jobDescription) return;
    setIsLoading(true);
    setError(null);
    setScript("");
    setIsPlaying(false);

    try {
      const res = await fetch("/api/agent/teleprompter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, personaId: "default" }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate script");
      
      setScript(data.videoScript);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let animationFrameId: number;
    
    const scroll = () => {
      if (isPlaying && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop += scrollSpeed;
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(scroll);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, scrollSpeed]);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              The Loom Pitch
            </h1>
            <p className="mt-2 text-foreground-secondary">
              Generate and read an AI-tailored 60-second video pitch.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-xl border border-border bg-background p-5 shadow-sm">
              <label className="block text-sm font-medium text-foreground mb-2">
                Target Job Description
              </label>
              <textarea
                rows={8}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here to generate a tailored pitch..."
                className="w-full rounded-lg border border-border bg-background-secondary p-3 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
              />
              <button
                onClick={generateScript}
                disabled={isLoading || !jobDescription}
                className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? "Generating Script..." : "Generate 60s Pitch"}
              </button>
            </div>
            
            {error && (
              <div className="rounded-lg bg-rose-50 p-4 border border-rose-200 text-sm text-rose-600">
                Error: {error}
              </div>
            )}
            
            {script && (
              <div className="rounded-xl border border-border bg-background p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Teleprompter Controls</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700"
                  >
                    {isPlaying ? "Pause" : "Play"}
                  </button>
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
                    }}
                    className="rounded-lg bg-slate-200 px-4 py-2 font-bold text-slate-800 hover:bg-slate-300"
                  >
                    Reset
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground-secondary mb-1">
                    Scroll Speed: {scrollSpeed}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.1"
                    value={scrollSpeed}
                    onChange={(e) => setScrollSpeed(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-xl border-4 border-slate-900 bg-slate-950 p-8 shadow-2xl relative overflow-hidden h-[600px]">
              {/* Teleprompter Focus Line */}
              <div className="absolute top-1/2 left-0 right-0 h-16 -mt-8 bg-white/10 pointer-events-none z-10 border-y border-white/20"></div>
              
              <div 
                ref={scrollContainerRef}
                className="h-full overflow-y-auto no-scrollbar scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {!script ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-slate-500 text-xl font-bold text-center">
                      Your script will appear here.<br/>Generate it first.
                    </p>
                  </div>
                ) : (
                  <div className="py-[300px]">
                    <p className="text-4xl leading-[1.6] text-white font-bold tracking-wide text-center">
                      {script}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
