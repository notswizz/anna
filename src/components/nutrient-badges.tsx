"use client";

import type { FoodItem } from "@/lib/types";

const BADGE =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums";

export function NutrientBadges({ item }: { item: FoodItem }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className={`${BADGE} bg-leaf-soft text-leaf-deep`} title="Protein">
        <span className="opacity-60">P</span> {item.protein_g}g
      </span>
      <span className={`${BADGE} bg-amber-soft text-[#8a5f1d]`} title="Carbs">
        <span className="opacity-60">C</span> {item.carbs_g}g
      </span>
      <span className={`${BADGE} bg-clay-soft text-clay`} title="Fat">
        <span className="opacity-60">F</span> {item.fat_g}g
      </span>
      {typeof item.fiber_g === "number" && item.fiber_g > 0 && (
        <span className={`${BADGE} border border-line/80 bg-cream/70 text-ink-soft`}>
          Fiber {item.fiber_g}g
        </span>
      )}
      {typeof item.sugar_g === "number" && item.sugar_g > 0 && (
        <span className={`${BADGE} border border-line/80 bg-cream/70 text-ink-soft`}>
          Sugar {item.sugar_g}g
        </span>
      )}
      {typeof item.sodium_mg === "number" && item.sodium_mg > 0 && (
        <span className={`${BADGE} border border-line/80 bg-cream/70 text-ink-soft`}>
          Sodium {Math.round(item.sodium_mg).toLocaleString()}mg
        </span>
      )}
    </div>
  );
}
