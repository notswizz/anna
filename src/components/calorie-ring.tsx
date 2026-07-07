"use client";

interface CalorieRingProps {
  consumed: number;
  goal: number;
}

const SIZE = 184;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CalorieRing({ consumed, goal }: CalorieRingProps) {
  const pct = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const over = goal > 0 && consumed > goal;
  const remaining = Math.round(goal - consumed);

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <defs>
          <linearGradient id="ring-leaf" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4d7f5f" />
            <stop offset="100%" stopColor="#33573f" />
          </linearGradient>
          <linearGradient id="ring-clay" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d98a63" />
            <stop offset="100%" stopColor="#b85c3a" />
          </linearGradient>
        </defs>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-line)"
          strokeOpacity={0.7}
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={over ? "url(#ring-clay)" : "url(#ring-leaf)"}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
          style={{ filter: "drop-shadow(0 2px 4px rgba(63,107,79,0.25))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[2.6rem] font-medium leading-none tabular-nums tracking-tight">
          {Math.round(consumed).toLocaleString()}
        </span>
        <span className="mt-1.5 text-xs text-muted">
          of {goal.toLocaleString()} cal
        </span>
        <span
          className={`mt-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums ${
            over ? "bg-clay-soft text-clay" : "bg-leaf-soft text-leaf-deep"
          }`}
        >
          {over
            ? `${Math.abs(remaining).toLocaleString()} over`
            : `${remaining.toLocaleString()} left`}
        </span>
      </div>
    </div>
  );
}
