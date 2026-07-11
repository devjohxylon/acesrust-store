'use client';

import { useMemo } from 'react';

const EMBER_COUNT = 10;

export function AnimatedBackground() {
  const embers = useMemo(
    () =>
      Array.from({ length: EMBER_COUNT }).map((_, i) => {
        const seed = (i * 9301 + 49297) % 233280;
        const rand = seed / 233280;
        const rand2 = ((i * 4099 + 7919) % 233280) / 233280;
        return {
          left: `${Math.round(rand * 100)}%`,
          delay: `${(rand2 * 14).toFixed(2)}s`,
          duration: `${(12 + rand * 14).toFixed(2)}s`,
          drift: `${Math.round((rand2 - 0.5) * 80)}px`,
        };
      }),
    []
  );

  return (
    <div className="fx-root" aria-hidden="true">
      <div className="fx-static-bg" />
      <div className="fx-aurora fx-aurora-1" />
      <div className="fx-aurora fx-aurora-2" />
      {embers.map((e, i) => (
        <span
          key={i}
          className="fx-ember"
          style={
            {
              left: e.left,
              animationDelay: e.delay,
              animationDuration: e.duration,
              '--ember-drift': e.drift,
            } as React.CSSProperties
          }
        />
      ))}
      <div className="fx-grid" />
      <div className="fx-vignette-static" />
    </div>
  );
}
