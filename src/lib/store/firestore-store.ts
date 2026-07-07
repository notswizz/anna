import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import {
  getFirestore,
  type CollectionReference,
  type DocumentReference,
  type Firestore,
} from "firebase-admin/firestore";
import {
  DEFAULT_GOALS,
  type FoodEntry,
  type Goals,
  type Profile,
} from "@/lib/types";
import type { AnnaStore } from "./index";

const USERS = "anna_users";

function getDb(): Firestore {
  if (!getApps().length) {
    // Vercel: FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY.
    // Local: GOOGLE_APPLICATION_CREDENTIALS pointing at a service-account JSON.
    if (process.env.FIREBASE_PRIVATE_KEY) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
    } else {
      initializeApp({ credential: applicationDefault() });
    }
  }
  const db = getFirestore();
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // settings() throws if called twice — fine after hot reload
  }
  return db;
}

/**
 * Per-device layout: anna_users/{deviceId} holds goals + profile fields,
 * with the food log in its `entries` subcollection.
 */
export class FirestoreStore implements AnnaStore {
  private user: DocumentReference;
  private entries: CollectionReference;

  constructor(deviceId: string) {
    const db = getDb();
    this.user = db.collection(USERS).doc(deviceId);
    this.entries = this.user.collection("entries");
  }

  async listEntries(date?: string): Promise<FoodEntry[]> {
    const snap = date
      ? await this.entries.where("date", "==", date).get()
      : await this.entries.get();
    const entries = snap.docs.map((d) => d.data() as FoodEntry);
    return entries.sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  }

  async listDates(): Promise<string[]> {
    const snap = await this.entries.select("date").get();
    const dates = new Set(snap.docs.map((d) => d.get("date") as string));
    return [...dates].sort().reverse();
  }

  async addEntry(entry: FoodEntry): Promise<FoodEntry> {
    await this.entries.doc(entry.id).set(entry);
    return entry;
  }

  async deleteEntry(id: string): Promise<boolean> {
    const ref = this.entries.doc(id);
    const doc = await ref.get();
    if (!doc.exists) return false;
    await ref.delete();
    return true;
  }

  async getGoals(): Promise<Goals> {
    const doc = await this.user.get();
    return (doc.get("goals") as Goals | undefined) ?? { ...DEFAULT_GOALS };
  }

  async setGoals(goals: Goals): Promise<Goals> {
    await this.user.set({ goals }, { merge: true });
    return goals;
  }

  async getProfile(): Promise<Profile | null> {
    const doc = await this.user.get();
    return (doc.get("profile") as Profile | undefined) ?? null;
  }

  async setProfile(profile: Profile): Promise<Profile> {
    await this.user.set({ profile }, { merge: true });
    return profile;
  }
}
