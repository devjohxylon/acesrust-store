'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import type { WipeSchedule } from '@/lib/cms-types';
import { WIPE_TYPE_LABELS } from '@/lib/cms-types';

function useCountdown(target: string | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  return useMemo(() => {
    if (!target) return null;
    const diff = new Date(target).getTime() - now;
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, done: true };
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff / 3600000) % 24),
      m: Math.floor((diff / 60000) % 60),
      s: Math.floor((diff / 1000) % 60),
      done: false,
    };
  }, [target, now]);
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-mono text-3xl md:text-4xl font-bold text-white tabular-nums text-glow">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] uppercase tracking-widest text-muted mt-1">{label}</span>
    </div>
  );
}

export function WipeCountdown() {
  const [wipe, setWipe] = useState<WipeSchedule | null>(null);
  const [loaded, setLoaded] = useState(false);
  const countdown = useCountdown(wipe?.scheduledAt ?? null);

  useEffect(() => {
    let active = true;
    fetch('/api/wipes')
      .then((res) => (res.ok ? res.json() : { wipes: [] }))
      .then((data: { wipes: WipeSchedule[] }) => {
        if (active) setWipe(data.wipes?.[0] ?? null);
      })
      .catch(() => {})
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, []);

  if (!loaded || !wipe || !countdown || countdown.done) return null;

  return (
    <section className="py-10 relative">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto rounded-2xl border border-primary/20 bg-card/60 backdrop-blur p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-xs uppercase tracking-widest text-primary">Next Wipe</span>
              </div>
              <p className="text-xl font-bold text-white">{wipe.title}</p>
              <span className="inline-block mt-1 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                {WIPE_TYPE_LABELS[wipe.wipeType]}
              </span>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
              <Unit value={countdown.d} label="days" />
              <Unit value={countdown.h} label="hrs" />
              <Unit value={countdown.m} label="min" />
              <Unit value={countdown.s} label="sec" />
            </div>
          </div>
          <div className="mt-5 text-right">
            <Link
              href="/wipes"
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Full schedule →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
