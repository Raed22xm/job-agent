import {
  extractKnownTerms,
  KNOWN_SKILLS,
  KNOWN_TOOLS,
  normalizeTerm,
} from "@/lib/jobDictionaries";
import type { ParsedJob } from "@/types";

const BOILERPLATE_LINE =
  /^(skip to main content|skip to content|career menu|share page|apply now|back to jobs|back to job|menu|navigation|cookie|accept all)$/i;

function isBoilerplateLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (BOILERPLATE_LINE.test(trimmed)) return true;
  if (/^(home|jobs|careers|about us|about)$/i.test(trimmed)) return true;
  return false;
}

function meaningfulLines(lines: string[]): string[] {
  return lines.filter((line) => !isBoilerplateLine(line));
}

function extractJoinAsTitle(text: string): string | null {
  const match = text.match(
    /join\s+([A-Za-z0-9][A-Za-z0-9&.'-]{1,45})\s+as\s+(?:a\s+|an\s+|the\s+)?(.+?)(?:[!?.]|$)/i
  );
  const title = match?.[2]?.trim();
  if (title && title.length >= 3 && title.length <= 70) {
    return title.replace(/\s+/g, " ");
  }
  return null;
}

function extractJoinAsCompany(text: string): string | null {
  const match = text.match(
    /join\s+([A-Za-z0-9][A-Za-z0-9&.'-]{1,45})\s+as\b/i
  );
  const company = match?.[1]?.trim();
  if (company && company.length >= 2 && company.length <= 50) {
    return company;
  }
  return null;
}

function looksLikeRoleTitle(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 70) return false;
  if (trimmed.endsWith(".")) return false;
  if (/^(about|requirements|responsibilities|what we|who you)/i.test(trimmed)) {
    return false;
  }
  return (
    /\b(lead|manager|engineer|developer|designer|architect|consultant|specialist|student|assistant|director|coordinator|analyst|strategist|owner)\b/i.test(
      trimmed
    ) || /\b(ux|ui|frontend|backend|full[- ]stack|product|portfolio)\b/i.test(trimmed)
  );
}

function extractLocationFromDotLine(line: string): string | null {
  if (!/[·•]/.test(line)) return null;
  const segment = line.split(/[·•]/).pop()?.trim();
  if (!segment || segment.length < 3) return null;

  const dkMatch = segment.match(/^DK\s*-\s*(.+)$/i);
  if (dkMatch?.[1]) return dkMatch[1].trim();

  if (/^[A-Za-zÆØÅæøå .-]{3,60}$/.test(segment)) {
    return segment;
  }

  return null;
}

const SECTION_HEADINGS = {
  responsibilities:
    /^(responsibilities|what you('ll| will) do|what you'll do|role overview|key responsibilities)/i,
  requirements:
    /^(requirements|qualifications|what we('re| are) looking for|must have|required skills|minimum qualifications)/i,
  skills: /^(skills|technical skills|core competencies)/i,
};

function splitLines(text: string): string[] {
  return text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
}

function isBulletLine(line: string): boolean {
  return /^(\d+[.)]|[-•*–—])\s+/.test(line);
}

function cleanBullet(line: string): string {
  return line.replace(/^(\d+[.)]|[-•*–—])\s+/, "").trim();
}

function extractSectionItems(
  lines: string[],
  heading: RegExp,
  limit = 8
): string[] {
  const start = lines.findIndex((line) => heading.test(line));
  if (start === -1) return [];

  const items: string[] = [];

  for (let i = start + 1; i < lines.length && items.length < limit; i++) {
    const line = lines[i];

    if (
      Object.values(SECTION_HEADINGS).some(
        (pattern) => pattern.test(line) && !heading.test(line)
      )
    ) {
      break;
    }

    if (isBulletLine(line) || line.length > 20) {
      items.push(cleanBullet(line));
    } else if (items.length > 0) {
      break;
    }
  }

  return items.filter((item) => item.length > 10);
}

function extractResponsibilities(text: string, lines: string[]): string[] {
  const fromSection = extractSectionItems(lines, SECTION_HEADINGS.responsibilities);
  if (fromSection.length > 0) return fromSection;

  const bullets = lines
    .filter(isBulletLine)
    .map(cleanBullet)
    .filter((line) => line.length > 20)
    .slice(0, 6);

  return bullets;
}

function extractRequirements(text: string, lines: string[]): string[] {
  const fromSection = extractSectionItems(lines, SECTION_HEADINGS.requirements);
  if (fromSection.length > 0) return fromSection;

  const requirementPatterns = [
    /(\d+\+?\s*years?\s+(?:of\s+)?experience[^.\n]{0,80})/gi,
    /(bachelor(?:'s)?\s+degree[^.\n]{0,60})/gi,
    /(must have[^.\n]{0,80})/gi,
    /(proficiency in[^.\n]{0,80})/gi,
  ];

  const matches: string[] = [];
  for (const pattern of requirementPatterns) {
    const found = text.match(pattern) ?? [];
    matches.push(...found.map((m) => m.trim()));
  }

  return Array.from(new Set(matches)).slice(0, 6);
}

function extractTitle(lines: string[]): string {
  const contentLines = meaningfulLines(lines);
  const fullText = contentLines.join("\n");

  const joinTitle = extractJoinAsTitle(fullText);
  if (joinTitle) return joinTitle;

  const labeled = contentLines.find((line) =>
    /^(job title|position|role|stilling)\s*[:]/i.test(line)
  );
  if (labeled) {
    return labeled.replace(/^(job title|position|role|stilling)\s*[:]\s*/i, "").trim();
  }

  for (const line of contentLines.slice(0, 12)) {
    if (looksLikeRoleTitle(line)) {
      return line.trim();
    }
  }

  const firstLine = contentLines[0] ?? "";

  const titleFromPipe = firstLine.match(/^(.+?)\s+[|–-]\s+/);
  if (titleFromPipe?.[1] && titleFromPipe[1].length <= 70) {
    return titleFromPipe[1].trim();
  }

  if (
    firstLine.length > 0 &&
    firstLine.length <= 70 &&
    !firstLine.endsWith(".") &&
    !/^(about|company|overview|description|join\s+)/i.test(firstLine)
  ) {
    return firstLine;
  }

  const roleMatch = textMatchRole(fullText);
  return roleMatch ?? "Role title not detected";
}

function textMatchRole(text: string): string | null {
  const match = text.match(
    /\b((?:Senior|Staff|Lead|Principal|Junior|Mid)?\s*(?:Full[- ]Stack|Front[- ]End|Back[- ]End|Software|Web|Data|DevOps|Platform|Mobile)?\s*(?:Engineer|Developer|Architect|Manager|Designer))\b/i
  );
  return match?.[1]?.trim() ?? null;
}

function looksLikeLocationSegment(segment: string): boolean {
  return (
    /\bremote\b/i.test(segment) ||
    /\bhybrid\b/i.test(segment) ||
    /\bon[- ]site\b/i.test(segment) ||
    /\b[A-Z][a-z]+,\s*[A-Z]{2}\b/.test(segment) ||
    /\(/.test(segment)
  );
}

function extractCompanyFromMetaLine(line: string): string | null {
  const parts = line.split(/\s*[·•]\s*/);
  if (parts.length < 2) return null;

  const company = parts[0].trim();
  const rest = parts.slice(1).join(" · ").trim();

  if (
    company.length >= 2 &&
    company.length <= 50 &&
    looksLikeLocationSegment(rest)
  ) {
    return company;
  }

  return null;
}

function extractCompany(text: string, lines: string[], sourceUrl?: string): string {
  const contentLines = meaningfulLines(lines);

  const joinCompany = extractJoinAsCompany(text);
  if (joinCompany) return joinCompany;

  const labeled = contentLines.find((line) =>
    /^(company|employer|organization|virksomhed)\s*[:]/i.test(line)
  );
  if (labeled) {
    return labeled
      .replace(/^(company|employer|organization|virksomhed)\s*[:]\s*/i, "")
      .trim();
  }

  const pipeMatch = contentLines[0]?.match(/^(.+?)\s+[|–-]\s+(.+?)$/);
  if (pipeMatch?.[2]) {
    const company = pipeMatch[2].trim();
    if (company.length >= 2 && company.length <= 50) {
      return company;
    }
  }

  for (const line of contentLines.slice(0, 8)) {
    const fromMeta = extractCompanyFromMetaLine(line);
    if (fromMeta) return fromMeta;
  }

  for (let i = 0; i < Math.min(contentLines.length - 1, 8); i++) {
    const line = contentLines[i].trim();
    const next = contentLines[i + 1]?.trim() ?? "";
    if (
      line.length >= 2 &&
      line.length <= 40 &&
      !/[·•|]/.test(line) &&
      !looksLikeRoleTitle(line) &&
      (looksLikeRoleTitle(next) || /join\s+/i.test(next))
    ) {
      return line;
    }
  }

  const joinMatch = text.match(
    /(?:join|at)\s+([A-Za-z0-9][A-Za-z0-9&.'-]{1,45})(?:\.|,|\s+as\b|\s+team)/i
  );
  if (joinMatch?.[1]) return joinMatch[1].trim();

  const atMatch = text.match(
    /\bat\s+([A-Z][A-Za-z0-9&.'-]{2,45})(?:\s+[,|]|\.|\s+we\b)/i
  );
  if (atMatch?.[1]) return atMatch[1].trim();

  if (sourceUrl) {
    try {
      const hostname = new URL(sourceUrl).hostname.replace(/^www\./, "");
      const segment = hostname.split(".")[0];
      if (
        segment &&
        segment !== "jobs" &&
        segment !== "careers" &&
        segment !== "apply"
      ) {
        return segment.charAt(0).toUpperCase() + segment.slice(1);
      }
    } catch {
      // ignore invalid URL
    }
  }

  return "Not detected";
}

function extractLocation(text: string, lines?: string[]): string {
  const labeled = text.match(
    /(?:location|based in|office location|lokation|arbejdssted)\s*[:]\s*([A-Za-z0-9,\sÆØÅæøå-]{3,60})/i
  );
  if (labeled?.[1]) return labeled[1].trim().replace(/\.$/, "");

  const contentLines = meaningfulLines(lines ?? splitLines(text));
  for (const line of contentLines.slice(0, 12)) {
    const fromDot = extractLocationFromDotLine(line);
    if (fromDot) return fromDot;
  }

  const dkCity = text.match(/\b(?:DK\s*-\s*)?(København|Copenhagen|Aarhus|Odense|Aalborg)\b/i);
  if (dkCity?.[1]) return dkCity[1];

  const cityState = text.match(
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*[A-Z]{2})\b/
  );
  if (cityState?.[1] && !/^Unite,\s*DX$/i.test(cityState[1])) {
    return cityState[1];
  }

  if (/\bremote\b/i.test(text) && /\bhybrid\b/i.test(text)) return "Hybrid";
  if (/\bremote\b/i.test(text)) return "Remote";
  if (/\bhybrid\b/i.test(text)) return "Hybrid";
  if (/\bon[- ]site\b/i.test(text)) return "On-site";

  return "Not detected";
}

function buildAtsKeywords(
  skills: string[],
  tools: string[],
  requirements: string[],
  responsibilities: string[]
): string[] {
  const combined = [...skills, ...tools];
  const contextText = [...requirements, ...responsibilities].join(" ");
  const contextual = extractKnownTerms(contextText, [...KNOWN_SKILLS, ...KNOWN_TOOLS]);

  return Array.from(
    new Set(
      [...combined, ...contextual].map((term) => normalizeTerm(term)).filter(Boolean)
    )
  ).map((term) => {
    const original =
      [...KNOWN_SKILLS, ...KNOWN_TOOLS].find(
        (item) => normalizeTerm(item) === term
      ) ?? term;
    return original;
  });
}

export class JobParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JobParseError";
  }
}

/**
 * Demo job parser — extracts structured fields from pasted text only.
 * Does not invent missing fields; undetected values are labeled explicitly.
 */
export function parseJob(input: string, sourceUrl?: string): ParsedJob {
  const rawText = input.trim();

  if (!rawText) {
    throw new JobParseError(
      "Please paste a job description before analyzing."
    );
  }

  if (rawText.length < 40) {
    throw new JobParseError(
      "Job description is too short. Paste the full posting for meaningful analysis."
    );
  }

  const lines = splitLines(rawText);
  const skills = extractKnownTerms(rawText, KNOWN_SKILLS);
  const tools = extractKnownTerms(rawText, KNOWN_TOOLS);
  const responsibilities = extractResponsibilities(rawText, lines);
  const requirements = extractRequirements(rawText, lines);
  const atsKeywords = buildAtsKeywords(skills, tools, requirements, responsibilities);

  return {
    title: extractTitle(lines),
    company: extractCompany(rawText, lines, sourceUrl),
    location: extractLocation(rawText, lines),
    responsibilities,
    requirements,
    tools,
    skills,
    atsKeywords,
    rawText,
    sourceUrl: sourceUrl?.trim() || undefined,
  };
}

export function isLikelyUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Re-run parser on stored raw text (e.g. after parser improvements). */
export function refreshParsedJob(job: ParsedJob): ParsedJob {
  if (!job.rawText?.trim()) return job;
  try {
    return parseJob(job.rawText, job.sourceUrl);
  } catch {
    return job;
  }
}
