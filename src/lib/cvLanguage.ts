export type CvLanguage = "danish" | "english";

export const CV_LANGUAGE_OPTIONS: {
  id: CvLanguage;
  personaId: string;
  label: string;
  flag: string;
}[] = [
  { id: "danish", personaId: "danish", label: "Dansk", flag: "🇩🇰" },
  { id: "english", personaId: "english", label: "English", flag: "🇬🇧" },
];

export const CV_SECTION_LABELS: Record<
  CvLanguage,
  {
    summary: string;
    skills: string;
    experience: string;
    projects: string;
    education: string;
    certifications: string;
    languages: string;
  }
> = {
  danish: {
    summary: "Profil",
    skills: "Kompetencer",
    experience: "Erfaring",
    projects: "Projekter",
    education: "Uddannelse",
    certifications: "Certificeringer",
    languages: "Sprog",
  },
  english: {
    summary: "Professional Summary",
    skills: "Skills",
    experience: "Experience",
    projects: "Projects",
    education: "Education",
    certifications: "Certifications",
    languages: "Languages",
  },
};

export const COVER_LETTER_LABELS: Record<
  CvLanguage,
  {
    motivation: string;
    valueOne: string;
    valueTwo: string;
    colleague: string;
    closing: string;
  }
> = {
  danish: {
    motivation: "Motivation",
    valueOne: "Mit bidrag",
    valueTwo: "Yderligere værdi",
    colleague: "Mit bidrag som kollega",
    closing: "Lad os tale om stillingen",
  },
  english: {
    motivation: "Motivation",
    valueOne: "Value I bring",
    valueTwo: "Further contribution",
    colleague: "Contribution as a colleague",
    closing: "Let’s discuss the role",
  },
};

export function coverLetterHeadline(
  company: string,
  title: string,
  language: CvLanguage
): string {
  return language === "danish"
    ? `Ansøgning — ${title} hos ${company}`
    : `Application — ${title} at ${company}`;
}

export function coverLetterSectionLabels(language: CvLanguage): string[] {
  const labels = COVER_LETTER_LABELS[language];
  return [
    labels.motivation,
    labels.valueOne,
    labels.valueTwo,
    labels.colleague,
    labels.closing,
  ];
}

export function personaIdToLanguage(personaId?: string): CvLanguage {
  if (personaId === "english") return "english";
  return "danish";
}

export function languageToPersonaId(language: CvLanguage): string {
  return language === "english" ? "english" : "danish";
}

export function resolvePersonaId(personaId?: string): string {
  if (personaId === "english" || personaId === "danish") return personaId;
  return "danish";
}

/** Guess CV language from job posting text (Danish ads → Danish CV). */
export function detectCvLanguageFromJob(rawText: string): CvLanguage {
  const sample = rawText.slice(0, 4000).toLowerCase();
  const danishSignals =
    /\b(ansøg|ansøgning|stilling|erfaring|uddannelse|dansk|jobbet|virksomhed|løn|arbejdssted|praktik|studiejob|deltid|fuldtid)\b/i;
  const englishSignals =
    /\b(apply|application|position|experience|education|english|responsibilities|requirements|full[- ]time|part[- ]time)\b/i;

  const danishHits = (sample.match(danishSignals) ?? []).length;
  const englishHits = (sample.match(englishSignals) ?? []).length;

  if (danishHits > englishHits) return "danish";
  if (englishHits > danishHits) return "english";
  return "danish";
}
