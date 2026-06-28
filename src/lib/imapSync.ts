import imaps from "imap-simple";
import { simpleParser } from "mailparser";

export async function checkInboxForReplies() {
  const config = {
    imap: {
      user: process.env.EMAIL_USER || "",
      password: process.env.EMAIL_PASSWORD || "",
      host: process.env.IMAP_HOST || "imap.gmail.com",
      port: 993,
      tls: true,
      authTimeout: 3000,
    },
  };

  if (!config.imap.user || !config.imap.password) {
    console.log("[IMAP Sync] Missing EMAIL_USER or EMAIL_PASSWORD. Skipping.");
    return [];
  }

  try {
    const connection = await imaps.connect(config);
    await connection.openBox("INBOX");

    // Fetch emails from the last 2 days
    const delay = 2 * 24 * 3600 * 1000;
    const since = new Date();
    since.setTime(Date.now() - delay);
    
    const searchCriteria = [
      "UNSEEN",
      ["SINCE", since.toISOString()],
    ];
    
    const fetchOptions = {
      bodies: ["HEADER", "TEXT"],
      markSeen: true,
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    const parsedMessages = [];

    for (const item of messages) {
      const allParts = imaps.getParts(item.attributes.struct as any);
      let textPart: any = null;

      // Find the text part of the email
      for (const part of allParts) {
        if (part.type === "text" && part.subtype === "plain") {
          textPart = part;
          break;
        }
      }

      const bodyData = await connection.getPartData(item, textPart || allParts[0]);
      
      const parsed = await simpleParser(bodyData);
      
      parsedMessages.push({
        from: parsed.from?.text,
        subject: parsed.subject,
        text: parsed.text,
        date: parsed.date,
      });
    }

    connection.end();
    return parsedMessages;

  } catch (err) {
    console.error("[IMAP Sync] Error syncing inbox:", err);
    return [];
  }
}
