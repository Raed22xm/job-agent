const DEADLINE_PATTERNS = [
  /(?:ansøgningsfrist|application deadline|apply by|apply before|deadline|senest(?:\s+d\.\s*)?)\s*[:\-–]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i,
  /(?:ansøgningsfrist|application deadline|apply by|apply before|deadline)\s*[:\-–]?\s*(\d{1,2}\.\s*(?:januar|februar|marts|april|maj|juni|juli|august|september|oktober|november|december)\s*\d{4})/i,
  /(?:ansøgningsfrist|application deadline|apply by|apply before|deadline)\s*[:\-–]?\s*((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4})/i,
];

const DANISH_STREET_PATTERN =
  /\b([A-ZÆØÅ0-9][A-Za-zÆØÅæøå0-9 .,'-]*(?:vej|gade|allé|alle|boulevard|boul\.|plads|stræde|torv|kanal|parken|vænge|stien|kvarter|hus)\.?(?:\s+\d+[A-Za-z]?)?(?:,\s*)?(?:\d{4}\s+[A-ZÆØÅ][A-Za-zÆØÅæøå .-]+)?)/i;

const OFFICE_LOCATION_PATTERNS = [
  /(?:office|kontor|arbejdssted|lokation|location|based at|headquarters|hq)\s*[:\-–]\s*([^\n.]{8,120})/i,
  /(?:office in|kontor i|kontor på|located in|beliggende i)\s+([^\n.]{8,120})/i,
];

function parseDateToIso(raw: string): string | undefined {
  const trimmed = raw.trim();

  const dotted = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (dotted) {
    const day = Number(dotted[1]);
    const month = Number(dotted[2]);
    let year = Number(dotted[3]);
    if (year < 100) year += 2000;
    const date = new Date(Date.UTC(year, month - 1, day));
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  }

  const danishMonths: Record<string, number> = {
    januar: 0,
    februar: 1,
    marts: 2,
    april: 3,
    maj: 4,
    juni: 5,
    juli: 6,
    august: 7,
    september: 8,
    oktober: 9,
    november: 10,
    december: 11,
  };
  const danish = trimmed.match(
    /^(\d{1,2})\.\s*(januar|februar|marts|april|maj|juni|juli|august|september|oktober|november|december)\s*(\d{4})$/i
  );
  if (danish) {
    const month = danishMonths[danish[2].toLowerCase()];
    const date = new Date(Date.UTC(Number(danish[3]), month, Number(danish[1])));
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  }

  const english = Date.parse(trimmed);
  if (!Number.isNaN(english)) {
    return new Date(english).toISOString().slice(0, 10);
  }

  return undefined;
}

/** Extract application deadline from posting text (ISO date YYYY-MM-DD). */
export function extractJobDeadline(rawText: string): string | undefined {
  for (const pattern of DEADLINE_PATTERNS) {
    const match = rawText.match(pattern);
    const candidate = match?.[1]?.trim();
    if (!candidate) continue;
    const iso = parseDateToIso(candidate);
    if (iso) return iso;
  }
  return undefined;
}

function cleanExtractedAddress(value: string): string {
  return value.replace(/\s+/g, " ").replace(/[.,]+$/g, "").trim();
}

/** Extract workplace street/address line from posting text when available. */
export function extractWorkplaceAddress(rawText: string): string {
  const streetMatch = rawText.match(DANISH_STREET_PATTERN);
  if (streetMatch?.[1]) {
    return cleanExtractedAddress(streetMatch[1]);
  }

  for (const pattern of OFFICE_LOCATION_PATTERNS) {
    const match = rawText.match(pattern);
    const candidate = match?.[1]?.trim();
    if (candidate && candidate.length >= 8) {
      return cleanExtractedAddress(candidate);
    }
  }

  return "";
}

export type JobnetApplyMethod = "Digitalt" | "Personligt" | "Telefonisk";
export type JobnetFoundVia = "Opslået stilling" | "Uopfordret" | "Gennem Netværk";

export function inferJobnetFoundVia(
  rawText: string,
  hasJobLink: boolean
): JobnetFoundVia {
  const haystack = rawText.toLowerCase();
  if (/\buopfordret\b/.test(haystack) || /\bunsolicited\b/.test(haystack)) {
    return "Uopfordret";
  }
  if (
    /\bgennem netværk\b/.test(haystack) ||
    /\bthrough (?:my )?network\b/.test(haystack) ||
    /\breferral\b/.test(haystack)
  ) {
    return "Gennem Netværk";
  }
  if (hasJobLink) return "Opslået stilling";
  return "Opslået stilling";
}

export function inferJobnetApplyMethod(rawText: string): JobnetApplyMethod {
  const haystack = rawText.toLowerCase();
  if (
    /\btelefonisk\b/.test(haystack) ||
    /\bby phone\b/.test(haystack) ||
    /\bring\b.*(?:ansøg|apply)/.test(haystack)
  ) {
    return "Telefonisk";
  }
  if (
    /\bpersonligt\b/.test(haystack) ||
    /\bin person\b/.test(haystack) ||
    /\bdrop off\b/.test(haystack)
  ) {
    return "Personligt";
  }
  return "Digitalt";
}
