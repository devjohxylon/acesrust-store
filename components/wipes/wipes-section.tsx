import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';
import { getPublishedWipes } from '@/lib/cms-service';
import { WIPE_TYPE_LABELS } from '@/lib/cms-types';

function formatWipeDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(iso));
}

type WipesSectionProps = {
  showViewAll?: boolean;
};

export async function WipesSection({ showViewAll = true }: WipesSectionProps) {
  const wipes = await getPublishedWipes();
  const upcoming = wipes.slice(0, 3);

  if (upcoming.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-20 relative">
      <div className="absolute inset-0 grid-pattern opacity-15" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Upcoming Wipes
            </h2>
            <p className="text-muted">
              Plan your wipe day — server schedules and details below.
            </p>
          </div>

          <div className="space-y-4">
            {upcoming.map((wipe) => (
              <div
                key={wipe.id}
                className="rounded-xl border border-border bg-card p-5 flex gap-4"
              >
                <div className="hidden sm:flex w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-white">{wipe.title}</h3>
                    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                      {WIPE_TYPE_LABELS[wipe.wipeType]}
                    </span>
                  </div>
                  <p className="text-sm text-sky-400">{formatWipeDate(wipe.scheduledAt)}</p>
                  {wipe.description && (
                    <p className="text-sm text-muted mt-2">{wipe.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {showViewAll && wipes.length > 0 && (
            <div className="mt-8 text-center">
              <Link
                href="/wipes"
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
              >
                View full schedule
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
