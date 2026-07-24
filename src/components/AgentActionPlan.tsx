"use client";

interface AgentActionPlanProps {
  onSyncGithub: () => Promise<void>;
  isSyncingGithub: boolean;
}

const ACTION_STEPS = [
  { day: "Mon", task: "Run Full Pipeline → Geo Audit shows best market, CV Doctor flags improvements", icon: "▶" },
  { day: "Tue", task: "Run Job Scout in your top Geo market → pick 5 target roles", icon: "🔍" },
  { day: "Wed", task: "Use Analyzer on each job → generate tailored CVs", icon: "📊" },
  { day: "Thu", task: "Draft outreach messages for hiring managers", icon: "✉" },
  { day: "Fri", task: "Send applications + update tracker", icon: "✓" },
  { day: "Next week", task: "Send follow-up messages (1 week rule)", icon: "🔁" },
];

export default function AgentActionPlan({
  onSyncGithub,
  isSyncingGithub,
}: AgentActionPlanProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">
          Your Weekly Action Plan
        </h2>
        <div className="space-y-3">
          {ACTION_STEPS.map((item) => (
            <div
              key={item.day}
              className="flex items-start gap-3 rounded-lg bg-background-secondary p-3"
            >
              <span className="text-lg shrink-0">{item.icon}</span>
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wide">
                  {item.day}
                </span>
                <p className="text-sm text-foreground-secondary">{item.task}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Advanced Sync
          </h3>
          <p className="text-xs text-foreground-secondary mb-3">
            Sync your recent GitHub commits into the RAG Knowledge Base to dynamically inject live coding activity into your Cover Letters.
          </p>
          <button
            type="button"
            onClick={onSyncGithub}
            disabled={isSyncingGithub}
            className="rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isSyncingGithub ? (
              <>
                <span className="animate-spin">⟳</span> Syncing...
              </>
            ) : (
              "🐙 Sync GitHub Activity"
            )}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-warning/20 bg-warning/10 p-4">
        <p className="text-sm font-semibold text-warning mb-1">
          Important rules
        </p>
        <ul className="space-y-1 text-xs text-warning list-disc pl-4">
          <li>Never apply without reviewing the generated CV and cover letter first</li>
          <li>All outputs use only verified facts from your master CV</li>
          <li>Outreach messages are drafts — personalise before sending</li>
          <li>Add Adzuna API keys to .env for broader job search coverage</li>
        </ul>
      </div>
    </div>
  );
}
