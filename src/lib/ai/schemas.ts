import { z } from "zod";

export const PersonalInfoSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  location: z.string().min(1),
  linkedin: z.string().url().optional(),
  portfolio: z.string().url().optional(),
  summary: z.string().min(1),
});

export const ExperienceSchema = z.object({
  id: z.string().min(1),
  company: z.string().min(1),
  title: z.string().min(1),
  location: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  bullets: z.array(z.string()),
});

export const EducationSchema = z.object({
  id: z.string().min(1),
  institution: z.string().min(1),
  degree: z.string().min(1),
  field: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  details: z.array(z.string()).optional(),
});

export const ProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
});

export const LanguageSchema = z.object({
  language: z.string().min(1),
  level: z.string().min(1),
});

export const MasterCVSchema = z.object({
  personalInfo: PersonalInfoSchema,
  skills: z.array(z.string()).min(1),
  tools: z.array(z.string()),
  experience: z.array(ExperienceSchema),
  education: z.array(EducationSchema),
  certifications: z.array(z.string()).optional(),
  projects: z.array(ProjectSchema).optional(),
  languages: z.array(LanguageSchema).optional(),
});

export const ParsedJobSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string(),
  responsibilities: z.array(z.string()),
  requirements: z.array(z.string()),
  tools: z.array(z.string()),
  skills: z.array(z.string()),
  atsKeywords: z.array(z.string()),
  rawText: z.string().min(40),
  sourceUrl: z.string().url().optional(),
});

export const CategoryScoreSchema = z.object({
  matched: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  weight: z.number().positive(),
  score: z.number().min(0).max(100),
});

export const ScoreBreakdownSchema = z.object({
  skillsMatch: CategoryScoreSchema,
  experienceMatch: CategoryScoreSchema,
  location: CategoryScoreSchema,
  language: CategoryScoreSchema,
  juniorFriendliness: CategoryScoreSchema,
  portfolioRelevance: CategoryScoreSchema,
  overall: z.number().min(0).max(100),
});

export const MatchResultSchema = z.object({
  score: z.number().min(0).max(100),
  matchedKeywords: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  recommendedFocusAreas: z.array(z.string()),
  summary: z.string(),
  scoreBreakdown: ScoreBreakdownSchema.optional(),
});

export const GeneratedCVSchema = z.object({
  sections: z.object({
    header: PersonalInfoSchema,
    summary: z.string(),
    skills: z.array(z.string()),
    experience: z.array(ExperienceSchema),
    education: z.array(EducationSchema),
  }),
  atsNotes: z.array(z.string()),
});

export const GeneratedCoverLetterSchema = z.object({
  greeting: z.string(),
  paragraphs: z.array(z.string()),
  closing: z.string(),
  signature: z.string(),
});

export const CVValidationIssueSchema = z.object({
  field: z.string(),
  message: z.string(),
  severity: z.enum(["error", "warning"]),
});

export const CVValidationResultSchema = z.object({
  valid: z.boolean(),
  issues: z.array(CVValidationIssueSchema),
});

export type MasterCVInput = z.infer<typeof MasterCVSchema>;
export type ParsedJobInput = z.infer<typeof ParsedJobSchema>;
export type MatchResultOutput = z.infer<typeof MatchResultSchema>;
export type GeneratedCVOutput = z.infer<typeof GeneratedCVSchema>;
export type GeneratedCoverLetterOutput = z.infer<typeof GeneratedCoverLetterSchema>;
export type CVValidationResultOutput = z.infer<typeof CVValidationResultSchema>;

export function parseMasterCV(data: unknown) {
  return MasterCVSchema.safeParse(data);
}

export function parseParsedJob(data: unknown) {
  return ParsedJobSchema.safeParse(data);
}
