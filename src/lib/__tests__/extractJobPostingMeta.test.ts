import { describe, expect, it } from "vitest";
import {
  extractJobDeadline,
  extractWorkplaceAddress,
  inferJobnetApplyMethod,
  inferJobnetFoundVia,
} from "@/lib/jobnet/extractJobPostingMeta";

describe("extractJobPostingMeta", () => {
  it("extracts Danish application deadlines", () => {
    expect(
      extractJobDeadline("Ansøgningsfrist: 15.07.2026 — send ansøgning online.")
    ).toBe("2026-07-15");
  });

  it("extracts workplace address from Danish street patterns", () => {
    expect(
      extractWorkplaceAddress(
        "Vi har kontor på Holmens Kanal 7, 1060 København K."
      )
    ).toContain("Holmens Kanal");
  });

  it("extracts office location phrasing", () => {
    expect(
      extractWorkplaceAddress(
        "Office in central Copenhagen, just by Nørreport Station"
      )
    ).toContain("central Copenhagen");
  });

  it("infers found via and apply method from posting text", () => {
    expect(inferJobnetFoundVia("Uopfordret ansøgning sendt direkte.", false)).toBe(
      "Uopfordret"
    );
    expect(inferJobnetFoundVia("Posted role", true)).toBe("Opslået stilling");
    expect(inferJobnetApplyMethod("Ansøg telefonisk til HR.")).toBe("Telefonisk");
    expect(inferJobnetApplyMethod("Apply online via our portal.")).toBe("Digitalt");
  });
});
