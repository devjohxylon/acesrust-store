export type PopPoint = { t: string; players: number };

export type HourlyBucket = {
  hour: number;
  avg: number;
  max: number;
};

export type PeakWindow = {
  startHour: number;
  endHour: number;
  avgPlayers: number;
};

export function aggregateByHourOfDay(points: PopPoint[]): HourlyBucket[] {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    sum: 0,
    count: 0,
    max: 0,
  }));

  for (const point of points) {
    const hour = new Date(point.t).getHours();
    buckets[hour].sum += point.players;
    buckets[hour].count += 1;
    buckets[hour].max = Math.max(buckets[hour].max, point.players);
  }

  return buckets.map((bucket) => ({
    hour: bucket.hour,
    avg: bucket.count ? Math.round(bucket.sum / bucket.count) : 0,
    max: bucket.max,
  }));
}

/** Best 3-hour window by average players. */
export function findPeakWindow(hourly: HourlyBucket[]): PeakWindow | null {
  const withData = hourly.filter((h) => h.avg > 0);
  if (withData.length === 0) return null;

  let best: PeakWindow | null = null;
  for (let start = 0; start < 24; start++) {
    let sum = 0;
    let count = 0;
    for (let offset = 0; offset < 3; offset++) {
      const bucket = hourly[(start + offset) % 24];
      if (bucket.avg > 0) {
        sum += bucket.avg;
        count += 1;
      }
    }
    if (count === 0) continue;
    const avgPlayers = Math.round(sum / count);
    if (!best || avgPlayers > best.avgPlayers) {
      best = {
        startHour: start,
        endHour: (start + 2) % 24,
        avgPlayers,
      };
    }
  }
  return best;
}

export function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${h} ${period}`;
}

export function formatPeakRange(startHour: number, endHour: number): string {
  const endLabel = formatHour((endHour + 1) % 24);
  return `${formatHour(startHour)} – ${endLabel}`;
}

export function chartPath(points: PopPoint[], width: number, height: number, pad = 8) {
  if (points.length === 0) {
    return { line: '', area: '', peak: 0, current: 0, avg: 0 };
  }

  const times = points.map((p) => new Date(p.t).getTime());
  const minT = Math.min(...times);
  const maxT = Math.max(...times);
  const spanT = Math.max(1, maxT - minT);
  const peak = Math.max(1, ...points.map((p) => p.players));
  const total = points.reduce((sum, p) => sum + p.players, 0);
  const avg = Math.round(total / points.length);

  const x = (t: number) => pad + ((t - minT) / spanT) * (width - pad * 2);
  const y = (v: number) => height - pad - (v / peak) * (height - pad * 2);

  const coords = points.map((p) => [x(new Date(p.t).getTime()), y(p.players)] as const);
  const line = coords
    .map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`)
    .join(' ');
  const area =
    `${line} L${coords[coords.length - 1][0].toFixed(1)},${height - pad} ` +
    `L${coords[0][0].toFixed(1)},${height - pad} Z`;

  return {
    line,
    area,
    peak,
    current: points[points.length - 1].players,
    avg,
  };
}
