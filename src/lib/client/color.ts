/**
 * Extract a brand accent color from a (same-origin) logo image.
 * Quantizes pixels into coarse RGB buckets, ignores whites/greys/transparent,
 * and returns the most common saturated color — or null for monochrome logos.
 */
export function extractAccent(img: HTMLImageElement): string | null {
  try {
    const SIZE = 32;
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, SIZE, SIZE);
    const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

    const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 200) continue;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      // skip whites, blacks, and greys — we want the brand's accent
      if (max > 242 && min > 242) continue;
      if (max < 40) continue;
      if (saturation < 0.25) continue;

      const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
      const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
      bucket.count++;
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      buckets.set(key, bucket);
    }

    let best: { count: number; r: number; g: number; b: number } | null = null;
    for (const bucket of buckets.values()) {
      if (!best || bucket.count > best.count) best = bucket;
    }
    if (!best || best.count < 12) return null; // too few colored pixels to trust

    const r = Math.round(best.r / best.count);
    const g = Math.round(best.g / best.count);
    const b = Math.round(best.b / best.count);
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return null; // tainted canvas or decode issue — caller keeps its fallback
  }
}

/** Mix a color toward white; amount 0 = color, 1 = white. */
export function tintToward(color: string, amount: number): string {
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return color;
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(+match[1])}, ${mix(+match[2])}, ${mix(+match[3])})`;
}

/** Build the hero-tile gradient from an accent color. */
export function accentGradient(accent: string): string {
  return `linear-gradient(135deg, ${tintToward(accent, 0.9)} 0%, ${tintToward(
    accent,
    0.76
  )} 55%, ${tintToward(accent, 0.62)} 100%)`;
}
