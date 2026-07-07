"use client";

interface MacroBarProps {
  label: string;
  consumed: number;
  goal: number;
  color: "leaf" | "amber" | "clay";
}

const COLORS = {
  leaf: {
    fill: "linear-gradient(90deg, #6f9d7c, #3f6b4f)",
    track: "bg-leaf-soft",
    text: "text-leaf-deep",
  },
  amber: {
    fill: "linear-gradient(90deg, #e7bd6d, #cf922a)",
    track: "bg-amber-soft",
    text: "text-[#8a5f1d]",
  },
  clay: {
    fill: "linear-gradient(90deg, #dc9271, #bd5f3b)",
    track: "bg-clay-soft",
    text: "text-clay",
  },
} as const;

export function MacroBar({ label, consumed, goal, color }: MacroBarProps) {
  const pct = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;
  const { fill, track, text } = COLORS[color];

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[13px] font-semibold text-ink-soft">{label}</span>
        <span className="text-xs tabular-nums text-muted">
          <span className={`font-semibold ${text}`}>{Math.round(consumed)}</span>
          <span className="text-muted/80"> / {goal}g</span>
        </span>
      </div>
      <div className={`h-[7px] overflow-hidden rounded-full ${track}`}>
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%`, background: fill }}
        />
      </div>
    </div>
  );
}
