"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as api from "@/lib/client/api";
import { dataUrlToThumbnail } from "@/lib/client/image";
import { addDays, formatDay, todayLocal } from "@/lib/dates";
import {
  DEFAULT_GOALS,
  sumMacros,
  type AnalysisResult,
  type FoodEntry,
  type Goals,
  type Profile,
} from "@/lib/types";
import { CalorieRing } from "./calorie-ring";
import { Composer, type ComposerSubmit } from "./composer";
import { EntryCard } from "./entry-card";
import { EntryDetail } from "./entry-detail";
import { MacroBar } from "./macro-bar";
import { ProfileEditor } from "./profile-editor";
import { ReviewCard } from "./review-card";

type FilterKey = "all" | "photos" | "brands" | "protein";

const FILTERS: Array<{
  key: FilterKey;
  label: string;
  test: (e: FoodEntry) => boolean;
}> = [
  { key: "all", label: "All", test: () => true },
  { key: "photos", label: "📷 Photos", test: (e) => e.input === "photo" },
  {
    key: "brands",
    label: "🏪 Brands",
    test: (e) => e.items.some((i) => i.brand || i.brandDomain),
  },
  {
    key: "protein",
    label: "💪 Protein",
    test: (e) => e.totals.protein_g >= 25,
  },
];

