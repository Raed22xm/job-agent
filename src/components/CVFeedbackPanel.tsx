"use client";

import { useMemo, useState } from "react";
import type { GeneratedCV } from "@/types";
import { analyseCVFeedback, type FeedbackItem, type FeedbackSeverity } from "@/lib/cv/cvFeedback";

interface CVFeedbackPanelProps {
  cv: GeneratedCV;
  onApplyFix?: (item: FeedbackItem) => Promise<void>;
  isApplying?: boolean;
}

const SEVERITY_CONFIG: Record<
  FeedbackSeverity,
  { label: string; icon: string; badge: string; row: string }
> = {
  error: {
    label: "Error",
    icon: "✕",
    badge: "bg-rose-100 text-danger",
    row: "border-danger/20 bg-danger/10/60",
  },
  warning: {
    label: "Warning",
    icon: "⚠",
    badge: "bg-amber-100 text-warning",
    row: "border-warning/20 bg-warning/10/60",
  },
  tip: {
    label: "Tip",
    icon: "💡",
    badge: "bg-blue-100 text-blue-700",
    row: "border-primary/20 bg-primary/10/40",
  },
};

const SECTION_LABELS: Record<FeedbackItem["section"], string> = {
  summary: "Summary",
  skills: "Skills",
  experience: "Experience",
  overall: "Overall",
};

function FeedbackRow({ 
  item, 
  onApplyFix, 
  isApplying 
}: { 
  item: FeedbackItem;
  onApplyFix?: (item: FeedbackItem) => Promise<void>;
  isApplying?: boolean;
}) {
  const cfg = SEVERITY_CONFIG[item.severity];
  const [loading, setLoading] = useState(false);

  const handleFix = async () => {
    if (!onApplyFix) return;
    setLoading(true);
    try {
      await onApplyFix(item);
    } finally {
      setLoading(false);
    }
  };

  return (
    <li className={`rounded-xl border px-4 py-3 ${cfg.row}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-start gap-2">
          <span
            className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cfg.badge}`}
          >
            {SECTION_LABELS[item.section]}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{item.message}</p>
            {item.suggestion && (
              <p className="mt-1 text-xs leading-relaxed text-foreground-secondary">
                {item.suggestion}
              </p>
            )}
          </div>
        </div>
        
        {onApplyFix && item.section !== "overall" && (
          <button
            type="button"
            onClick={handleFix}
            disabled={loading || isApplying}
            className="shrink-0 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Fixing...
              </>
            ) : (
              <>✨ Fix automatically</>
            )}
          </button>
        )}
      </div>
    </li>
  );
}

export default function CVFeedbackPanel({ cv, onApplyFix, isApplying }: CVFeedbackPanelProps) {
  const [open, setOpen] = useState(true);
  const [filter, setFilter] = useState<FeedbackSeverity | "all">("all");

  const allItems = useMemo(() => analyseCVFeedback(cv), [cv]);

  const errors = allItems.filter((i) => i.severity === "error");
  const warnings = allItems.filter((i) => i.severity === "warning");
  const tips = allItems.filter((i) => i.severity === "tip");

  const visible = filter === "all" ? allItems : allItems.filter((i) => i.severity === filter);

  if (allItems.length === 0) {
    return (
      <section className="rounded-xl border border-success/20 bg-success/10 px-5 py-4">
        <p className="text-sm font-semibold text-emerald-800">
          ✓ No CV feedback issues detected
        </p>
        <p className="mt-1 text-xs text-success">
          All sections look solid. Review the ATS keyword coverage above and
          export when ready.
        </p>
      </section>
    );
  }

  return (
    <section className="glass-panel rounded-xl">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-foreground">
            CV Feedback
          </h2>
          <div className="flex gap-1.5">
            {errors.length > 0 && (
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-danger">
                {errors.length} error{errors.length > 1 ? "s" : ""}
              </span>
            )}
            {warnings.length > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-warning">
                {warnings.length} warning{warnings.length > 1 ? "s" : ""}
              </span>
            )}
            {tips.length > 0 && (
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                {tips.length} tip{tips.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        <span className="text-xs font-medium text-foreground-secondary">
          {open ? "Collapse ▲" : "Expand ▼"}
        </span>
      </button>

      {open && (
        <div className="border-t border-border px-5 pb-5 pt-4">
          {/* Filter tabs */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {(["all", "error", "warning", "tip"] as const).map((f) => {
              const count =
                f === "all"
                  ? allItems.length
                  : allItems.filter((i) => i.severity === f).length;
              if (count === 0 && f !== "all") return null;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    filter === f
                      ? "bg-foreground text-white"
                      : "bg-background-secondary text-foreground-secondary hover:bg-surface-hover"
                  }`}
                >
                  {f === "all" ? `All (${count})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${count})`}
                </button>
              );
            })}
          </div>

          {/* Feedback list */}
          <ul className="space-y-2">
            {visible.map((item, i) => (
              <FeedbackRow key={`${item.section}-${i}`} item={item} onApplyFix={onApplyFix} isApplying={isApplying} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
