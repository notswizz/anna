import OpenAI from "openai";
import type { AnalysisResult, FoodItem } from "@/lib/types";

const MODEL = process.env.ANNA_MODEL || "gpt-5.1";

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) {
    // ANNA_OPENAI_API_KEY first: a machine-wide OPENAI_API_KEY export would
    // otherwise shadow the key in .env.local (Next.js never overrides real env vars).
    const apiKey =
      process.env.ANNA_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("ANNA_OPENAI_API_KEY is not set. Add it to .env.local");
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

const SYSTEM_PROMPT = `You are the nutrition engine for Anna, a personal food tracker.
The user describes what they ate (text) or sends a photo of it. Break the meal into
individual food items and return nutrition facts for each, at the portion actually eaten.

Rules:
- If an item is from a restaurant/chain (e.g. Chipotle, Chick-fil-A) or is a branded
  packaged product, SEARCH THE WEB for the officially published nutrition facts and use
  those exact numbers. Put the source in "source" (e.g. "Chipotle published nutrition")
  and set confidence to "high".
- For generic/home-cooked food, estimate from standard nutrition data (USDA-style).
  Set source to "estimate" and confidence to "medium" (or "low" if the portion is a guess).
- For photos: identify every food visible, estimate portion sizes from visual cues
  (plate size, packaging, utensils). State your portion assumptions in "quantity".
- Quantities are human-readable ("1 bowl", "2 slices", "16 oz").
- "brandDomain" is the brand's/restaurant's primary web domain, lowercase, no protocol
  (e.g. "mcdonalds.com", "chipotle.com", "chobani.com"). null for generic foods.
- "summary" is a short title for the meal, max 8 words, no trailing period.
- "emoji" is the single emoji that best represents the whole meal (e.g. "🌯", "🍔", "🥗").
- Use "notes" only for caveats worth telling the user (ambiguous portion, guessed brand).
- Numbers are for the stated portion, not per-100g. Round calories to whole numbers,
  macros to one decimal.
- If the input contains no food at all, return an empty items array and explain in notes.`;

const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          brand: { type: ["string", "null"] },
          brandDomain: { type: ["string", "null"] },
          quantity: { type: "string" },
          calories: { type: "number" },
          protein_g: { type: "number" },
          carbs_g: { type: "number" },
          fat_g: { type: "number" },
          fiber_g: { type: ["number", "null"] },
          sugar_g: { type: ["number", "null"] },
          sodium_mg: { type: ["number", "null"] },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          source: { type: ["string", "null"] },
        },
        required: [
          "name",
          "brand",
          "brandDomain",
          "quantity",
          "calories",
          "protein_g",
          "carbs_g",
          "fat_g",
          "fiber_g",
          "sugar_g",
          "sodium_mg",
          "confidence",
          "source",
        ],
      },
    },
    summary: { type: "string" },
    emoji: { type: "string" },
    notes: { type: ["string", "null"] },
  },
  required: ["items", "summary", "emoji", "notes"],
} as const;

export interface AnalyzeInput {
  text?: string;
  /** data URL (data:image/jpeg;base64,...) */
  image?: string;
}

export async function analyzeFood(input: AnalyzeInput): Promise<AnalysisResult> {
  const content: Array<
    | { type: "input_text"; text: string }
    | { type: "input_image"; image_url: string; detail: "auto" }
  > = [];

  if (input.text?.trim()) {
    content.push({ type: "input_text", text: input.text.trim() });
  }
  if (input.image) {
    content.push({ type: "input_image", image_url: input.image, detail: "auto" });
    if (!input.text?.trim()) {
      content.push({
        type: "input_text",
        text: "Analyze the food in this photo.",
      });
    }
  }
  if (content.length === 0) {
    throw new Error("Nothing to analyze — provide text or a photo.");
  }

  const response = await getClient().responses.create({
    model: MODEL,
    instructions: SYSTEM_PROMPT,
    input: [{ role: "user", content }],
    tools: [{ type: "web_search" }],
    text: {
      format: {
        type: "json_schema",
        name: "nutrition_analysis",
        strict: true,
        schema: ANALYSIS_SCHEMA as unknown as Record<string, unknown>,
      },
    },
  });

  const parsed = JSON.parse(response.output_text) as AnalysisResult;
  parsed.items = parsed.items.map(normalizeItem);
  return parsed;
}

function normalizeItem(item: FoodItem): FoodItem {
  return {
    ...item,
    source: cleanSource(item.source),
    brandDomain: cleanDomain(item.brandDomain),
    calories: Math.max(0, Math.round(item.calories)),
    protein_g: round1(item.protein_g),
    carbs_g: round1(item.carbs_g),
    fat_g: round1(item.fat_g),
  };
}

/** Normalize "https://www.mcdonalds.com/us" → "mcdonalds.com" */
function cleanDomain(domain: string | null): string | null {
  if (!domain) return null;
  const cleaned = domain
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .trim();
  return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(cleaned) ? cleaned : null;
}

/** Strip inline citation markup like "([site.com](https://…))" that web search leaves in prose. */
function cleanSource(source: string | null): string | null {
  if (!source) return null;
  const cleaned = source
    .replace(/\(\[[^\]]*\]\([^)]*\)\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleaned || null;
}

function round1(n: number): number {
  return Math.round(Math.max(0, n) * 10) / 10;
}
