import fs from "fs";
import path from "path";
import type { MasterCV } from "@/types";

/**
 * Returns all available personas.
 * If data/personas/ doesn't exist, it looks for data/master-cv.json as a fallback.
 */
export function getPersonas(): { id: string; cv: MasterCV }[] {
  const personasDir = path.join(process.cwd(), "data", "personas");
  const fallbackPath = path.join(process.cwd(), "data", "master-cv.json");

  const personas: { id: string; cv: MasterCV }[] = [];

  if (fs.existsSync(personasDir)) {
    const files = fs.readdirSync(personasDir);
    for (const file of files) {
      if (file.endsWith(".json")) {
        try {
          const content = fs.readFileSync(path.join(personasDir, file), "utf-8");
          const cv = JSON.parse(content) as MasterCV;
          personas.push({
            id: file.replace(".json", ""),
            cv,
          });
        } catch (error) {
          console.error(`Failed to parse persona ${file}:`, error);
        }
      }
    }
  }

  // Fallback if no personas found
  if (personas.length === 0 && fs.existsSync(fallbackPath)) {
    try {
      const content = fs.readFileSync(fallbackPath, "utf-8");
      personas.push({
        id: "default",
        cv: JSON.parse(content) as MasterCV,
      });
    } catch (error) {
      console.error(`Failed to parse fallback master-cv.json:`, error);
    }
  }

  return personas;
}

/**
 * Selects a persona. If personaId is not provided, defaults to "default" or the first available.
 */
export function getPersona(personaId?: string): MasterCV | null {
  const personas = getPersonas();
  if (personas.length === 0) return null;

  if (personaId) {
    const found = personas.find((p) => p.id === personaId);
    if (found) return found.cv;
  }

  const def = personas.find((p) => p.id === "default");
  if (def) return def.cv;

  return personas[0].cv;
}
