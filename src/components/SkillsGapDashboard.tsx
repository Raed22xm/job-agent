"use client";

import { useMemo } from "react";
import type { Application } from "@/types";

interface SkillsGapDashboardProps {
  applications: Application[];
}

export default function SkillsGapDashboard({ applications }: SkillsGapDashboardProps) {
  const missingSkills = useMemo(() => {
    const counts: Record<string, number> = {};
    const relevantApps = applications.filter(a => a.status !== "draft");
    
    relevantApps.forEach(app => {
      app.match?.missingKeywords?.forEach(kw => {
        const normalized = kw.toLowerCase().trim();
        counts[normalized] = (counts[normalized] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [applications]);

  if (applications.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-background p-10 text-center">
        <p className="text-sm font-medium text-foreground">No applications to analyze.</p>
      </div>
    );
  }

  if (missingSkills.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-background p-10 text-center">
        <p className="text-sm font-medium text-foreground">No missing skills detected! Your CV is perfectly matched.</p>
      </div>
    );
  }

  const maxCount = missingSkills[0]?.count || 1;

  return (
    <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="border-b border-border bg-background-secondary px-6 py-4">
        <h3 className="font-semibold text-foreground">Global Skills Gap Analyzer</h3>
        <p className="text-sm text-foreground-secondary mt-1">
          Aggregated across {applications.filter(a => a.status !== "draft").length} active applications. 
          Focus on learning these to boost your market match rate.
        </p>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {missingSkills.map(({ skill, count }) => (
            <div key={skill} className="flex items-center gap-4">
              <div className="w-32 truncate text-sm font-medium text-foreground text-right" title={skill}>
                {skill}
              </div>
              <div className="flex-1 h-6 bg-border rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
              <div className="w-16 text-sm text-foreground-secondary">
                {count} job{count !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
