"use client";

import { useMemo, useState } from "react";
import {
  ACTIVITY_LEVELS,
  computeTargets,
  GOAL_TYPES,
  isValidProfile,
} from "@/lib/profile";
import type { Profile } from "@/lib/types";

interface ProfileEditorProps {
  profile: Profile | null;
  onSave: (profile: Profile) => Promise<void>;
  onClose: () => void;
}

export function ProfileEditor({ profile, onSave, onClose }: ProfileEditorProps) {
  const [feet, setFeet] = useState(
    profile ? String(Math.floor(profile.heightIn / 12)) : "5"
  );
  const [inches, setInches] = useState(
    profile ? String(profile.heightIn % 12) : "10"
  );
  const [weight, setWeight] = useState(profile ? String(profile.weightLb) : "");
  const [age, setAge] = useState(profile ? String(profile.age) : "");
  const [sex, setSex] = useState<Profile["sex"]>(profile?.sex ?? "male");
  const [activity, setActivity] = useState<Profile["activity"]>(
    profile?.activity ?? "light"
  );
  const [goal, setGoal] = useState<Profile["goal"]>(profile?.goal ?? "maintain");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draft: Partial<Profile> = useMemo(
    () => ({
      heightIn: Number(feet) * 12 + Number(inches || 0),
      weightLb: Number(weight),
      age: Number(age),
      sex,
      activity,
      goal,
    }),
    [feet, inches, weight, age, sex, activity, goal]
  );

  const valid = isValidProfile(draft);
  const preview = valid ? computeTargets(draft) : null;

  async function save() {
    if (!valid) {
      setError("Fill in height, weight, and age (13–100).");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full bg-transparent text-base tabular-nums outline-none";
  const boxClass =
    "mt-1 flex items-center rounded-xl border border-line bg-cream/60 px-3 py-2.5 focus-within:border-leaf";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
        className="animate-sheet max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[1.75rem] bg-surface p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-lift sm:animate-rise sm:rounded-[1.75rem] sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line sm:hidden" />
        <h2 id="profile-title" className="font-display text-xl font-medium">
          About you
        </h2>
        <p className="mt-1 text-sm text-muted">
          Anna uses this to set your daily calories and macros.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-ink-soft">Height</span>
            <div className="mt-1 flex gap-2">
              <div className="flex flex-1 items-center rounded-xl border border-line bg-cream/60 px-3 py-2.5 focus-within:border-leaf">
                <input type="number" min={3} max={8} value={feet} onChange={(e) => setFeet(e.target.value)} className={inputClass} aria-label="Feet" />
                <span className="ml-1 text-xs text-muted">ft</span>
              </div>
              <div className="flex flex-1 items-center rounded-xl border border-line bg-cream/60 px-3 py-2.5 focus-within:border-leaf">
                <input type="number" min={0} max={11} value={inches} onChange={(e) => setInches(e.target.value)} className={inputClass} aria-label="Inches" />
                <span className="ml-1 text-xs text-muted">in</span>
              </div>
            </div>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink-soft">Weight</span>
            <div className={boxClass}>
              <input type="number" min={60} max={700} value={weight} onChange={(e) => setWeight(e.target.value)} className={inputClass} placeholder="180" />
              <span className="ml-1 text-xs text-muted">lb</span>
            </div>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink-soft">Age</span>
            <div className={boxClass}>
              <input type="number" min={13} max={100} value={age} onChange={(e) => setAge(e.target.value)} className={inputClass} placeholder="32" />
              <span className="ml-1 text-xs text-muted">yrs</span>
            </div>
          </label>
          <div>
            <span className="text-xs font-medium text-ink-soft">Sex</span>
            <div className="mt-1 grid grid-cols-2 gap-1 rounded-xl border border-line bg-cream/60 p-1">
              {(["male", "female"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSex(s)}
                  className={`rounded-lg py-2 text-sm font-medium capitalize active:scale-95 transition-colors ${
                    sex === s ? "bg-leaf text-white" : "text-ink-soft hover:bg-surface"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <label className="mt-3 block">
          <span className="text-xs font-medium text-ink-soft">Activity level</span>
          <div className={boxClass}>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value as Profile["activity"])}
              className="w-full bg-transparent text-base outline-none"
            >
              {ACTIVITY_LEVELS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label} — {a.hint}
                </option>
              ))}
            </select>
          </div>
        </label>

        <div className="mt-3">
          <span className="text-xs font-medium text-ink-soft">Goal</span>
          <div className="mt-1 grid grid-cols-3 gap-1 rounded-xl border border-line bg-cream/60 p-1">
            {GOAL_TYPES.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGoal(g.value)}
                title={g.hint}
                className={`rounded-lg py-2 text-[13px] font-medium active:scale-95 transition-colors ${
                  goal === g.value ? "bg-leaf text-white" : "text-ink-soft hover:bg-surface"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Computed preview */}
        <div className="mt-4 rounded-xl bg-leaf-soft/50 p-3.5">
          {preview ? (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-ink-soft">
                  Anna&apos;s targets for you
                </span>
                <span className="text-[11px] text-muted">
                  BMR {preview.bmr.toLocaleString()} · TDEE {preview.tdee.toLocaleString()}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                {[
                  { label: "Calories", value: preview.calories.toLocaleString() },
                  { label: "Protein", value: `${preview.protein_g}g` },
                  { label: "Carbs", value: `${preview.carbs_g}g` },
                  { label: "Fat", value: `${preview.fat_g}g` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="font-display text-lg font-medium tabular-nums text-leaf">
                      {value}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-muted">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">
              Fill everything in and Anna will work out your targets.
            </p>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-clay">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2.5 text-sm font-medium text-ink-soft transition-all hover:bg-cream active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !valid}
            className="rounded-full bg-gradient-to-b from-leaf to-leaf-deep px-6 py-2.5 text-sm font-semibold text-white shadow-pop transition-all hover:brightness-105 active:scale-95 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save & apply targets"}
          </button>
        </div>
      </div>
    </div>
  );
}
