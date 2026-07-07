import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import {
  DEFAULT_GOALS,
  type FoodEntry,
  type Goals,
  type Profile,
} from "@/lib/types";
import type { AnnaStore } from "./index";

const ENTRIES = "anna_entries";
const SETTINGS = "anna_settings";
const SETTINGS_DOC = "config";

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

export class FirestoreStore implements AnnaStore {
  private db = getDb();

  async listEntries(date?: string): Promise<FoodEntry[]> {
    const col = this.db.collection(ENTRIES);
    const snap = date
      ? await col.where("date", "==", date).get()
      : await col.get();
    const entries = snap.docs.map((d) => d.data() as FoodEntry);
    return entries.sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  }

  async listDates(): Promise<string[]> {
    const snap = await this.db.collection(ENTRIES).select("date").get();
    const dates = new Set(snap.docs.map((d) => d.get("date") as string));
    return [...dates].sort().reverse();
  }

  async addEntry(entry: FoodEntry): Promise<FoodEntry> {
    await this.db.collection(ENTRIES).doc(entry.id).set(entry);
    return entry;
  }

  async deleteEntry(id: string): Promise<boolean> {
    const ref = this.db.collection(ENTRIES).doc(id);
    const doc = await ref.get();
    if (!doc.exists) return false;
    await ref.delete();
    return true;
  }

  async getGoals(): Promise<Goals> {
    const doc = await this.db.collection(SETTINGS).doc(SETTINGS_DOC).get();
    return (doc.get("goals") as Goals | undefined) ?? { ...DEFAULT_GOALS };
  }

  async setGoals(goals: Goals): Promise<Goals> {
    await this.db
      .collection(SETTINGS)
      .doc(SETTINGS_DOC)
      .set({ goals }, { merge: true });
    return goals;
  }

  async getProfile(): Promise<Profile | null> {
    const doc = await this.db.collection(SETTINGS).doc(SETTINGS_DOC).get();
    return (doc.get("profile") as Profile | undefined) ?? null;
  }

  async setProfile(profile: Profile): Promise<Profile> {
    await this.db
      .collection(SETTINGS)
      .doc(SETTINGS_DOC)
      .set({ profile }, { merge: true });
    return profile;
  }
}
