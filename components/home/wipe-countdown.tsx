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
    <section className="pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto rounded-xl border border-border bg-card/50 px-5 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Next wipe
              </p>
              <p className="font-semibold text-white mt-1 truncate">{wipe.title}</p>
              <p className="text-xs text-muted mt-0.5">{WIPE_TYPE_LABELS[wipe.wipeType]}</p>
            </div>
            <div className="flex items-center gap-3 font-mono text-sm tabular-nums text-white shrink-0">
              <span>{countdown.d}d</span>
              <span className="text-muted">:</span>
              <span>{String(countdown.h).padStart(2, '0')}h</span>
              <span className="text-muted">:</span>
              <span>{String(countdown.m).padStart(2, '0')}m</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/60">
            <Link href="/wipes" className="text-xs text-primary hover:underline">
              Full schedule →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
