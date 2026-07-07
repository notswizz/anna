import { promises as fs } from "fs";
import path from "path";
import {
  DEFAULT_GOALS,
  type FoodEntry,
  type Goals,
  type Profile,
} from "@/lib/types";
import type { AnnaStore } from "./index";

interface DbShape {
  entries: FoodEntry[];
  goals: Goals;
  profile?: Profile | null;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "anna.json");

export class JsonFileStore implements AnnaStore {
  private cache: DbShape | null = null;
  private writeQueue: Promise<void> = Promise.resolve();

  private async load(): Promise<DbShape> {
    if (this.cache) return this.cache;
    try {
      const raw = await fs.readFile(DB_PATH, "utf8");
      this.cache = JSON.parse(raw) as DbShape;
    } catch {
      this.cache = { entries: [], goals: { ...DEFAULT_GOALS } };
    }
    return this.cache;
  }

  private persist(db: DbShape): Promise<void> {
    // Serialize writes so concurrent requests can't interleave partial files.
    this.writeQueue = this.writeQueue.then(async () => {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const tmp = DB_PATH + ".tmp";
      await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
      await fs.rename(tmp, DB_PATH);
    });
    return this.writeQueue;
  }

  async listEntries(date?: string): Promise<FoodEntry[]> {
    const db = await this.load();
    const entries = date
      ? db.entries.filter((e) => e.date === date)
      : db.entries;
    return [...entries].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  }

  async listDates(): Promise<string[]> {
    const db = await this.load();
    return [...new Set(db.entries.map((e) => e.date))].sort().reverse();
  }

  async addEntry(entry: FoodEntry): Promise<FoodEntry> {
    const db = await this.load();
    db.entries.push(entry);
    await this.persist(db);
    return entry;
  }

  async deleteEntry(id: string): Promise<boolean> {
    const db = await this.load();
    const before = db.entries.length;
    db.entries = db.entries.filter((e) => e.id !== id);
    if (db.entries.length === before) return false;
    await this.persist(db);
    return true;
  }

  async getGoals(): Promise<Goals> {
    const db = await this.load();
    return db.goals;
  }

  async setGoals(goals: Goals): Promise<Goals> {
    const db = await this.load();
    db.goals = goals;
    await this.persist(db);
    return goals;
  }

  async getProfile(): Promise<Profile | null> {
    const db = await this.load();
    return db.profile ?? null;
  }

  async setProfile(profile: Profile): Promise<Profile> {
    const db = await this.load();
    db.profile = profile;
    await this.persist(db);
    return profile;
  }
}
