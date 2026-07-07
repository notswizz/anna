"use client";

import { useState } from "react";
import type { FoodEntry } from "@/lib/types";
import { accentGradient } from "@/lib/client/color";
import { formatTime } from "@/lib/dates";
import { BrandLogo } from "./brand-logo";

interface EntryCardProps {
  entry: FoodEntry;
  onDelete: (id: string) => void;
  onSelect: (entry: FoodEntry) => void;
}

function entryBrand(entry: FoodEntry): { name: string; domain: string } | null {
  const item = entry.items.find((i) => i.brandDomain);
  return item?.brandDomain
    ? { name: item.brand ?? item.brandDomain, domain: item.brandDomain }
    : null;
}

/** Warm tile backgrounds, picked deterministically per entry for variety. */
const TILE_BGS = [
  "linear-gradient(135deg, #f6efdf 0%, #eadfc4 55%, #e2d2ae 100%)",
  "linear-gradient(135deg, #eaf0e6 0%, #d8e4d2 55%, #c5d6bd 100%)",
  "linear-gradient(135deg, #f7e9dc 0%, #eed6c2 55%, #e4c3a8 100%)",
  "linear-gradient(135deg, #eef0ea 0%, #dfe6da 55%, #cfdac6 100%)",
  "linear-gradient(135deg, #f6ead9 0%, #efdaba 55%, #e8cb9f 100%)",
] as const;

function tileBg(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return TILE_BGS[Math.abs(hash) % TILE_BGS.length];
}

export function EntryCard({ entry, onDelete, onSelect }: EntryCardProps) {
  const brand = entryBrand(entry);
  const [accent, setAccent] = useState<string | null>(null);

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`View ${entry.description}`}
      onClick={() => onSelect(entry)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(entry);
        }
      }}
      className="group relative w-44 shrink-0 cursor-pointer snap-start overflow-hidden rounded-3xl border border-line/80 bg-surface shadow-soft outline-none transition-all hover:shadow-lift focus-visible:ring-2 focus-visible:ring-leaf/40 active:scale-[0.985] sm:w-52"
    >
      {/* Hero */}
      <div className="relative h-32 w-full overflow-hidden sm:h-36">
        {entry.image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={entry.image}
              alt={entry.description}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/25 to-transparent" />
            {entry.emoji && (
              <span className="absolute bottom-2 left-2.5 text-lg drop-shadow-sm">
                {entry.emoji}
              </span>
            )}
          </>
        ) : brand ? (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-2 transition-[background] duration-700"
            style={{ background: accent ? accentGradient(accent) : tileBg(entry.id) }}
          >
            <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/35 blur-xl" />
            <div className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full bg-white shadow-[0_6px_18px_rgba(32,26,20,0.16)] ring-1 ring-black/5 transition-transform duration-500 ease-out group-hover:scale-105">
              <BrandLogo
                domain={brand.domain}
                name={brand.name}
                className="h-11 w-11 rounded-full object-contain text-xl"
                onAccent={setAccent}
              />
            </div>
            <span className="max-w-[85%] truncate rounded-full bg-white/70 px-2.5 py-0.5 text-[11px] font-semibold text-ink-soft shadow-sm backdrop-blur-sm">
              {brand.name}
            </span>
          </div>
        ) : (
          <div
            className="relative flex h-full w-full items-center justify-center"
            style={{ background: tileBg(entry.id) }}
            aria-hidden="true"
          >
            <div className="absolute h-24 w-24 rounded-full bg-white/55 blur-md" />
            <div className="pointer-events-none absolute -left-6 -bottom-8 h-24 w-24 rounded-full bg-white/30 blur-xl" />
            <span className="relative text-[3.4rem] leading-none drop-shadow-[0_5px_10px_rgba(32,26,20,0.22)] transition-transform duration-500 ease-out group-hover:scale-110">
              {entry.emoji || "🍽️"}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(entry.id);
          }}
          className="absolute right-2 top-2 rounded-full bg-surface/90 p-1.5 text-muted opacity-0 shadow-sm transition-all hover:text-clay group-hover:opacity-100 focus-visible:opacity-100"
          aria-label={`Delete ${entry.description}`}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="p-3.5">
        <h3 className="line-clamp-2 min-h-[2.4em] text-[13.5px] font-medium leading-snug">
          {entry.description}
        </h3>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="text-[15px] font-semibold tabular-nums">
            {entry.totals.calories.toLocaleString()}
            <span className="text-xs font-normal text-muted"> cal</span>
          </span>
          <span className="text-[11px] text-muted">{formatTime(entry.loggedAt)}</span>
        </div>
        <div className="mt-1 text-[11px] text-muted">
          P {Math.round(entry.totals.protein_g)} · C {Math.round(entry.totals.carbs_g)}
          · F {Math.round(entry.totals.fat_g)}
          {entry.items.length > 1 && <span> · {entry.items.length} items</span>}
        </div>
      </div>
    </article>
  );
}
