import type { ComputedTargets } from "@/lib/profile";
import type {
  AnalysisResult,
  FoodEntry,
  FoodItem,
  Goals,
  Profile,
} from "@/lib/types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (body as { error?: string } | null)?.error ?? `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body as T;
}

export function analyze(input: {
  text?: string;
  image?: string;
}): Promise<AnalysisResult> {
  return request("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function getEntries(
  date: string
): Promise<{ entries: FoodEntry[]; dates: string[] }> {
  return request(`/api/entries?date=${encodeURIComponent(date)}`);
}

/** Full history (newest first) — used for #past-log suggestions. */
export function getAllEntries(): Promise<{ entries: FoodEntry[]; dates: string[] }> {
  return request("/api/entries");
}

export function addEntry(entry: {
  date: string;
  description: string;
  input: "text" | "photo";
  items: FoodItem[];
  image?: string | null;
  emoji?: string | null;
}): Promise<FoodEntry> {
  return request("/api/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
}

export function deleteEntry(id: string): Promise<{ ok: boolean }> {
  return request(`/api/entries/${id}`, { method: "DELETE" });
}

export function getGoals(): Promise<Goals> {
  return request("/api/goals");
}

export function saveGoals(goals: Goals): Promise<Goals> {
  return request("/api/goals", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(goals),
  });
}

export interface BrandSuggestion {
  name: string;
  domain: string | null;
  count: number;
  lastUsed: string;
}

export function getBrands(): Promise<{ brands: BrandSuggestion[] }> {
  return request("/api/brands");
}

export function getProfile(): Promise<{
  profile: Profile | null;
  targets: ComputedTargets | null;
}> {
  return request("/api/profile");
}

export function saveProfile(profile: Profile): Promise<{
  profile: Profile;
  targets: ComputedTargets;
}> {
  return request("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
}
