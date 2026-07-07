import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import type { Goals } from "@/lib/types";

export async function GET() {
  const goals = await getStore().getGoals();
  return NextResponse.json(goals);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as Partial<Goals>;
  const fields: Array<keyof Goals> = ["calories", "protein_g", "carbs_g", "fat_g"];
  const current = await getStore().getGoals();
  const next: Goals = { ...current };

  for (const field of fields) {
    const value = body[field];
    if (value !== undefined) {
      if (typeof value !== "number" || !isFinite(value) || value <= 0) {
        return NextResponse.json(
          { error: `${field} must be a positive number` },
          { status: 400 }
        );
      }
      next[field] = Math.round(value);
    }
  }

  const saved = await getStore().setGoals(next);
  return NextResponse.json(saved);
}
