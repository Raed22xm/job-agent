"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import AutoScoutDaemon from "@/components/AutoScoutDaemon";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/agent", label: "🤖 Agent" },
  { href: "/copilot", label: "🎙️ Copilot" },
  { href: "/boardroom", label: "🤖 Boardroom" },
  { href: "/network", label: "🕸️ Network" },
  { href: "/teleprompter", label: "📹 Teleprompter" },
  { href: "/guide", label: "Job Guide" },
  { href: "/analyzer", label: "Job Analyzer" },
  { href: "/cv", label: "CV Generator" },
  { href: "/cover-letter", label: "Cover Letter" },
  { href: "/linkedin", label: "LinkedIn" },
  { href: "/tracker", label: "Application Tracker" },
  { href: "/jobnet", label: "🇩🇰 Jobnet" },
  { href: "/geo-audit", label: "🗺️ Geo Audit" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
        <header className="border-b border-border bg-background-secondary">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center justify-between sm:justify-start sm:gap-4 w-full sm:w-auto">
              <div>
                <Link href="/" className="text-xl font-semibold tracking-tight text-primary">
                  Job Agent
                </Link>
                <p className="text-sm text-foreground-secondary">
                  Tailor applications from verified CV data — human approval required.
                </p>
              </div>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-lg p-2 hover:bg-border transition-colors sm:ml-4"
                aria-label="Toggle Dark Mode"
              >
                {mounted ? (theme === "dark" ? "☀️" : "🌙") : "🌙"}
              </button>
            </div>
            <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const isActive =
                mounted &&
                (item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-foreground-secondary hover:bg-border hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>

        <footer className="border-t border-border bg-background-secondary">
          <div className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-foreground-tertiary sm:px-6 flex items-center justify-center gap-2">
            <span>Local-first full-stack v0.4 — no auto-apply. Review all outputs before submitting applications.</span>
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-2">Daemon Active</span>
          </div>
        </footer>
        <AutoScoutDaemon />
      </div>
    </ThemeProvider>
  );
}
