"use client";

import { useEffect } from "react";
import { useJobAgent } from "@/context/JobAgentContext";
import { saveApplication } from "@/lib/storage";
import { logger } from "@/lib/logger";
import type { Application } from "@/types";
import type { ScoutedJob } from "@/lib/agent/jobScout";

export default function AutoScoutDaemon() {
  const { applications, refreshApplications } = useJobAgent();

  useEffect(() => {
    const checkDaemon = async () => {
      try {
        const lastRun = localStorage.getItem("autoScoutLastRun");
        const now = Date.now();
        // Run once every 24 hours
        if (lastRun && now - parseInt(lastRun, 10) < 24 * 60 * 60 * 1000) {
          return;
        }

        logger.info("Running background scout...");
        
        // Find top market from Geo Audit if available, or default to remote
        const geoResultStr = localStorage.getItem("geoAuditResult");
        let market = "remote";
        if (geoResultStr) {
            const geoResult = JSON.parse(geoResultStr);
            if (geoResult?.topRecommendation?.city) {
                market = geoResult.topRecommendation.city;
            }
        }

        // We run a scout query
        const res = await fetch("/api/agent/job-scout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markets: ["remote", "dk"], location: market }),
        });

        if (!res.ok) throw new Error("Daemon API failed");
        
        const data = (await res.json()) as { jobs: ScoutedJob[] };
        const highMatches = (data.jobs || []).filter(
          (j: ScoutedJob) => j.matchScore && j.matchScore >= 85
        );
        
        let newCount = 0;
        for (const job of highMatches) {
          // Check if already in tracker
          const exists = applications.some(a => a.jobTitle === job.title && a.company === job.company);
          if (!exists) {
            const app: Partial<Application> = {
              id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              company: job.company,
              jobTitle: job.title,
              location: job.location,
              link: job.url,
              matchScore: job.matchScore ?? 0,
              status: "draft",
              coverLetterStatus: "none",
              job: { 
                title: job.title, company: job.company, location: job.location,
                responsibilities: [], requirements: [], tools: job.tags,
                skills: job.tags, atsKeywords: [], rawText: job.description ?? "",
                sourceUrl: job.url 
              },
              match: { score: job.matchScore ?? 0, matchedKeywords: job.tags, missingKeywords: [], recommendedFocusAreas: [], summary: "" },
              notes: "Added by Auto-Scout Daemon 🤖"
            };
            await saveApplication(app as Application);
            newCount++;
          }
        }

        if (newCount > 0) {
          await refreshApplications();
          // Optional: You could trigger a push notification here using the Notifications API
          console.log(`[AutoScout Daemon] Found and saved ${newCount} high-match jobs!`);
        }

        localStorage.setItem("autoScoutLastRun", now.toString());
      } catch (err) {
        console.error("[AutoScout Daemon] Error:", err);
      }
    };

    // Small delay to not block initial render
    const timer = setTimeout(() => {
      void checkDaemon();
    }, 5000);

    return () => clearTimeout(timer);
  }, [applications, refreshApplications]);

  return null; // Hidden component
}
