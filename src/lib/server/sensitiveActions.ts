import { z } from "zod";

const PRODUCTION_OPT_IN = "JOB_AGENT_ENABLE_SENSITIVE_ACTIONS";

export const SendEmailRequestSchema = z
  .object({
    to: z.email().max(254),
    subject: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .refine((value) => !/[\r\n]/.test(value), "Subject must be a single line"),
    text: z.string().trim().min(1).max(50_000),
  })
  .strict();

function isPrivateIpv4(hostname: string): boolean {
  const octets = hostname.split(".").map(Number);
  if (
    octets.length !== 4 ||
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  ) {
    return false;
  }

  const [first, second] = octets;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19))
  );
}

function isPrivateHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const isIpv6 = normalized.includes(":");
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized === "::" ||
    normalized === "::1" ||
    normalized === "0:0:0:0:0:0:0:1" ||
    normalized.startsWith("::ffff:") ||
    (isIpv6 &&
      (normalized.startsWith("fc") ||
        normalized.startsWith("fd") ||
        /^fe[89ab]/.test(normalized))) ||
    isPrivateIpv4(normalized)
  );
}

export const PublicHttpUrlSchema = z
  .url()
  .max(2_048)
  .superRefine((value, context) => {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      context.addIssue({
        code: "custom",
        message: "URL must use HTTP or HTTPS",
      });
    }
    if (url.username || url.password) {
      context.addIssue({
        code: "custom",
        message: "URL must not contain credentials",
      });
    }
    if (isPrivateHostname(url.hostname)) {
      context.addIssue({
        code: "custom",
        message: "URL must not target a local or private network",
      });
    }
  });

export const AutoApplyRequestSchema = z
  .object({
    applyUrl: PublicHttpUrlSchema,
    personaId: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .regex(/^[a-zA-Z0-9_-]+$/, "Invalid personaId")
      .default("default"),
  })
  .strict();

export const JobnetLogRequestSchema = z
  .object({
    jobTitle: z.string().trim().min(1).max(200),
    company: z.string().trim().min(1).max(200),
    url: PublicHttpUrlSchema.optional(),
    appliedDate: z.string().trim().max(64).optional(),
  })
  .strict();

export const LinkedInNetworkRequestSchema = z
  .object({
    company: z.string().trim().min(1).max(200).default("Google"),
  })
  .strict();

export const ScrapeRequestSchema = z
  .object({
    query: z.string().trim().min(1).max(200).default("frontend"),
    limit: z.number().int().min(1).max(50).default(10),
  })
  .strict();

export function isSensitiveActionEnabled(
  environment: NodeJS.ProcessEnv = process.env
): boolean {
  return (
    environment.NODE_ENV !== "production" ||
    environment[PRODUCTION_OPT_IN]?.toLowerCase() === "true"
  );
}

export function sensitiveActionDisabledMessage(): string {
  return `Sensitive agent actions are disabled in production. Set ${PRODUCTION_OPT_IN}=true to opt in.`;
}
