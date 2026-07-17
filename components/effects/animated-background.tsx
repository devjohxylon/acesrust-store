'use client';

import { useMemo } from 'react';

const STAR_COUNT = 28;

export function AnimatedBackground() {
  const stars = useMemo(
    () =>
      Array.from({ length: STAR_COUNT }).map((_, i) => {
        const seed = (i * 9301 + 49297) % 233280;
        const rand = seed / 233280;
        const rand2 = ((i * 4099 + 7919) % 233280) / 233280;
        return {
          left: `${Math.round(rand * 100)}%`,
          top: `${Math.round(rand2 * 100)}%`,
          delay: `${(rand2 * 6).toFixed(2)}s`,
          duration: `${(3 + rand * 5).toFixed(2)}s`,
          scale: 0.5 + rand2 * 1.2,
        };
      }),
    []
  );

  return (
    <div className="fx-root" aria-hidden="true">
      <div className="fx-static-bg" />
      <div className="fx-aurora fx-aurora-1" />
      <div className="fx-aurora fx-aurora-2" />
      {stars.map((s, i) => (
        <span
          key={i}
          className="fx-star"
          style={{
            left: s.left,
            top: s.top,
            animationDelay: s.delay,
            animationDuration: s.duration,
            transform: `scale(${s.scale})`,
          }}
        />
      ))}
      <div className="fx-grid" />
      <div className="fx-vignette-static" />
    </div>
  );
}
