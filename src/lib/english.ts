export type EnglishLevel = "A2" | "B1" | "B2";

export interface VocabularyItem {
  phrase: string;
  definition: string;
  example: string;
  cloze: string;
}

export interface WordResult {
  word: string;
  status: "correct" | "missing" | "extra";
}

export interface DictationResult {
  score: number;
  expected: WordResult[];
  extras: WordResult[];
}

export interface RoleplayTurn {
  reply: string;
  correction?: string;
  explanation?: string;
  suggestions: string[];
}

const OFFICE_PHRASES: Array<VocabularyItem & { keywords: string[] }> = [
  {
    phrase: "follow up",
    definition: "Contact someone again to continue a discussion or check progress.",
    example: "I will follow up with the supplier tomorrow.",
    cloze: "I will ___ with the supplier tomorrow.",
    keywords: ["email", "reply", "contact", "supplier", "client"],
  },
  {
    phrase: "meet a deadline",
    definition: "Finish a piece of work by the agreed time.",
    example: "We need to meet the deadline on Friday.",
    cloze: "We need to ___ on Friday.",
    keywords: ["deadline", "date", "finish", "deliver", "project"],
  },
  {
    phrase: "keep me posted",
    definition: "Continue giving me updates about a situation.",
    example: "Please keep me posted on the client decision.",
    cloze: "Please ___ on the client decision.",
    keywords: ["update", "status", "progress", "decision"],
  },
  {
    phrase: "on the same page",
    definition: "Share the same understanding or expectations.",
    example: "Let us confirm the scope so we are on the same page.",
    cloze: "Let us confirm the scope so we are ___.",
    keywords: ["agree", "understand", "scope", "team", "plan"],
  },
  {
    phrase: "take the lead",
    definition: "Accept responsibility for guiding a task or project.",
    example: "Maya will take the lead on the presentation.",
    cloze: "Maya will ___ on the presentation.",
    keywords: ["lead", "manage", "own", "responsible", "presentation"],
  },
  {
    phrase: "raise a concern",
    definition: "Mention a possible problem that needs attention.",
    example: "I would like to raise a concern about the timeline.",
    cloze: "I would like to ___ about the timeline.",
    keywords: ["concern", "risk", "problem", "issue", "timeline"],
  },
  {
    phrase: "action item",
    definition: "A specific task agreed during a meeting.",
    example: "My action item is to send the revised budget.",
    cloze: "My ___ is to send the revised budget.",
    keywords: ["meeting", "task", "notes", "responsibility", "agenda"],
  },
  {
    phrase: "circle back",
    definition: "Return to a topic or contact someone again later.",
    example: "Let us circle back after we review the figures.",
    cloze: "Let us ___ after we review the figures.",
    keywords: ["later", "review", "discuss", "return", "figures"],
  },
  {
    phrase: "clarify the requirements",
    definition: "Make the expected needs or rules easier to understand.",
    example: "Could you clarify the requirements before we start?",
    cloze: "Could you ___ before we start?",
    keywords: ["requirements", "explain", "details", "scope", "start"],
  },
  {
    phrase: "share an update",
    definition: "Give others the newest information about progress.",
    example: "I would like to share an update on the launch.",
    cloze: "I would like to ___ on the launch.",
    keywords: ["update", "progress", "launch", "status", "report"],
  },
];

export function normalizeWords(value: string): string[] {
  return value
    .toLocaleLowerCase("en")
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9'\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function scoreDictation(answer: string, sentence: string): DictationResult {
  const actual = normalizeWords(answer);
  const expectedWords = normalizeWords(sentence);
  const matrix = Array.from({ length: expectedWords.length + 1 }, () =>
    Array<number>(actual.length + 1).fill(0),
  );
  for (let expectedIndex = 1; expectedIndex <= expectedWords.length; expectedIndex += 1) {
    for (let actualIndex = 1; actualIndex <= actual.length; actualIndex += 1) {
      matrix[expectedIndex][actualIndex] = expectedWords[expectedIndex - 1] === actual[actualIndex - 1]
        ? matrix[expectedIndex - 1][actualIndex - 1] + 1
        : Math.max(matrix[expectedIndex - 1][actualIndex], matrix[expectedIndex][actualIndex - 1]);
    }
  }

  const matchedExpected = new Set<number>();
  const matchedActual = new Set<number>();
  let expectedIndex = expectedWords.length;
  let actualIndex = actual.length;
  while (expectedIndex > 0 && actualIndex > 0) {
    if (expectedWords[expectedIndex - 1] === actual[actualIndex - 1]) {
      matchedExpected.add(expectedIndex - 1);
      matchedActual.add(actualIndex - 1);
      expectedIndex -= 1;
      actualIndex -= 1;
    } else if (matrix[expectedIndex - 1][actualIndex] >= matrix[expectedIndex][actualIndex - 1]) {
      expectedIndex -= 1;
    } else {
      actualIndex -= 1;
    }
  }

  const expected = expectedWords.map((word, index) => ({
    word,
    status: matchedExpected.has(index) ? "correct" as const : "missing" as const,
  }));

  const extras = actual
    .filter((_, index) => !matchedActual.has(index))
    .map((word) => ({ word, status: "extra" as const }));

  return {
    score: expectedWords.length ? Math.round((matchedExpected.size / expectedWords.length) * 100) : 0,
    expected,
    extras,
  };
}

export function fallbackVocabulary(text: string, limit = 8): VocabularyItem[] {
  const words = new Set(normalizeWords(text));
  return OFFICE_PHRASES
    .map((item, index) => ({
      item,
      relevance: item.keywords.reduce((score, keyword) => score + Number(words.has(keyword)), 0),
      index,
    }))
    .sort((a, b) => b.relevance - a.relevance || a.index - b.index)
    .slice(0, limit)
    .map(({ item }) => ({
      phrase: item.phrase,
      definition: item.definition,
      example: item.example,
      cloze: item.cloze,
    }));
}

export function fallbackRoleplay(message: string, scenario: string): RoleplayTurn {
  const trimmed = message.trim();
  const correction = trimmed && !/[.!?]$/.test(trimmed)
    ? `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}.`
    : undefined;

  return {
    reply: `Thanks for the update. In this ${scenario.toLowerCase()} situation, what would you like the team to do next?`,
    correction,
    explanation: correction ? "Complete sentences sound clearer and more confident at work." : undefined,
    suggestions: ["The next step is…", "Could we agree on…?"],
  };
}
