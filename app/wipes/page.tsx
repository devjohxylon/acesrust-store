import type { Metadata } from 'next';
import { Calendar } from 'lucide-react';
import { getPublishedWipes } from '@/lib/cms-service';
import { WIPE_TYPE_LABELS } from '@/lib/cms-types';
import { siteConfig } from '@/lib/site';

export const metadata: Metadata = {
  title: `Wipe Schedule | ${siteConfig.name}`,
  description: 'Upcoming map, blueprint, and full wipes for Astral Vanilla+.',
};

export const revalidate = 60;

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

export default async function WipesPage() {
  const wipes = await getPublishedWipes();

  return (
    <div className="min-h-screen py-12 md:py-16">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              Wipe Schedule
            </h1>
            <p className="text-muted">
              Upcoming wipes for {siteConfig.name}
            </p>
          </div>

          {wipes.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center">
              <Calendar className="w-10 h-10 text-muted mx-auto mb-4" />
              <p className="text-muted">No upcoming wipes scheduled yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {wipes.map((wipe) => (
                <article
                  key={wipe.id}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h2 className="text-xl font-semibold text-white">{wipe.title}</h2>
                    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                      {WIPE_TYPE_LABELS[wipe.wipeType]}
                    </span>
                  </div>
                  <p className="text-sky-400 font-medium">{formatWipeDate(wipe.scheduledAt)}</p>
                  {wipe.description && (
                    <p className="text-muted mt-3 leading-relaxed">{wipe.description}</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
