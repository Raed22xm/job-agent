import cron from "node-cron";

const API_BASE = "http://localhost:3000/api";

async function runDaemonSweep() {
  console.log(`[Daemon] Starting autonomous sweep at ${new Date().toISOString()}`);

  try {
    // 1. Scrape TheHub
    console.log(`[Daemon] Triggering Scraper Swarm...`);
    const scrapeRes = await fetch(`${API_BASE}/agent/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "frontend" }),
    });
    
    if (!scrapeRes.ok) throw new Error("Failed to scrape jobs");
    const { jobs } = await scrapeRes.json();
    console.log(`[Daemon] Scraped ${jobs.length} jobs.`);

    if (jobs.length === 0) return;

    // 2. We could evaluate the jobs via job-scout or just log them for now
    // In a real autonomous system, we'd loop through jobs, hit semanticMatchCV,
    // and if score > 85, hit outreach and save to DB.
    console.log(`[Daemon] Analyzing jobs against personas...`);
    
    let excellentMatches = 0;
    for (const job of jobs) {
      // Simulate scoring via job-scout
      const scoutRes = await fetch(`${API_BASE}/agent/job-scout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: job.title, personaId: "default" }),
      });
      
      const scoutData = await scoutRes.json();
      const matchedJob = scoutData.jobs?.[0]; // Get the first match to see if it scored well
      
      if (matchedJob && matchedJob.matchScore >= 85) {
        console.log(`[Daemon] 🎯 High match found: ${job.title} (${matchedJob.matchScore}%)`);
        
        // Draft an email
        const outreachRes = await fetch(`${API_BASE}/agent/outreach`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobTitle: job.title,
            company: job.company,
            tags: job.tags,
            personaId: "default"
          }),
        });
        
        if (outreachRes.ok) {
          console.log(`[Daemon] ✅ Outreach email drafted for ${job.company}`);
          excellentMatches++;
        }
      }
    }
    
    console.log(`[Daemon] Sweep complete. Found ${excellentMatches} highly qualified roles ready for outreach.`);

  } catch (error) {
    console.error("[Daemon] Error during sweep:", error);
  }
}

// Run every 6 hours
cron.schedule("0 */6 * * *", () => {
  runDaemonSweep();
});

console.log("[Daemon] 24/7 Autonomous Daemon is now running. Sweeping every 6 hours.");
// Run once immediately on startup
runDaemonSweep();
