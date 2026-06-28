"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";

export default function NetworkPage() {
  const [company, setCompany] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!company) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/agent/linkedin-network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to search network");
      
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Referral Network
          </h1>
          <p className="mt-2 text-foreground-secondary">
            Bypass the ATS. Use the Playwright swarm to find warm introductions at target companies.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <label className="block text-sm font-medium text-foreground mb-2">
            Target Company
          </label>
          <div className="flex gap-4">
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Google, Novo Nordisk, Stripe"
              className="flex-1 rounded-lg border border-border bg-background-secondary p-3 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
            />
            <button
              onClick={handleSearch}
              disabled={isLoading || !company}
              className="rounded-lg bg-blue-600 px-6 font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Searching LinkedIn..." : "Find Referrals"}
            </button>
          </div>
          {isLoading && (
            <p className="mt-3 text-xs text-brand-600 font-medium animate-pulse">
              Opening LinkedIn. Please switch to the browser window and log in if prompted...
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 p-4 border border-rose-200 text-sm text-rose-600 font-medium">
            Error: {error}
          </div>
        )}

        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-tertiary mb-4">
                Found Connections at {result.company}
              </h2>
              <div className="space-y-4">
                {result.profiles.map((profile: any, i: number) => (
                  <div key={i} className="p-3 bg-background-secondary rounded-lg border border-border">
                    <h3 className="font-bold text-foreground text-sm">{profile.name}</h3>
                    <p className="text-xs text-foreground-secondary mt-1">{profile.title}</p>
                    {profile.url && (
                      <a href={profile.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs mt-2 inline-block">
                        View Profile ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-800 mb-4">
                AI Coffee Chat Script
              </h2>
              <div className="bg-white p-4 rounded-lg border border-emerald-100 shadow-inner">
                <p className="text-sm text-slate-700 whitespace-pre-wrap font-serif leading-relaxed">
                  {result.suggestedScript}
                </p>
              </div>
              <p className="text-xs text-emerald-600 mt-4">
                Tip: Copy this message and send it as a LinkedIn connection request note to the top profile.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
