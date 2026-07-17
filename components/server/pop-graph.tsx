'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity } from 'lucide-react';

type PopPoint = { t: string; players: number };

const WIDTH = 600;
const HEIGHT = 140;
const PAD = 8;

function buildPath(points: PopPoint[]) {
  if (points.length === 0) return { line: '', area: '', peak: 0, current: 0 };

  const times = points.map((p) => new Date(p.t).getTime());
  const minT = Math.min(...times);
  const maxT = Math.max(...times);
  const spanT = Math.max(1, maxT - minT);
  const peak = Math.max(1, ...points.map((p) => p.players));

  const x = (t: number) => PAD + ((t - minT) / spanT) * (WIDTH - PAD * 2);
  const y = (v: number) => HEIGHT - PAD - (v / peak) * (HEIGHT - PAD * 2);

  const coords = points.map((p) => [x(new Date(p.t).getTime()), y(p.players)] as const);
  const line = coords.map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
  const area =
    `${line} L${coords[coords.length - 1][0].toFixed(1)},${HEIGHT - PAD} ` +
    `L${coords[0][0].toFixed(1)},${HEIGHT - PAD} Z`;

  return { line, area, peak, current: points[points.length - 1].players };
}

export function PopGraph() {
  const [points, setPoints] = useState<PopPoint[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch('/api/pop-history', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { points: PopPoint[] };
        if (active) setPoints(data.points ?? []);
      } catch {
        // ignore
      } finally {
        if (active) setLoaded(true);
      }
    }
    load();
    const id = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const { line, area, peak, current } = useMemo(() => buildPath(points), [points]);

  // Need at least 2 points to draw a meaningful graph.
  if (!loaded || points.length < 2) return null;

  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-white text-sm">Player Activity</h3>
          <span className="text-xs text-muted">· last 24h</span>
        </div>
        <div className="text-xs font-mono text-muted">
          <span className="text-sky-400">{current}</span> now · peak{' '}
          <span className="text-primary">{peak}</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto"
        preserveAspectRatio="none"
        role="img"
        aria-label="Player count over the last 24 hours"
      >
        <defs>
          <linearGradient id="popFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(200,204,214)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgb(200,204,214)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#popFill)" />
        <path
          d={line}
          fill="none"
          stroke="rgb(200,204,214)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
