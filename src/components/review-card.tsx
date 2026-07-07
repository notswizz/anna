"use client";

import type { AnalysisResult } from "@/lib/types";
import { sumMacros } from "@/lib/types";
import { NutrientBadges } from "./nutrient-badges";

interface ReviewCardProps {
  result: AnalysisResult;
  saving: boolean;
  onRemoveItem: (index: number) => void;
  onLog: () => void;
  onDiscard: () => void;
}

export function ReviewCard({
  result,
  saving,
  onRemoveItem,
  onLog,
  onDiscard,
}: ReviewCardProps) {
  const totals = sumMacros(result.items);
  const empty = result.items.length === 0;

  return (
    <div className="animate-rise rounded-3xl border border-leaf/25 bg-leaf-soft/40 p-4 shadow-soft sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg font-medium">
          {result.emoji && <span className="mr-1.5">{result.emoji}</span>}
          {result.summary}
        </h3>
        {!empty && (
          <span className="shrink-0 text-sm font-semibold tabular-nums text-leaf">
            {totals.calories.toLocaleString()} cal
          </span>
        )}
      </div>

      {empty ? (
        <p className="mt-3 text-sm text-muted">
          Anna couldn&apos;t find any food in that. Try again with more detail.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {result.items.map((item, i) => (
            <li
              key={`${item.name}-${i}`}
              className="flex items-center gap-3 rounded-2xl border border-line/70 bg-surface px-3.5 py-3 shadow-soft"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-sm font-medium">
                    {item.name}
                  </span>
                  <span className="shrink-0 font-display text-base font-medium tabular-nums">
                    {item.calories}
                    <span className="ml-0.5 font-sans text-[11px] font-normal text-muted">
                      cal
                    </span>
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-muted">
                  {item.quantity}
                  {item.brand && <span> · {item.brand}</span>}
                </div>
                <div className="mt-2">
                  <NutrientBadges item={item} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemoveItem(i)}
                disabled={saving}
                className="shrink-0 rounded-full p-1 text-muted transition-colors hover:bg-cream hover:text-clay"
                aria-label={`Remove ${item.name}`}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onDiscard}
          disabled={saving}
          className="rounded-full px-4 py-2.5 text-sm font-medium text-ink-soft transition-all hover:bg-surface active:scale-95"
        >
          Discard
        </button>
        {!empty && (
          <button
            type="button"
            onClick={onLog}
            disabled={saving}
            className="rounded-full bg-gradient-to-b from-leaf to-leaf-deep px-6 py-2.5 text-sm font-semibold text-white shadow-pop transition-all hover:brightness-105 active:scale-95 disabled:opacity-50"
          >
            {saving ? "Logging…" : "Log it"}
          </button>
        )}
      </div>
    </div>
  );
}
