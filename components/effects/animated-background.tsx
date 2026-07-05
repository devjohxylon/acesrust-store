'use client';

/** Lightweight static backdrop — no embers, aurora, or scanlines. */
export function AnimatedBackground() {
  return (
    <div className="fx-root" aria-hidden="true">
      <div className="fx-static-bg" />
      <div className="fx-vignette-static" />
    </div>
  );
}
