import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ServerStatusWidget } from '@/components/server/server-status';

type HeroProps = {
  title: string;
  descriptionHtml: string;
};

export function Hero({ title, descriptionHtml }: HeroProps) {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-5">
            <ServerStatusWidget variant="pill" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            {title}
          </h1>

          <div
            className="text-base md:text-lg text-muted mb-8 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-background font-semibold hover:bg-primary/90 transition-colors"
            >
              Browse Shop
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/community"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-border bg-card text-white font-medium hover:border-primary/40 transition-colors"
            >
              Community Hub
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
