import type { Application, ApplicationStatus } from "@/types";
import { extractJobContact } from "@/lib/jobnet/extractJobContact";
import {
  extractJobDeadline,
  extractWorkplaceAddress,
  inferJobnetApplyMethod,
  inferJobnetFoundVia,
  type JobnetApplyMethod,
  type JobnetFoundVia,
} from "@/lib/jobnet/extractJobPostingMeta";

export type { JobnetApplyMethod, JobnetFoundVia };
export type JobnetProgressStatus = "Ikke søgt" | "Søgt" | "Samtale";
export type JobnetWorkingHours = "Fuldtid" | "Deltid";

/** Matches scroll order on jobnet.dk → Opret joblog */
export const JOBNET_SECTION_ORDER = [
  "Om jobbet",
  "Om arbejdspladsen",
  "Kontakt og link",
  "Om din jobsøgning",
  "Noter",
  "Upload på Jobnet",
] as const;

export type JobnetFieldType = "text" | "radio" | "info" | "upload";

export interface JobnetLogField {
  key: string;
  label: string;
  value: string;
  jobnetSection: (typeof JOBNET_SECTION_ORDER)[number];
  required: boolean;
  missing: boolean;
  fieldType: JobnetFieldType;
  options?: string[];
  hint?: string;
}

export interface JobnetLogEntry {
  fields: JobnetLogField[];
  description: string;
  missingRequired: string[];
}

export interface BuildJobnetLogOptions {
  portfolioUrl?: string;
  applyMethod?: JobnetApplyMethod;
  foundVia?: JobnetFoundVia;
}

