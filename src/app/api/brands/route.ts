import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export interface BrandSuggestion {
  name: string;
  domain: string | null;
  count: number;
  lastUsed: string;
}

/** Distinct brands/restaurants from the whole log, most-used first. */
export async function GET() {
  const entries = await getStore().listEntries();
  const brands = new Map<string, BrandSuggestion>();

  for (const entry of entries) {
    for (const item of entry.items) {
      if (!item.brand) continue;
      const key = item.brand.toLowerCase();
      const existing = brands.get(key);
      if (existing) {
        existing.count++;
        existing.domain ??= item.brandDomain;
        if (entry.loggedAt > existing.lastUsed) existing.lastUsed = entry.loggedAt;
      } else {
        brands.set(key, {
          name: item.brand,
          domain: item.brandDomain,
          count: 1,
          lastUsed: entry.loggedAt,
        });
      }
    }
  }

  const sorted = [...brands.values()].sort(
    (a, b) => b.count - a.count || b.lastUsed.localeCompare(a.lastUsed)
  );
  return NextResponse.json({ brands: sorted });
}
