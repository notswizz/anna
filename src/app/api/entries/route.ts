import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getStore } from "@/lib/store";
import { sumMacros, type FoodEntry, type FoodItem } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? undefined;
  const store = getStore();
  const [entries, dates] = await Promise.all([
    store.listEntries(date),
    store.listDates(),
  ]);
  return NextResponse.json({ entries, dates });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      date?: string;
      description?: string;
      input?: "text" | "photo";
      items?: FoodItem[];
      image?: string | null;
      emoji?: string | null;
    };

    if (!body.items?.length) {
      return NextResponse.json(
        { error: "An entry needs at least one food item." },
        { status: 400 }
      );
    }
    if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return NextResponse.json(
        { error: "A date (YYYY-MM-DD) is required." },
        { status: 400 }
      );
    }

    const entry: FoodEntry = {
      id: randomUUID(),
      date: body.date,
      loggedAt: new Date().toISOString(),
      description: body.description?.trim() || body.items[0].name,
      input: body.input === "photo" ? "photo" : "text",
      items: body.items,
      totals: sumMacros(body.items),
      image:
        typeof body.image === "string" && body.image.startsWith("data:image/")
          ? body.image
          : null,
      emoji: typeof body.emoji === "string" ? body.emoji.slice(0, 8) : null,
    };

    await getStore().addEntry(entry);
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("add entry failed:", err);
    return NextResponse.json({ error: "Could not save entry" }, { status: 500 });
  }
}
