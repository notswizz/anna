import type { FoodEntry, Goals, Profile } from "@/lib/types";
import { FirestoreStore } from "./firestore-store";
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
    // Firestore when credentials are configured (Vercel or local service
    // account); JSON file fallback keeps zero-config local dev working.
    const hasFirebase =
      !!process.env.FIREBASE_PRIVATE_KEY ||
      !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
    store = hasFirebase ? new FirestoreStore() : new JsonFileStore();
  }
  return store;
}
