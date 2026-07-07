export interface Macros {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface FoodItem extends Macros {
  name: string;
  /** Brand or restaurant name when the item is a branded/menu food, else null */
  brand: string | null;
  /** Primary web domain of the brand/restaurant (e.g. "mcdonalds.com"), else null */
  brandDomain: string | null;
  /** Human-readable quantity, e.g. "1 cup", "2 slices", "large" */
  quantity: string;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  confidence: "high" | "medium" | "low";
  /** Where the numbers came from, e.g. "Chipotle published nutrition" or "estimate" */
  source: string | null;
}

export interface AnalysisResult {
  items: FoodItem[];
  /** Short one-line summary of the meal, e.g. "Chicken burrito bowl with guac" */
  summary: string;
  /** Single emoji that best represents the meal, e.g. "🌯" */
  emoji: string;
  notes: string | null;
}

export interface FoodEntry {
  id: string;
  /** Local calendar day the entry belongs to, YYYY-MM-DD */
  date: string;
  /** ISO timestamp of when it was logged */
  loggedAt: string;
  /** What the user typed, or the AI summary for photo entries */
  description: string;
  input: "text" | "photo";
  items: FoodItem[];
  totals: Macros;
  /** Thumbnail data URL of the user's photo (photo entries only) */
  image?: string | null;
  /** Emoji representing the meal, used when there's no photo or logo */
  emoji?: string | null;
}

export interface Goals extends Macros {}

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type GoalType = "lose" | "maintain" | "gain";

export interface Profile {
  heightIn: number;
  weightLb: number;
  age: number;
  sex: "male" | "female";
  activity: ActivityLevel;
  goal: GoalType;
}

export const DEFAULT_GOALS: Goals = {
  calories: 2200,
  protein_g: 150,
  carbs_g: 220,
  fat_g: 75,
};

export function sumMacros(items: Macros[]): Macros {
  return items.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein_g: acc.protein_g + (m.protein_g || 0),
      carbs_g: acc.carbs_g + (m.carbs_g || 0),
      fat_g: acc.fat_g + (m.fat_g || 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );
}
