import cron from "node-cron";
import { checkInboxForReplies } from "../src/lib/imapSync";

const API_BASE = "http://localhost:3000/api";
const MATCH_THRESHOLD = 85;

// Optional: Discord Webhook URL for push notifications
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

async function sendDiscordNotification(job: any, matchScore: number) {
  if (!DISCORD_WEBHOOK_URL) return;

  const payload = {
    username: "Job Agent Daemon",
    avatar_url: "https://i.imgur.com/4M34hi2.png",
    embeds: [
      {
        title: `🔥 High Match Job Found: ${job.title}`,
        url: job.url,
        color: 0x00FF00,
        fields: [
          { name: "Company", value: job.company, inline: true },
          { name: "Match Score", value: `${matchScore}%`, inline: true },
          { name: "Location", value: job.location, inline: true },
        ],
        footer: { text: "Job Agent Tracker • Auto-Scraped" },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log(`[Daemon] 📱 Push notification sent for ${job.title}`);
  } catch (error) {
    console.error("[Daemon] Failed to send Discord notification", error);
  }
}

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
      
      if (matchedJob && matchedJob.matchScore >= MATCH_THRESHOLD) {
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
          
          // Send Mobile Push Notification
          await sendDiscordNotification(job, matchedJob.matchScore);
          
          excellentMatches++;
        }
      }
    }
    
    console.log(`[Daemon] Sweep complete. Found ${excellentMatches} highly qualified roles ready for outreach.`);

    // 3. Check for recruiter replies
    console.log(`[Daemon] Checking IMAP Inbox for recruiter replies...`);
    const replies = await checkInboxForReplies();
    if (replies.length > 0) {
      console.log(`[Daemon] 📬 Found ${replies.length} new replies.`);
      // In a full system, we would match these against the Tracker DB
      // and use AI to update status to "Interview" or "Rejected"
    } else {
      console.log(`[Daemon] 📭 No new recruiter replies.`);
    }

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
