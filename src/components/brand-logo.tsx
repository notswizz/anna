"use client";

import { useState } from "react";
import { extractAccent } from "@/lib/client/color";

interface BrandLogoProps {
  domain: string;
  name: string;
  className?: string;
  /** Fires once with the logo's dominant accent color (null if monochrome) */
  onAccent?: (color: string | null) => void;
}

/**
 * Brand/restaurant logo, served through /api/logo (same-origin proxy that
 * tries Clearbit then Google favicons). Falls back to the brand's initial.
 */
export function BrandLogo({ domain, name, className, onAccent }: BrandLogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-leaf-soft font-display text-leaf ${className ?? ""}`}
        aria-label={name}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/logo?domain=${encodeURIComponent(domain)}`}
      alt={`${name} logo`}
      className={className}
      loading="lazy"
      onLoad={(e) => onAccent?.(extractAccent(e.currentTarget))}
      onError={() => {
        setFailed(true);
        onAccent?.(null);
      }}
    />
  );
}
