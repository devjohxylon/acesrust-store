'use client';

import { useEffect, useRef, useState } from 'react';
import { Users } from 'lucide-react';
import type { ServerStatus } from '@/lib/cms-types';

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    if (from === target) return;

    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}

type ServerStatusWidgetProps = {
  variant?: 'pill' | 'card';
  initial?: ServerStatus | null;
};

export function ServerStatusWidget({ variant = 'pill', initial = null }: ServerStatusWidgetProps) {
  const [status, setStatus] = useState<ServerStatus | null>(initial);
  const [loaded, setLoaded] = useState(Boolean(initial));

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch('/api/server-status', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as ServerStatus;
        if (active) setStatus(data);
      } catch {
        // ignore transient errors
      } finally {
        if (active) setLoaded(true);
      }
    }

    load();
    const interval = setInterval(load, 30_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const players = useCountUp(status?.players ?? 0);
  const queued = status?.queued ?? 0;
  const maxPlayers = status?.maxPlayers ?? 0;

  // Never synced yet — render nothing rather than a fake "offline".
  if (loaded && (!status || status.updatedAt === null)) {
    return null;
  }

  const online = status?.online ?? false;

  if (variant === 'card') {
    return (
      <div className="rounded-xl border border-border bg-card/70 backdrop-blur px-5 py-4 flex items-center gap-4">
        <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`live-dot ${online ? '' : 'is-off'}`} />
            <span className="text-xs uppercase tracking-wider text-muted">
              {online ? 'Server Online' : 'Server Offline'}
            </span>
          </div>
          <p className="mt-1 font-mono text-lg text-white tabular-nums">
            {players}
            {maxPlayers ? <span className="text-muted">/{maxPlayers}</span> : null}
            <span className="text-muted text-sm"> online</span>
            {queued > 0 && (
              <span className="ml-2 text-sky-400 text-sm">+{queued} queued</span>
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-border bg-card/70 backdrop-blur px-4 py-2">
      <span className={`live-dot ${online ? '' : 'is-off'}`} />
      <span className="text-sm font-mono text-white tabular-nums">
        {players}
        {maxPlayers ? <span className="text-muted">/{maxPlayers}</span> : ''}
      </span>
      <span className="text-xs text-muted">{online ? 'players online' : 'offline'}</span>
      {queued > 0 && (
        <span className="text-xs text-sky-400 border-l border-border pl-2.5">
          {queued} in queue
        </span>
      )}
    </div>
  );
}
