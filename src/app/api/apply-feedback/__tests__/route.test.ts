import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MasterCV } from "@/types";

const state = vi.hoisted(() => ({ master: null as MasterCV | null }));

vi.mock("@/lib/personaManager", () => ({
  getPersona: () => state.master,
}));

import { POST } from "../route";

const MASTER: MasterCV = {
  personalInfo: { fullName: "Test User", email: "test@example.com", phone: "", location: "Copenhagen", summary: "Developer." },
  professionalSummary: {
    professionalBackground: "Verified background.",
    professionalMotivation: "I build useful software.",
    coreCompetencies: "Verified competencies.",
    personalStrengths: "Verified strengths.",
  },
  skills: ["Power BI"],
  tools: [],
  experience: [{
    id: "novo",
    company: "Novo Nordisk",
    title: "Student Assistant",
    location: "Denmark",
    startDate: "2023",
    endDate: "2024",
    bullets: [
      "Conducted user interviews with 25+ laboratory technicians.",
      "Built 5 Power BI dashboards, reducing reporting time by 30%.",
    ],
  }],
  education: [],
};

function requestFor(experience = MASTER.experience): Request {
  return new Request("http://localhost/api/apply-feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      personaId: "english",
      cv: { sections: { summary: "Old", experience } },
      job: { title: "Developer" },
      feedbackItem: {
        section: "summary",
        message: "Summary contains no quantifiable achievement.",
      },
    }),
  });
}

describe("POST /api/apply-feedback summary metrics", () => {
  beforeEach(() => { state.master = MASTER; });

  it("uses the strongest verified metric in the first tailored role", async () => {
    const response = await POST(requestFor());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summary).toContain(
      "For example, I built 5 Power BI dashboards, reducing reporting time by 30%."
    );
    expect(body.summary).not.toContain("I conducted user interviews with 25+");
  });

  it("returns a clear non-success response when no verified metric is available", async () => {
    state.master = {
      ...MASTER,
      experience: [{ ...MASTER.experience[0], bullets: ["Built Power BI dashboards."] }],
    };
    const response = await POST(requestFor(state.master.experience));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.autoFixable).toBe(false);
    expect(body.error).toMatch(/No verified quantified achievement/);
  });

  it("rejects a fabricated metric in the current generated experience", async () => {
    const fabricated = [{
      ...MASTER.experience[0],
      bullets: ["Increased revenue by 999%."]
    }];
    const response = await POST(requestFor(fabricated));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error).not.toContain("999%");
  });

  it("handles malformed generated experience without crashing", async () => {
    const response = await POST(requestFor([
      { id: "novo", bullets: "30%" } as never,
      null as never,
    ]));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.autoFixable).toBe(false);
    expect(body.error).toMatch(/No verified quantified achievement/);
  });

  it("does not offer a metric fix for incidental technology versions", async () => {
    state.master = {
      ...MASTER,
      experience: [{
        ...MASTER.experience[0],
        bullets: ["Used Python 3 and OAuth 2."],
      }],
    };
    const response = await POST(requestFor(state.master.experience));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.autoFixable).toBe(false);
    expect(body.error).toMatch(/No verified quantified achievement/);
  });
});