function formatJobnetDate(isoDate?: string): string {
  if (!isoDate?.trim()) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export function mapApplicationStatusToJobnet(
  status: ApplicationStatus
): JobnetProgressStatus {
  if (status === "interview") return "Samtale";
  if (status === "applied" || status === "rejected" || status === "offer") {
    return "Søgt";
  }
  return "Ikke søgt";
}

export function inferWorkingHours(
  jobTitle: string,
  location: string,
  rawText?: string
): JobnetWorkingHours {
  const haystack = `${jobTitle} ${location} ${rawText ?? ""}`.toLowerCase();
  if (
    /\bdeltid\b/.test(haystack) ||
    /\bpart[- ]?time\b/.test(haystack) ||
    /\bstudiejob\b/.test(haystack)
  ) {
    return "Deltid";
  }
  return "Fuldtid";
}

export interface ParsedWorkplaceLocation {
  addressLine: string;
  postalCodeAndCity: string;
  streetAddress: string;
  hasDanishPostcode: boolean;
}

export function parseWorkplaceLocation(location: string): ParsedWorkplaceLocation {
  const trimmed = location.trim();
  if (!trimmed) {
    return {
      addressLine: "",
      postalCodeAndCity: "",
      streetAddress: "",
      hasDanishPostcode: false,
    };
  }

  const postcodeMatch = trimmed.match(/\b(\d{4})\s+([A-Za-zÆØÅæøå.\- ]+)/);
  if (postcodeMatch) {
    const postalCodeAndCity = `${postcodeMatch[1]} ${postcodeMatch[2].trim()}`;
    const streetAddress = trimmed
      .replace(postcodeMatch[0], "")
      .replace(/^[,\s·-]+|[,\s·-]+$/g, "")
      .trim();
    return {
      addressLine: streetAddress || postalCodeAndCity,
      postalCodeAndCity,
      streetAddress,
      hasDanishPostcode: true,
    };
  }

  const cityOnly = trimmed.split(/[·,]/)[0]?.trim() ?? trimmed;
  return {
    addressLine: cityOnly,
    postalCodeAndCity: cityOnly,
    streetAddress: "",
    hasDanishPostcode: false,
  };
}

function buildDescription(
  application: Application,
  portfolioUrl?: string
): string {
  const parts: string[] = [];
  const linkHost = application.link
    ? (() => {
        try {
          return new URL(application.link).hostname.replace(/^www\./, "");
        } catch {
          return "virksomhedens karriereside";
        }
      })()
    : "virksomhedens karriereside";

  parts.push(
    `Søgt via ${application.company}s ${linkHost} til stillingen ${application.jobTitle}${application.location ? `, ${application.location}` : ""}.`
  );

  const portfolio = portfolioUrl?.trim();
  if (portfolio) {
    parts.push(
      `Ansøgningen er sendt online med CV og portfolio: ${portfolio}.`
    );
  } else {
    parts.push("Ansøgningen er sendt online med CV.");
  }

  if (application.match.matchedKeywords.length > 0) {
    parts.push(
      `Stillingen matcher især på kompetencer som: ${application.match.matchedKeywords.slice(0, 6).join(", ")}.`
    );
  }

  return parts.join(" ");
}

function field(
  key: string,
  label: string,
  value: string,
  jobnetSection: (typeof JOBNET_SECTION_ORDER)[number],
  required: boolean,
  fieldType: JobnetFieldType = "text",
  options?: string[],
  hint?: string
): JobnetLogField {
  const trimmed = value.trim();
  return {
    key,
    label,
    value: trimmed,
    jobnetSection,
    required,
    missing: required && !trimmed,
    fieldType,
    options,
    hint,
  };
}

export function buildJobnetLogEntry(
  application: Application,
  options: BuildJobnetLogOptions = {}
): JobnetLogEntry {
  const rawText = application.job.rawText ?? "";
  const contact = extractJobContact(rawText, application.recruiterContact);
  const extractedAddress = extractWorkplaceAddress(rawText);
  const locationContext = [application.location, extractedAddress]
    .filter(Boolean)
    .join(" · ");
  const workplace = parseWorkplaceLocation(locationContext);
  const streetAddress =
    workplace.streetAddress ||
    (extractedAddress && !/\d{4}/.test(extractedAddress)
      ? extractedAddress
      : extractedAddress.replace(/\d{4}\s+[A-Za-zÆØÅæøå .-]+.*$/, "").trim());
  const deadlineIso =
    application.deadline?.trim() || extractJobDeadline(rawText);
  const appliedDate =
    formatJobnetDate(application.appliedDate) ||
    formatJobnetDate(new Date().toISOString());
  const progressStatus = mapApplicationStatusToJobnet(application.status);
  const workingHours = inferWorkingHours(
    application.jobTitle,
    application.location,
    rawText
  );
  const hasJobLink = Boolean(application.link?.trim());
  const foundVia =
    options.foundVia ?? inferJobnetFoundVia(rawText, hasJobLink);
  const applyMethod = options.applyMethod ?? inferJobnetApplyMethod(rawText);
  const description = buildDescription(application, options.portfolioUrl);

  const cvFileName = application.cvVersion?.endsWith(".pdf")
    ? application.cvVersion
    : application.cvVersion
      ? `${application.cvVersion}.pdf`
      : "";

  const fields: JobnetLogField[] = [
    field(
      "jobTitle",
      "Stilling eller arbejdsområde",
      application.jobTitle,
      "Om jobbet",
      true
    ),
    field(
      "deadline",
      "Ansøgningsfrist",
      formatJobnetDate(deadlineIso),
      "Om jobbet",
      false
    ),
    field(
      "workingHours",
      "Arbejdstid",
      workingHours,
      "Om jobbet",
      true,
      "radio",
      ["Fuldtid", "Deltid"]
    ),
    field(
      "company",
      "Virksomhedens navn",
      application.company,
      "Om arbejdspladsen",
      true
    ),
    field(
      "address",
      "Adresse",
      streetAddress || workplace.addressLine,
      "Om arbejdspladsen",
      false,
      "text",
      undefined,
      streetAddress || workplace.streetAddress
        ? undefined
        : "Gade/adresse hvis du kender den — ellers lad stå tom"
    ),
    field("country", "Land", "Danmark", "Om arbejdspladsen", true),
    field(
      "postalCodeAndCity",
      "Postnummer og by",
      workplace.hasDanishPostcode ? workplace.postalCodeAndCity : "",
      "Om arbejdspladsen",
      true,
      "text",
      undefined,
      workplace.hasDanishPostcode
        ? undefined
        : `Søg efter by på Jobnet — vi har kun: "${workplace.postalCodeAndCity}"`
    ),
    field(
      "contactName",
      "Navn på kontaktperson",
      contact.contactName,
      "Kontakt og link",
      false
    ),
    field(
      "contactPhone",
      "Telefonnummer",
      contact.contactPhone,
      "Kontakt og link",
      false
    ),
    field(
      "contactEmail",
      "E-mail",
      contact.contactEmail,
      "Kontakt og link",
      false
    ),
    field(
      "jobLink",
      "Link til jobannonce",
      application.link ?? "",
      "Kontakt og link",
      false
    ),
    field(
      "transportNote",
      "Afstand og transport",
      "Beregnes automatisk efter du gemmer jobloggen på Jobnet.",
      "Kontakt og link",
      false,
      "info"
    ),
    field(
      "progressStatus",
      "Hvor langt er du med at søge dette job?",
      progressStatus,
      "Om din jobsøgning",
      true,
      "radio",
      ["Ikke søgt", "Søgt", "Samtale"]
    ),
    field(
      "appliedDate",
      "Hvilken dato har du søgt jobbet?",
      progressStatus === "Søgt" || progressStatus === "Samtale" ? appliedDate : "",
      "Om din jobsøgning",
      progressStatus === "Søgt" || progressStatus === "Samtale"
    ),
    field(
      "foundVia",
      "Hvordan fandt du jobbet?",
      foundVia,
      "Om din jobsøgning",
      true,
      "radio",
      ["Opslået stilling", "Uopfordret", "Gennem Netværk"]
    ),
    field(
      "applyMethod",
      "Hvordan søger du jobbet?",
      applyMethod,
      "Om din jobsøgning",
      true,
      "radio",
      ["Digitalt", "Personligt", "Telefonisk"]
    ),
    field(
      "notes",
      "Skriv evt. noter om jobbet",
      description,
      "Noter",
      false,
      "text",
      undefined,
      "Max 2000 tegn på Jobnet"
    ),
    field(
      "uploadApplication",
      "Upload jobansøgning",
      application.coverLetterOutputPath
        ? "Upload din cover letter PDF fra Job Agent"
        : "Upload hvis du har en ansøgning-PDF",
      "Upload på Jobnet",
      false,
      "upload"
    ),
    field(
      "uploadCv",
      "Upload CV",
      cvFileName
        ? `Upload: ${cvFileName}`
        : "Upload dit eksporterede CV-PDF fra Job Agent",
      "Upload på Jobnet",
      false,
      "upload"
    ),
    field(
      "uploadJobAd",
      "Upload jobannonce",
      "Gem jobannoncen som PDF hvis du har den",
      "Upload på Jobnet",
      false,
      "upload"
    ),
  ];

  const missingRequired = fields
    .filter((item) => item.missing)
    .map((item) => item.label);

  return { fields, description, missingRequired };
}

export function groupJobnetFieldsBySection(
  fields: JobnetLogField[]
): Map<(typeof JOBNET_SECTION_ORDER)[number], JobnetLogField[]> {
  const groups = new Map<(typeof JOBNET_SECTION_ORDER)[number], JobnetLogField[]>();
  for (const section of JOBNET_SECTION_ORDER) {
    groups.set(section, []);
  }
  for (const item of fields) {
    groups.get(item.jobnetSection)?.push(item);
  }
  return groups;
}

export function buildJobnetLogClipboardText(entry: JobnetLogEntry): string {
  const grouped = groupJobnetFieldsBySection(entry.fields);
  const lines: string[] = [
    "Jobnet joblog — kopiér til jobnet.dk",
    "Jobsøgning → Joblog → + Opret joblog",
    "",
  ];

  for (const section of JOBNET_SECTION_ORDER) {
    const items = grouped.get(section)?.filter((f) => f.fieldType !== "upload") ?? [];
    if (items.length === 0) continue;
    lines.push(`## ${section}`);
    for (const item of items) {
      if (item.fieldType === "info") {
        lines.push(`${item.label}: ${item.value}`);
        continue;
      }
      lines.push(`${item.label}: ${item.value || "—"}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}
