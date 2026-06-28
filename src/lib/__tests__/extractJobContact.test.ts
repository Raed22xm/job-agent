import { describe, expect, it } from "vitest";
import { extractJobContact } from "@/lib/jobnet/extractJobContact";

describe("extractJobContact", () => {
  it("extracts email and inferred name from posting text", () => {
    const result = extractJobContact(
      "Spørgsmål kan rettes til Morten Hansen, Morten@bodil.energy eller +45 33 12 45 67."
    );
    expect(result.contactEmail).toBe("morten@bodil.energy");
    expect(result.contactName).toBe("Morten Hansen");
    expect(result.contactPhone).toBe("+45 33 12 45 67");
  });

  it("parses manual recruiter contact with name and email", () => {
    const result = extractJobContact("", "Maria Jensen, maria.jensen@firma.dk");
    expect(result.contactName).toBe("Maria Jensen");
    expect(result.contactEmail).toBe("maria.jensen@firma.dk");
  });

  it("prefers manual tracker contact over posting text", () => {
    const result = extractJobContact(
      "Contact hr@company.com",
      "Peter Nielsen, peter@company.com"
    );
    expect(result.contactName).toBe("Peter Nielsen");
    expect(result.contactEmail).toBe("peter@company.com");
  });

  it("derives a name from personal email local part when no name is listed", () => {
    const result = extractJobContact("Apply via morten.hansen@bodil.energy");
    expect(result.contactEmail).toBe("morten.hansen@bodil.energy");
    expect(result.contactName).toBe("Morten Hansen");
  });

  it("ignores noreply addresses", () => {
    const result = extractJobContact(
      "Send to noreply@company.com or jobs@company.com"
    );
    expect(result.contactEmail).toBe("jobs@company.com");
  });
});
