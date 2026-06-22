export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  portfolio?: string;
  summary: string;
}

export interface Experience {
  id: string;
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  details?: string[];
}

export interface MasterCV {
  personalInfo: PersonalInfo;
  skills: string[];
  tools: string[];
  experience: Experience[];
  education: Education[];
  certifications?: string[];
}

export interface ParsedJob {
  title: string;
  company: string;
  location: string;
  responsibilities: string[];
  requirements: string[];
  tools: string[];
  skills: string[];
  atsKeywords: string[];
  rawText: string;
  sourceUrl?: string;
}

export interface MatchResult {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  recommendedFocusAreas: string[];
  summary: string;
}

export interface GeneratedCV {
  sections: {
    header: PersonalInfo;
    summary: string;
    skills: string[];
    experience: Experience[];
    education: Education[];
  };
  atsNotes: string[];
}

export interface GeneratedCoverLetter {
  greeting: string;
  paragraphs: string[];
  closing: string;
  signature: string;
}

export type ApplicationStatus =
  | "draft"
  | "ready"
  | "applied"
  | "interview"
  | "rejected"
  | "offer";

export interface Application {
  id: string;
  createdAt: string;
  updatedAt: string;
  job: ParsedJob;
  match: MatchResult;
  status: ApplicationStatus;
  notes?: string;
}
