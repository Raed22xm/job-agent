export interface JobContactInfo {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

const EMAIL_PATTERN =
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi;

const IGNORED_EMAIL_LOCAL_PARTS = new Set([
  "noreply",
  "no-reply",
  "donotreply",
  "mailer-daemon",
  "postmaster",
]);

const PHONE_PATTERNS = [
  /(?:\+45|0045)\s*(?:[2-9]\d{2}|\d{2})\s*\d{2}\s*\d{2}\s*\d{2}\b/g,
  /\b(?:\+45|0045)[\s.-]?[2-9]\d{7}\b/g,
  /\b[2-9]\d{7}\b/g,
];

const CONTACT_NAME_PATTERNS = [
  /(?:kontakt(?:person)?|contact(?:\s+person)?|recruiter|hiring manager|hr manager|ansvarlig(?:\s+rekruttør)?)\s*[:\-–]\s*([A-ZÆØÅ][A-Za-zÆØÅæøåé.-]+(?:\s+[A-ZÆØÅ][A-Za-zÆØÅæøåé.-]+){0,3})/i,
  /(?:ansøg(?:ning)?(?:er)?\s+sendes\s+til|spørgsmål\s+(?:kan\s+)?(?:rettes\s+til|til)|contact\s+us\s+at|reach\s+out\s+to|write\s+to)\s+([A-ZÆØÅ][A-Za-zÆØÅæøåé.-]+(?:\s+[A-ZÆØÅ][A-Za-zÆØÅæøåé.-]+){0,3})/i,
  /([A-ZÆØÅ][A-Za-zÆØÅæøåé.-]+(?:\s+[A-ZÆØÅ][A-Za-zÆØÅæøåé.-]+){0,3})\s*[<(,]\s*[A-Za-z0-9._%+-]+@/,
  /([A-ZÆØÅ][A-Za-zÆØÅæøåé.-]+(?:\s+[A-ZÆØÅ][A-Za-zÆØÅæøåé.-]+){0,3})\s*,\s*[A-Za-z0-9._%+-]+@/,
];

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isIgnoredEmail(email: string): boolean {
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  if (IGNORED_EMAIL_LOCAL_PARTS.has(local)) return true;
  if (local.startsWith("noreply")) return true;
  return false;
}

function extractEmails(text: string): string[] {
  const matches = text.match(EMAIL_PATTERN) ?? [];
  return Array.from(
    new Set(
      matches
        .map((email) => email.trim().toLowerCase())
        .filter((email) => !isIgnoredEmail(email))
    )
  );
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("45") && digits.length === 10) {
    const local = digits.slice(2);
    return `+45 ${local.slice(0, 2)} ${local.slice(2, 4)} ${local.slice(4, 6)} ${local.slice(6, 8)}`;
  }
  if (digits.length === 8) {
    return `+45 ${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)}`;
  }
  return normalizeWhitespace(raw);
}

function extractPhones(text: string): string[] {
  const found: string[] = [];
  for (const pattern of PHONE_PATTERNS) {
    const matches = text.match(pattern) ?? [];
    for (const match of matches) {
      const normalized = normalizePhone(match);
      if (normalized.replace(/\D/g, "").length >= 8) {
        found.push(normalized);
      }
    }
  }
  return Array.from(new Set(found));
}

function looksLikePersonName(value: string): boolean {
  const trimmed = normalizeWhitespace(value);
  if (!trimmed || trimmed.length < 3 || trimmed.length > 60) return false;
  if (/@|https?:|linkedin|www\./i.test(trimmed)) return false;
  if (/^\d/.test(trimmed)) return false;
  if (
    /^(the|our|your|hr|recruitment|careers|jobs|team|department|office|apply|digitalt|personligt|telefonisk)$/i.test(
      trimmed
    )
  ) {
    return false;
  }
  return /^[A-ZÆØÅ][A-Za-zÆØÅæøåé.-]+(\s+[A-ZÆØÅ][A-Za-zÆØÅæøåé.-]+){0,3}$/.test(
    trimmed
  );
}

function extractContactNameFromText(text: string, email?: string): string {
  for (const pattern of CONTACT_NAME_PATTERNS) {
    const match = text.match(pattern);
    const candidate = match?.[1]?.trim();
    if (candidate && looksLikePersonName(candidate)) {
      return candidate;
    }
  }

  if (email) {
    const localPart = email.split("@")[0] ?? "";
    const fromLocal = localPart
      .replace(/[._-]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
    if (looksLikePersonName(fromLocal)) {
      return fromLocal;
    }

    const beforeEmail = text.match(
      new RegExp(
        `([A-ZÆØÅ][A-Za-zÆØÅæøåé.-]+(?:\\s+[A-ZÆØÅ][A-Za-zÆØÅæøåé.-]+){0,3})\\s*[,<(]?\\s*${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
        "i"
      )
    );
    const nameBeforeEmail = beforeEmail?.[1]?.trim();
    if (nameBeforeEmail && looksLikePersonName(nameBeforeEmail)) {
      return nameBeforeEmail;
    }
  }

  return "";
}

function parseRecruiterContactField(value?: string): JobContactInfo {
  if (!value?.trim()) {
    return { contactName: "", contactEmail: "", contactPhone: "" };
  }

  const text = value.trim();
  const emails = extractEmails(text);
  const phones = extractPhones(text);
  const email = emails[0] ?? "";
  const phone = phones[0] ?? "";

  let nameCandidate = text;
  if (email) {
    nameCandidate = nameCandidate.replace(new RegExp(email, "i"), "");
  }
  if (phone) {
    nameCandidate = nameCandidate.replace(phone, "");
  }
  nameCandidate = nameCandidate
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/linkedin\.com\/\S+/gi, "")
    .replace(/[,;|/]+/g, " ")
    .trim();

  const contactName = looksLikePersonName(nameCandidate)
    ? nameCandidate
    : extractContactNameFromText(text, email);

  return {
    contactName,
    contactEmail: email,
    contactPhone: phone,
  };
}

function pickBestEmail(
  fromPosting: string[],
  fromManual: string
): string {
  if (fromManual) return fromManual;
  return fromPosting[0] ?? "";
}

function pickBestPhone(
  fromPosting: string[],
  fromManual: string
): string {
  if (fromManual) return fromManual;
  return fromPosting[0] ?? "";
}

function pickBestName(
  fromPosting: string,
  fromManual: string,
  email: string
): string {
  if (fromManual) return fromManual;
  if (fromPosting) return fromPosting;
  return extractContactNameFromText("", email);
}

/**
 * Extract recruiter contact fields from job posting text and optional manual tracker input.
 * Only returns values found in the provided strings — never invents data.
 */
export function extractJobContact(
  rawText: string,
  recruiterContact?: string
): JobContactInfo {
  const postingEmails = extractEmails(rawText);
  const postingPhones = extractPhones(rawText);
  const manual = parseRecruiterContactField(recruiterContact);

  const contactEmail = pickBestEmail(postingEmails, manual.contactEmail);
  const contactPhone = pickBestPhone(postingPhones, manual.contactPhone);
  const postingName = extractContactNameFromText(rawText, contactEmail);
  const contactName = pickBestName(
    postingName,
    manual.contactName,
    contactEmail
  );

  return {
    contactName: normalizeWhitespace(contactName),
    contactEmail: normalizeWhitespace(contactEmail),
    contactPhone: normalizeWhitespace(contactPhone),
  };
}

/** Single-line tracker value from extracted contact fields. */
export function formatRecruiterContact(contact: JobContactInfo): string | undefined {
  const parts = [
    contact.contactName,
    contact.contactEmail,
    contact.contactPhone,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : undefined;
}
