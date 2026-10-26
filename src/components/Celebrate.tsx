"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { cn } from "./ui";

const HUES = ["#7b6cff", "#5cc8ff", "#ffc94d", "#5ee0a8", "#ff7d5c", "#ffffff"];

/**
 * A one-off confetti burst from the centre of its (relative) parent. Decorative only: hidden from assistive tech,
 * and reduced motion shortens it to nothing through the global animation rules. Re-key it to fire again.
 */
export function Confetti({ count = 18, spread = 110, className }: { count?: number; spread?: number; className?: string }) {
  // Gone once it has played, so the pieces never widen the page.
  const [done, setDone] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setDone(true), 1200);
    return () => window.clearTimeout(id);
  }, []);
  if (done) return null;
  return (
    <span aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-visible", className)}>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + (i % 3) * 0.21;
        const dist = spread * (0.55 + ((i * 37) % 45) / 100);
        const style = {
          "--dx": `${Math.round(Math.cos(angle) * dist)}px`,
          "--dy": `${Math.round(Math.sin(angle) * dist - 18)}px`,
          "--r": `${(i % 2 ? 1 : -1) * (180 + i * 23)}deg`,
          background: HUES[i % HUES.length],
          animationDelay: `${(i % 4) * 25}ms`,
        } as CSSProperties;
        return <span key={i} className="confetti-bit" style={style} />;
      })}
    </span>
  );
}
