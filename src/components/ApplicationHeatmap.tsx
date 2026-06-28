import { useMemo } from "react";
import type { Application } from "@/types";

interface ApplicationHeatmapProps {
  applications: Application[];
}

export default function ApplicationHeatmap({ applications }: ApplicationHeatmapProps) {
  // Generate last 90 days of dates
  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateArray = [];
    
    // Create map of counts
    const counts = new Map<string, number>();
    applications.forEach(app => {
      // Just use the ISO date part (YYYY-MM-DD)
      const datePart = app.createdAt.split('T')[0];
      counts.set(datePart, (counts.get(datePart) || 0) + 1);
    });

    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      
      dateArray.push({
        date: iso,
        count: counts.get(iso) || 0,
      });
    }
    return dateArray;
  }, [applications]);

  // Calculate Streak
  const { currentStreak, maxStreak } = useMemo(() => {
    let current = 0;
    let max = 0;
    
    // Loop from today backwards
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].count > 0) {
        current++;
        max = Math.max(max, current);
      } else {
        break; // streak broken
      }
    }
    
    // Loop through all for max streak
    let tempMax = 0;
    for (let i = 0; i < days.length; i++) {
      if (days[i].count > 0) {
        tempMax++;
        max = Math.max(max, tempMax);
      } else {
        tempMax = 0;
      }
    }

    return { currentStreak: current, maxStreak: max };
  }, [days]);

  return (
    <div className="rounded-xl border border-border bg-background p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Application Heatmap (90 Days)</h2>
          <p className="text-xs text-foreground-secondary mt-0.5">Stay consistent. 1 application a day keeps the Jobnet stress away.</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-foreground-secondary text-xs mr-1">Current Streak:</span>
            <span className="font-bold text-emerald-600">{currentStreak} {currentStreak === 1 ? 'day' : 'days'}</span>
          </div>
          <div>
            <span className="text-foreground-secondary text-xs mr-1">Longest Streak:</span>
            <span className="font-bold text-foreground">{maxStreak} {maxStreak === 1 ? 'day' : 'days'}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-[3px]">
        {days.map((day) => {
          let color = "bg-background-secondary border border-border";
          if (day.count === 1) color = "bg-emerald-200 border border-emerald-300";
          else if (day.count === 2) color = "bg-emerald-400 border border-emerald-500";
          else if (day.count > 2) color = "bg-emerald-600 border border-emerald-700";

          return (
            <div
              key={day.date}
              className={`h-3 w-3 rounded-sm ${color} transition-colors hover:scale-125 hover:z-10`}
              title={`${day.count} applications on ${day.date}`}
            />
          );
        })}
      </div>
    </div>
  );
}
