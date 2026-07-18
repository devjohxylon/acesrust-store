'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock, TrendingUp } from 'lucide-react';
import {
  aggregateByHourOfDay,
  chartPath,
  findPeakWindow,
  formatPeakRange,
  formatHour,
  type PopPoint,
} from '@/lib/server-activity';

const CHART_W = 640;
const CHART_H = 120;

function isInPeakWindow(hour: number, peak: { startHour: number; endHour: number }): boolean {
  const { startHour, endHour } = peak;
  if (startHour <= endHour) return hour >= startHour && hour <= endHour;
  return hour >= startHour || hour <= endHour;
}

type Props = {
  /** Compact card for home vs full panel on leaderboard */
  variant?: 'home' | 'full';
};

export function ServerActivityPanel({ variant = 'full' }: Props) {
  const [recent, setRecent] = useState<PopPoint[]>([]);
  const [history, setHistory] = useState<PopPoint[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [recentRes, historyRes] = await Promise.all([
          fetch('/api/pop-history?hours=24', { cache: 'no-store' }),
          fetch('/api/pop-history?hours=168', { cache: 'no-store' }),
        ]);
        if (!active) return;
        if (recentRes.ok) {
          const data = (await recentRes.json()) as { points: PopPoint[] };
          setRecent(data.points ?? []);
        }
        if (historyRes.ok) {
          const data = (await historyRes.json()) as { points: PopPoint[] };
          setHistory(data.points ?? []);
        }
      } catch {
        // ignore
      } finally {
        if (active) {
          setLoaded(true);
          requestAnimationFrame(() => setAnimated(true));
        }
      }
    }

    load();
    const id = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const chart = useMemo(() => chartPath(recent, CHART_W, CHART_H), [recent]);
  const hourly = useMemo(() => aggregateByHourOfDay(history.length > 0 ? history : recent), [history, recent]);
  const peakWindow = useMemo(() => findPeakWindow(hourly), [hourly]);
  const maxHourlyAvg = useMemo(() => Math.max(1, ...hourly.map((h) => h.avg)), [hourly]);

  if (!loaded) {
    return (
      <div className="rounded-xl border border-border bg-card/60 p-6 h-48 animate-pulse" />
    );
  }

  if (recent.length < 2 && history.length < 2) {
    return (
      <div className="rounded-xl border border-border bg-card/60 p-6 text-center text-sm text-muted">
        Player activity data will appear once the server has been tracked for a while.
      </div>
    );
  }

  const isHome = variant === 'home';

  return (
    <div
      className={`rounded-lg border border-border bg-card/50 overflow-hidden ${
        isHome ? '' : ''
      }`}
    >
      <div className="px-4 sm:px-5 py-3.5 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted mb-0.5">Activity</p>
          <h3 className="font-semibold text-white text-sm tracking-tight">Server pulse</h3>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-muted">
            now <span className="text-white tabular-nums">{chart.current}</span>
          </span>
          <span className="text-muted">
            peak <span className="text-white tabular-nums">{chart.peak}</span>
          </span>
          <span className="text-muted hidden sm:inline">
            avg <span className="text-white tabular-nums">{chart.avg}</span>
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted mb-2">Last 24 hours</p>
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="w-full h-auto chart-line"
            preserveAspectRatio="none"
            role="img"
            aria-label="Player count over the last 24 hours"
          >
            <defs>
              <linearGradient id="pulseFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(200,204,214)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="rgb(200,204,214)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="pulseStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#e4e7ee" />
                <stop offset="100%" stopColor="#9aa3b5" />
              </linearGradient>
            </defs>
            <path d={chart.area} fill="url(#pulseFill)" className={animated ? 'chart-area-in' : 'opacity-0'} />
            <path
              d={chart.line}
              fill="none"
              stroke="url(#pulseStroke)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              pathLength={100}
              className={animated ? 'chart-stroke-in' : 'opacity-0'}
            />
          </svg>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Peak hours
            </p>
            {peakWindow && (
              <p className="text-xs text-muted flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-primary/80" />
                {formatPeakRange(peakWindow.startHour, peakWindow.endHour)}
              </p>
            )}
          </div>

          <div className="flex items-end gap-[3px] h-16" role="img" aria-label="Average players by hour of day">
            {hourly.map((bucket) => {
              const height = bucket.avg > 0 ? Math.max(8, (bucket.avg / maxHourlyAvg) * 100) : 4;
              const isPeak = peakWindow ? isInPeakWindow(bucket.hour, peakWindow) : false;
              return (
                <div
                  key={bucket.hour}
                  className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0"
                  title={`${formatHour(bucket.hour)}: avg ${bucket.avg} players`}
                >
                  <div
                    className={`w-full rounded-sm transition-all duration-700 ease-out ${
                      isPeak
                        ? 'bg-gradient-to-t from-primary to-secondary bar-peak'
                        : bucket.avg > 0
                          ? 'bg-primary/35 hover:bg-primary/55'
                          : 'bg-border/40'
                    }`}
                    style={{ height: animated ? `${height}%` : '4%' }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-muted font-mono px-0.5">
            <span>12 AM</span>
            <span>6 AM</span>
            <span>12 PM</span>
            <span>6 PM</span>
          </div>
        </div>

        {!isHome && (
          <div className="grid grid-cols-3 gap-px bg-border/70 rounded-md overflow-hidden border border-border/70">
            <Stat label="Online" value={chart.current} />
            <Stat label="24h peak" value={chart.peak} />
            <Stat label="24h avg" value={chart.avg} />
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card/80 px-3 py-2.5 text-center">
      <p className="text-base font-mono tabular-nums text-white">{value}</p>
      <p className="text-[10px] text-muted mt-0.5">{label}</p>
    </div>
  );
}
