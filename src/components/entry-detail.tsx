"use client";

import { useState } from "react";
import type { FoodEntry } from "@/lib/types";
import { accentGradient } from "@/lib/client/color";
import { formatDay, formatTime } from "@/lib/dates";
import { BrandLogo } from "./brand-logo";
import { NutrientBadges } from "./nutrient-badges";

interface EntryDetailProps {
  entry: FoodEntry;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function sumOptional(entry: FoodEntry, key: "fiber_g" | "sugar_g" | "sodium_mg") {
  let total = 0;
  let any = false;
  for (const item of entry.items) {
    const v = item[key];
    if (typeof v === "number") {
      total += v;
      any = true;
    }
  }
  return any ? Math.round(total * 10) / 10 : null;
}

export function EntryDetail({ entry, onDelete, onClose }: EntryDetailProps) {
  const [accent, setAccent] = useState<string | null>(null);
  const brandItem = entry.items.find((i) => i.brandDomain);
  const fiber = sumOptional(entry, "fiber_g");
  const sugar = sumOptional(entry, "sugar_g");
  const sodium = sumOptional(entry, "sodium_mg");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={entry.description}
        className="animate-sheet max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[1.75rem] bg-surface pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-lift sm:animate-rise sm:rounded-[1.75rem] sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero */}
        <div className="relative h-44 w-full overflow-hidden rounded-t-[1.75rem]">
          {entry.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.image}
              alt={entry.description}
              className="h-full w-full object-cover"
            />
          ) : brandItem?.brandDomain ? (
            <div
              className="flex h-full w-full flex-col items-center justify-center gap-2"
              style={{
                background: accent
                  ? accentGradient(accent)
                  : "linear-gradient(135deg, #f6efdf, #e2d2ae)",
              }}
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-[0_8px_22px_rgba(32,26,20,0.18)] ring-1 ring-black/5">
                <BrandLogo
                  domain={brandItem.brandDomain}
                  name={brandItem.brand ?? brandItem.brandDomain}
                  className="h-12 w-12 rounded-full object-contain text-2xl"
                  onAccent={setAccent}
                />
              </div>
              <span className="rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-ink-soft shadow-sm backdrop-blur-sm">
                {brandItem.brand}
              </span>
            </div>
          ) : (
            <div
              className="relative flex h-full w-full items-center justify-center"
              style={{ background: "linear-gradient(135deg, #f6ead9, #e8cb9f)" }}
              aria-hidden="true"
            >
              <div className="absolute h-28 w-28 rounded-full bg-white/55 blur-md" />
              <span className="relative text-[4rem] leading-none drop-shadow-[0_6px_12px_rgba(32,26,20,0.22)]">
                {entry.emoji || "🍽️"}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-ink-soft shadow-soft backdrop-blur-sm transition-all active:scale-95"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {/* Title */}
          <h2 className="font-display text-[1.35rem] font-medium leading-snug">
            {entry.emoji && <span className="mr-1.5">{entry.emoji}</span>}
            {entry.description}
          </h2>
          <p className="mt-1 text-[13px] text-muted">
            {formatDay(entry.date)} · {formatTime(entry.loggedAt)}
            {entry.input === "photo" && " · from a photo"}
          </p>

          {/* Totals */}
          <div className="mt-4 rounded-2xl bg-leaf-soft/50 p-4">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-3xl font-medium tabular-nums">
                {entry.totals.calories.toLocaleString()}
                <span className="ml-1 font-sans text-sm font-normal text-muted">cal</span>
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Protein", value: `${Math.round(entry.totals.protein_g)}g`, color: "text-leaf-deep" },
                { label: "Carbs", value: `${Math.round(entry.totals.carbs_g)}g`, color: "text-[#8a5f1d]" },
                { label: "Fat", value: `${Math.round(entry.totals.fat_g)}g`, color: "text-clay" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl bg-surface/80 py-2.5">
                  <div className={`font-display text-lg font-medium tabular-nums ${color}`}>
                    {value}
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                    {label}
                  </div>
                </div>
              ))}
            </div>
            {(fiber !== null || sugar !== null || sodium !== null) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {fiber !== null && (
                  <span className="rounded-full bg-surface/80 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-ink-soft">
                    Fiber {fiber}g
                  </span>
                )}
                {sugar !== null && (
                  <span className="rounded-full bg-surface/80 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-ink-soft">
                    Sugar {sugar}g
                  </span>
                )}
                {sodium !== null && (
                  <span className="rounded-full bg-surface/80 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-ink-soft">
                    Sodium {Math.round(sodium).toLocaleString()}mg
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Items */}
          <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted">
            {entry.items.length === 1 ? "Item" : `${entry.items.length} items`}
          </h3>
          <ul className="mt-2 space-y-2">
            {entry.items.map((item, i) => (
              <li
                key={`${item.name}-${i}`}
                className="rounded-2xl border border-line/70 bg-surface p-3.5 shadow-soft"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-[15px] font-medium">
                    {item.name}
                  </span>
                  <span className="shrink-0 font-display text-lg font-medium tabular-nums">
                    {item.calories}
                    <span className="ml-0.5 font-sans text-xs font-normal text-muted">
                      cal
                    </span>
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-muted">
                  {item.quantity}
                  {item.brand && <span> · {item.brand}</span>}
                </div>
                <div className="mt-2.5">
                  <NutrientBadges item={item} />
                </div>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onDelete(entry.id);
                onClose();
              }}
              className="rounded-full px-4 py-2.5 text-sm font-medium text-clay transition-all hover:bg-clay-soft active:scale-95"
            >
              Delete entry
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-gradient-to-b from-leaf to-leaf-deep px-6 py-2.5 text-sm font-semibold text-white shadow-pop transition-all hover:brightness-105 active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
