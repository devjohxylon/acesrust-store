'use client';

import { useMemo } from 'react';

const EMBER_COUNT = 18;

export function AnimatedBackground() {
  const embers = useMemo(
    () =>
      Array.from({ length: EMBER_COUNT }).map((_, i) => {
        // Deterministic pseudo-random so SSR and client match.
        const seed = (i * 9301 + 49297) % 233280;
        const rand = seed / 233280;
        const rand2 = ((i * 4099 + 7919) % 233280) / 233280;
        return {
          left: `${Math.round(rand * 100)}%`,
          delay: `${(rand2 * 12).toFixed(2)}s`,
          duration: `${(9 + rand * 10).toFixed(2)}s`,
          drift: `${Math.round((rand2 - 0.5) * 120)}px`,
          scale: 0.6 + rand2 * 1.4,
        };
      }),
    []
  );

  return (
    <div className="fx-root" aria-hidden="true">
      <div className="fx-aurora fx-aurora-1" />
      <div className="fx-aurora fx-aurora-2" />
      <div className="fx-aurora fx-aurora-3" />
      {embers.map((e, i) => (
        <span
          key={i}
          className="fx-ember"
          style={
            {
              left: e.left,
              animationDelay: e.delay,
              animationDuration: e.duration,
              transform: `scale(${e.scale})`,
              '--ember-drift': e.drift,
            } as React.CSSProperties
          }
        />
      ))}
      <div className="fx-scanline" />
      <div className="fx-vignette" />
    </div>
  );
}
