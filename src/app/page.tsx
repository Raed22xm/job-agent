import Link from "next/link";
import RemindersBanner from "@/components/RemindersBanner";

const features = [
  {
    title: "🤖 AI Job Search Agent",
    description: "Autonomous agent that audits your CV, finds matching live jobs, and drafts outreach messages — you review everything.",
    href: "/agent",
  },
  {
    title: "1. Job Analyzer",
    description: "Paste text or import a URL. Local scoring first, optional AI enhancement.",
    href: "/analyzer",
  },
  {
    title: "2. CV Generator",
    description: "Edit a tailored ATS CV from verified master data only.",
    href: "/cv",
  },
  {
    title: "3. Cover Letter",
    description: "Edit a short draft cover letter before export.",
    href: "/cover-letter",
  },
  {
    title: "4. Application Tracker",
    description: "Track status, dates, notes, and export a JSON backup.",
    href: "/tracker",
  },
  {
    title: "LinkedIn Outreach",
    description: "Draft a connection note or InMail from verified CV data.",
    href: "/linkedin",
  },
  {
    title: "🗺️ Geo Audit",
    description: "Score your CV skills against job market demand across DK cities and remote tiers — find your best market.",
    href: "/geo-audit",
  },
  {
    title: "Job Guide",
    description: "Search methods, job boards, CV tips, and agent workflow.",
    href: "/guide",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10 animate-slide-up">
      {/* Hero Section */}
      <section
        className="glass-panel rounded-2xl p-8 sm:p-10"
        style={{
          background: "linear-gradient(135deg, var(--surface), var(--background-secondary))",
          borderColor: "rgba(16, 185, 129, 0.1)",
        }}
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Local-first full-stack · v0.4
        </p>
        <h1
          className="mt-3 max-w-2xl text-3xl font-bold text-foreground sm:text-4xl"
          style={{ letterSpacing: "-0.02em" }}
        >
          Apply smarter with verified CV data — never auto-apply.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground-secondary" style={{ lineHeight: "1.7" }}>
          Paste or import a job, get a match score and tailored drafts, edit before
          export, then track applications locally. One predictable pipeline — you
          review every output before applying.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/agent" className="btn-primary">
            🤖 Run AI Agent
          </Link>
          <Link href="/analyzer" className="btn-secondary">
            Start with Job Analyzer
          </Link>
          <Link href="/guide" className="btn-secondary">
            Job search guide
          </Link>
          <Link href="/tracker" className="btn-secondary">
            View Tracker
          </Link>
        </div>
      </section>

      <RemindersBanner />

      {/* Feature Cards Grid */}
      <section>
        <h2 className="text-lg font-semibold text-foreground">Workflow</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="glass-card"
            >
              <h3 className="font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
                {feature.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Local Automation Section */}
      <section className="glass-panel rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Local automation ready</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
              This project now includes a local MCP bridge for filesystem, GitHub, browser, and SQLite-style workflows so automation can run without leaving the workspace.
            </p>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
          >
            Open GitHub
          </a>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl p-3" style={{ background: "var(--background-secondary)", border: "1px solid var(--surface-border)" }}>
            <p className="text-sm font-semibold text-foreground">Filesystem + project data</p>
            <p className="mt-1 text-sm text-foreground-secondary">Browse and manage local CV, job, and output files directly from automation workflows.</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: "var(--background-secondary)", border: "1px solid var(--surface-border)" }}>
            <p className="text-sm font-semibold text-foreground">Browser + GitHub workflows</p>
            <p className="mt-1 text-sm text-foreground-secondary">Use browser testing and repository actions to validate features and ship changes faster.</p>
          </div>
        </div>
      </section>

      {/* Important Rules */}
      <section
        className="glass-panel rounded-xl p-5"
        style={{
          borderColor: "rgba(245, 158, 11, 0.2)",
          background: "rgba(245, 158, 11, 0.05)",
        }}
      >
        <h2 className="text-sm font-semibold" style={{ color: "var(--warning)" }}>Important rules</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground-secondary">
          <li>Never invent experience, education, or skills.</li>
          <li>All outputs use verified data from <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--surface)", border: "1px solid var(--surface-border)" }}>data/master-cv.json</code>.</li>
          <li>No auto-apply — review and approve every application manually.</li>
          <li>AI runs server-side when configured; local heuristics always available as fallback.</li>
        </ul>
      </section>
    </div>
  );
}
