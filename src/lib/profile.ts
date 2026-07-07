import type { ActivityLevel, Goals, GoalType, Profile } from "./types";

export const ACTIVITY_LEVELS: Array<{
  value: ActivityLevel;
  label: string;
  hint: string;
  factor: number;
}> = [
  { value: "sedentary", label: "Sedentary", hint: "Desk job, little exercise", factor: 1.2 },
  { value: "light", label: "Lightly active", hint: "Exercise 1–3 days/week", factor: 1.375 },
  { value: "moderate", label: "Moderately active", hint: "Exercise 3–5 days/week", factor: 1.55 },
  { value: "active", label: "Very active", hint: "Hard exercise 6–7 days/week", factor: 1.725 },
  { value: "very_active", label: "Athlete", hint: "Twice daily / physical job", factor: 1.9 },
];

export const GOAL_TYPES: Array<{
  value: GoalType;
  label: string;
  hint: string;
  calorieDelta: number;
}> = [
  { value: "lose", label: "Lose weight", hint: "≈1 lb per week", calorieDelta: -500 },
  { value: "maintain", label: "Maintain", hint: "Stay where you are", calorieDelta: 0 },
  { value: "gain", label: "Gain muscle", hint: "Lean surplus", calorieDelta: 300 },
];

export interface ComputedTargets extends Goals {
  bmr: number;
  tdee: number;
}

/**
 * Mifflin–St Jeor BMR × activity factor, adjusted for the goal.
 * Protein: 0.9 g per lb bodyweight. Fat: 27% of calories. Carbs: the rest.
 */
export function computeTargets(profile: Profile): ComputedTargets {
  const kg = profile.weightLb * 0.453592;
  const cm = profile.heightIn * 2.54;
  const bmr =
    10 * kg + 6.25 * cm - 5 * profile.age + (profile.sex === "male" ? 5 : -161);

  const factor =
    ACTIVITY_LEVELS.find((a) => a.value === profile.activity)?.factor ?? 1.2;
  const tdee = bmr * factor;

  const delta =
    GOAL_TYPES.find((g) => g.value === profile.goal)?.calorieDelta ?? 0;
  const calories = Math.max(1200, Math.round((tdee + delta) / 10) * 10);

  const protein_g = Math.round(profile.weightLb * 0.9);
  const fat_g = Math.round((calories * 0.27) / 9);
  const carbs_g = Math.max(
    0,
    Math.round((calories - protein_g * 4 - fat_g * 9) / 4)
  );

  return {
    calories,
    protein_g,
    carbs_g,
    fat_g,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
  };
}

export function isValidProfile(p: Partial<Profile> | null | undefined): p is Profile {
  return (
    !!p &&
    typeof p.heightIn === "number" && p.heightIn >= 36 && p.heightIn <= 96 &&
    typeof p.weightLb === "number" && p.weightLb >= 60 && p.weightLb <= 700 &&
    typeof p.age === "number" && p.age >= 13 && p.age <= 100 &&
    (p.sex === "male" || p.sex === "female") &&
    ACTIVITY_LEVELS.some((a) => a.value === p.activity) &&
    GOAL_TYPES.some((g) => g.value === p.goal)
  );
}
