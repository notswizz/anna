import type { FoodEntry, Goals, Profile } from "@/lib/types";
import { FirestoreStore } from "./firestore-store";
import { JsonFileStore } from "./json-store";

/**
 * Storage contract for Anna. The rest of the app only talks to this
 * interface, so the backend (Firestore, JSON file, …) can be swapped
 * without touching routes or UI. Every store instance is scoped to one
 * device's data — see src/lib/device.ts for the no-auth device identity.
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

const stores = new Map<string, AnnaStore>();

export function getStore(deviceId: string): AnnaStore {
  let store = stores.get(deviceId);
  if (!store) {
    // Firestore when credentials are configured (Vercel or local service
    // account); JSON file fallback keeps zero-config local dev working.
    const hasFirebase =
      !!process.env.FIREBASE_PRIVATE_KEY ||
      !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
    store = hasFirebase
      ? new FirestoreStore(deviceId)
      : new JsonFileStore(deviceId);
    stores.set(deviceId, store);
  }
  return store;
}
