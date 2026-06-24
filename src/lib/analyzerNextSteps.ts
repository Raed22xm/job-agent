export interface AnalyzerNextStep {
  title: string;
  description: string;
}

export function buildAnalyzerNextSteps(
  score: number,
  missingKeywords: string[] = []
): AnalyzerNextStep[] {
  const normalizedMissing = missingKeywords.filter(Boolean);

  if (score >= 80) {
    return [
      {
        title: "Strong fit",
        description:
          "This looks like a strong match. Focus on tailoring your CV and cover letter to the role instead of rewriting your profile.",
      },
      {
        title: "Prioritize evidence",
        description:
          normalizedMissing.length > 0
            ? `Highlight the most relevant evidence for ${normalizedMissing.slice(0, 2).join(" and ")}.`
            : "Highlight your strongest relevant examples with concise, verified proof.",
      },
    ];
  }

  if (score >= 40) {
    return [
      {
        title: "Partial fit",
        description:
          "You have a credible overlap. Emphasize transferable experience and frame your fit clearly in the cover letter.",
      },
      {
        title: "Close the gap",
        description:
          normalizedMissing.length > 0
            ? `Review the missing terms and decide which ones are truly necessary versus transferable alternatives.`
            : "Choose 2-3 focus areas to strengthen before applying.",
      },
    ];
  }

  return [
    {
      title: "Low fit",
      description:
        "This role may need a more targeted application. Use the missing keywords to decide whether it is a stretch role or a strong development opportunity.",
    },
    {
      title: "Be honest",
      description:
        "Avoid overclaiming. If the gap is real, present your transferable skills and keep the tone grounded.",
    },
  ];
}