export function Dashboard() {
  const [date, setDate] = useState(todayLocal);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [allEntries, setAllEntries] = useState<FoodEntry[]>([]);
  const [brands, setBrands] = useState<api.BrandSuggestion[]>([]);
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisInput, setAnalysisInput] = useState<"text" | "photo">("text");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FoodEntry | null>(null);

  const isToday = date === todayLocal();

  const refresh = useCallback(async (day: string) => {
    const [{ entries }, { brands }, all] = await Promise.all([
      api.getEntries(day),
      api.getBrands(),
      api.getAllEntries(),
    ]);
    setEntries(entries);
    setBrands(brands);
    setAllEntries(all.entries);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.getEntries(date),
      api.getGoals(),
      api.getProfile(),
      api.getBrands(),
      api.getAllEntries(),
    ])
      .then(([{ entries }, goals, { profile }, { brands }, all]) => {
        if (cancelled) return;
        setEntries(entries);
        setGoals(goals);
        setProfile(profile);
        setBrands(brands);
        setAllEntries(all.entries);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your log. Is the server running?");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  const totals = sumMacros(entries.map((e) => e.totals));
  const remaining = Math.round(goals.calories - totals.calories);
  const visibleEntries = useMemo(() => {
    const test = FILTERS.find((f) => f.key === filter)?.test ?? (() => true);
    return entries.filter(test);
  }, [entries, filter]);

  async function handleAnalyze({ text, image, repeatEntryId }: ComposerSubmit) {
    setError(null);
    setAnalysis(null);

    // A solo #past-log chip: reuse the saved nutrition, no AI round-trip.
    if (repeatEntryId) {
      const past = allEntries.find((e) => e.id === repeatEntryId);
      if (past) {
        setAnalysisInput("text");
        setPendingImage(past.image ?? null);
        setAnalysis({
          items: past.items,
          summary: past.description,
          emoji: past.emoji ?? "🍽️",
          notes: "Repeated from a previous log — same items and nutrition.",
        });
        return;
      }
    }

    setAnalyzing(true);
    setAnalysisInput(image ? "photo" : "text");
    setPendingImage(image);
    try {
      const result = await api.analyze({
        text: text || undefined,
        image: image || undefined,
      });
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed — try again.");
      setPendingImage(null);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleLog() {
    if (!analysis || analysis.items.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      let thumbnail: string | null = null;
      if (pendingImage) {
        thumbnail = await dataUrlToThumbnail(pendingImage).catch(() => null);
      }
      await api.addEntry({
        date,
        description: analysis.summary,
        input: analysisInput,
        items: analysis.items,
        image: thumbnail,
        emoji: analysis.emoji || null,
      });
      setAnalysis(null);
      setPendingImage(null);
      await refresh(date);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the entry.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      await api.deleteEntry(id);
    } catch {
      await refresh(date);
    }
  }

  async function handleSaveProfile(next: Profile) {
    const { profile: saved, targets } = await api.saveProfile(next);
    setProfile(saved);
    setGoals({
      calories: targets.calories,
      protein_g: targets.protein_g,
      carbs_g: targets.carbs_g,
      fat_g: targets.fat_g,
    });
  }

  return (
    <div className="flex-1">
      {/* Sticky glass header */}
      <header className="sticky top-0 z-40 border-b border-line/60 bg-cream/75 backdrop-blur-xl">
        <div
          className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-5 sm:px-6"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <h1 className="font-display text-[1.55rem] font-semibold tracking-tight text-leaf">
            Anna
          </h1>
          <div className="flex items-center gap-2">
            {!loading && (
              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold tabular-nums ${
                  remaining < 0
                    ? "bg-clay-soft text-clay"
                    : "bg-leaf-soft text-leaf-deep"
                }`}
              >
                {remaining < 0
                  ? `${Math.abs(remaining).toLocaleString()} over`
                  : `${remaining.toLocaleString()} left`}
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowProfile(true)}
              aria-label={profile ? "Edit profile" : "Set up profile"}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink-soft shadow-soft transition-all hover:border-leaf/40 hover:text-leaf active:scale-95"
            >
              <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="10" cy="6.5" r="3.2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3.5 17c.9-3 3.4-4.5 6.5-4.5s5.6 1.5 6.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main
        className="mx-auto w-full max-w-2xl px-5 pt-5 sm:px-6"
        style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom))" }}
      >
        {/* Day heading + navigation */}
        <nav className="flex items-end justify-between" aria-label="Day">
          <div>
            <h2 className="font-display text-[2rem] font-medium leading-none tracking-tight">
              {isToday ? "Today" : formatDay(date).split(",")[0]}
            </h2>
            <p className="mt-1.5 text-[13px] text-muted">
              {isToday ? formatDay(date) : formatDay(date)}
              {!isToday && (
                <button
                  type="button"
                  onClick={() => setDate(todayLocal())}
                  className="ml-2 rounded-full bg-leaf-soft px-2.5 py-0.5 text-[11px] font-semibold text-leaf-deep transition-colors active:scale-95"
                >
                  Back to today
                </button>
              )}
            </p>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setDate((d) => addDays(d, -1))}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink-soft shadow-soft transition-all hover:text-leaf active:scale-95"
              aria-label="Previous day"
            >
              <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setDate((d) => addDays(d, 1))}
              disabled={isToday}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink-soft shadow-soft transition-all hover:text-leaf active:scale-95 disabled:opacity-30"
              aria-label="Next day"
            >
              <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </nav>

        {/* Composer */}
        <section aria-label="Log food" className="mt-5">
          <Composer
            busy={analyzing}
            brands={brands}
            pastEntries={allEntries}
            onSubmit={handleAnalyze}
          />
          {analyzing && (
            <p className="animate-pulse-soft mt-3 text-center text-[13px] text-muted">
              Anna is working it out — checking published nutrition where she can…
            </p>
          )}
          {error && (
            <p className="mt-3 rounded-2xl bg-clay-soft px-4 py-3 text-sm leading-snug text-clay">
              {error}
            </p>
          )}
        </section>

        {/* Review */}
        {analysis && (
          <section aria-label="Review analysis" className="mt-4">
            <ReviewCard
              result={analysis}
              saving={saving}
              onRemoveItem={(i) =>
                setAnalysis((a) =>
                  a ? { ...a, items: a.items.filter((_, idx) => idx !== i) } : a
                )
              }
              onLog={handleLog}
              onDiscard={() => {
                setAnalysis(null);
                setPendingImage(null);
              }}
            />
          </section>
        )}

        {/* Entries */}
        <section aria-label="Logged food" className="mt-9">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-medium">
              {isToday ? "Today's meals" : "Meals"}
              {entries.length > 0 && (
                <span className="ml-2 align-middle rounded-full bg-surface px-2 py-0.5 text-[11px] font-sans font-semibold tabular-nums text-muted shadow-soft">
                  {entries.length}
                </span>
              )}
            </h2>
          </div>

          <div
            className="no-scrollbar -mx-5 mt-3 flex gap-1.5 overflow-x-auto px-5 sm:-mx-6 sm:px-6"
            role="tablist"
            aria-label="Filter entries"
          >
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition-all active:scale-95 ${
                  filter === f.key
                    ? "bg-leaf text-white shadow-pop"
                    : "border border-line bg-surface text-ink-soft shadow-soft"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="no-scrollbar -mx-5 mt-4 flex gap-3 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-56 w-44 shrink-0 animate-pulse-soft rounded-3xl bg-surface sm:w-52" />
              ))}
            </div>
          ) : visibleEntries.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-dashed border-line bg-surface/60 px-6 py-12 text-center">
              <div className="text-3xl tracking-widest">🥗 🌮 🍳</div>
              <p className="mt-3 font-display text-lg text-ink-soft">
                {entries.length === 0 ? "Nothing logged yet" : "Nothing matches that filter"}
              </p>
              <p className="mx-auto mt-1 max-w-[24ch] text-[13px] leading-snug text-muted">
                {entries.length === 0
                  ? "Type what you ate or snap a photo — Anna handles the rest."
                  : "Try another filter or log something new."}
              </p>
            </div>
          ) : (
            <div className="no-scrollbar -mx-5 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:-mx-6 sm:px-6">
              {visibleEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onDelete={handleDelete}
                  onSelect={setSelectedEntry}
                />
              ))}
            </div>
          )}
        </section>

        {/* Day summary */}
        <section aria-label="Day summary" className="mt-9">
          <h2 className="font-display text-lg font-medium">Daily progress</h2>
          <div className="mt-3 flex flex-col items-center gap-7 rounded-[1.75rem] border border-line/80 bg-gradient-to-b from-surface to-cream/60 p-7 shadow-soft sm:flex-row sm:gap-11 sm:p-8">
            <CalorieRing consumed={totals.calories} goal={goals.calories} />
            <div className="w-full flex-1 space-y-5">
              <MacroBar label="Protein" consumed={totals.protein_g} goal={goals.protein_g} color="leaf" />
              <MacroBar label="Carbs" consumed={totals.carbs_g} goal={goals.carbs_g} color="amber" />
              <MacroBar label="Fat" consumed={totals.fat_g} goal={goals.fat_g} color="clay" />
            </div>
          </div>

          {!profile && !loading && (
            <button
              type="button"
              onClick={() => setShowProfile(true)}
              className="mt-3 w-full rounded-2xl border border-dashed border-leaf/40 bg-leaf-soft/40 px-5 py-3.5 text-left text-[13px] leading-snug text-ink-soft transition-all hover:bg-leaf-soft active:scale-[0.99]"
            >
              👋 Tell Anna your height, weight, and activity level — she&apos;ll set
              your ideal calories and macros.
            </button>
          )}
        </section>
      </main>

      {showProfile && (
        <ProfileEditor
          profile={profile}
          onSave={handleSaveProfile}
          onClose={() => setShowProfile(false)}
        />
      )}

      {selectedEntry && (
        <EntryDetail
          entry={selectedEntry}
          onDelete={handleDelete}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  );
}
