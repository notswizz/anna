import type { FoodEntry, Goals, Profile } from "@/lib/types";
import { JsonFileStore } from "./json-store";

/**
 * Storage contract for Anna. The rest of the app only talks to this
 * interface, so the JSON file backend can be swapped for Firestore,
 * SQLite, etc. without touching routes or UI.
 */
export interface AnnaStore {
  listEntries(date?: string): Promise<FoodEntry[]>;
  /** Distinct dates that have entries, newest first */
  listDates(): Promise<string[]>;
  addEntry(entry: FoodEntry): Promise<FoodEntry>;
  deleteEntry(id: string): Promise<boolean>;
  getGoals(): Promise<Goals>;
  setGoals(goals: Goals): Promise<Goals>;
  getProfile(): Promise<Profile | null>;
  setProfile(profile: Profile): Promise<Profile>;
}

let store: AnnaStore | null = null;

export function getStore(): AnnaStore {
  if (!store) {
    store = new JsonFileStore();
  }
  return store;
}
