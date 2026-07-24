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
  { href: "/english", label: "English Lab" },
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

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Glassmorphic Header */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-xl"
        style={{
          borderColor: "var(--surface-border)",
          background: "color-mix(in srgb, var(--background) 80%, transparent)",
        }}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center justify-between sm:justify-start sm:gap-4 w-full sm:w-auto">
            <div>
              <Link
                href="/"
                className="text-xl font-semibold tracking-tight text-foreground"
                style={{ letterSpacing: "-0.01em" }}
              >
                Job <span className="text-primary">Agent</span>
              </Link>
              <p className="text-sm text-foreground-secondary">
                Tailor applications from verified CV data — human approval required.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-xl p-2.5 transition-all duration-200 hover:bg-surface-hover"
                style={{ border: "1px solid var(--surface-border)" }}
                aria-label="Toggle Dark Mode"
              >
                {mounted ? (theme === "dark" ? "☀️" : "🌙") : "🌙"}
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-xl p-2.5 sm:hidden transition-all duration-200 hover:bg-surface-hover"
                style={{ border: "1px solid var(--surface-border)" }}
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>
          <nav
            className={`${
              mobileMenuOpen ? "flex" : "hidden"
            } sm:flex flex-wrap gap-1.5 transition-all duration-200`}
          >
            {navItems.map((item, index) => {
              const isActive =
                mounted &&
                (item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href));

              return (
                <Link
                  key={`${item.href}-${index}`}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-foreground-secondary hover:text-foreground hover:bg-surface-hover"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 animate-fade-in">
        {children}
      </main>

      {/* Premium Footer */}
      <footer
        className="border-t"
        style={{
          borderColor: "var(--surface-border)",
          background: "var(--background-secondary)",
        }}
      >
        <div className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-foreground-tertiary sm:px-6 flex items-center justify-center gap-2">
          <span>Local-first full-stack v0.4 — no auto-apply. Review all outputs before submitting applications.</span>
          <span className="badge-success ml-2 text-[10px]">
            Daemon Active
          </span>
        </div>
      </footer>
      <AutoScoutDaemon />
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
      <AppShellInner>{children}</AppShellInner>
    </ThemeProvider>
  );
}
