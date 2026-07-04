import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getStoreWhoami } from '@/lib/api-client';
import { ProductsGrid } from '@/components/home/products-grid';
import { Hero } from '@/components/home/hero';
import { PurchasesTicker } from '@/components/home/purchases-ticker';
import { WipeCountdown } from '@/components/home/wipe-countdown';
import { PopGraph } from '@/components/server/pop-graph';
import { LeaderboardSection } from '@/components/leaderboard/leaderboard-section';
import { WipesSection } from '@/components/wipes/wipes-section';
import { ChallengeStrip } from '@/components/engagement/challenge-strip';
import { ActivityFeed } from '@/components/engagement/activity-feed';
import { siteConfig } from '@/lib/site';

export const revalidate = 60;

async function HomePage() {
  const store = await getStoreWhoami();

  return (
    <div className="min-h-screen">
      <Hero
        title={store?.title || siteConfig.name}
        descriptionHtml={store?.description || siteConfig.heroFallback}
      />

      <PurchasesTicker />

      <WipeCountdown />

      <ChallengeStrip />

      {/* Products Grid - Client Component */}
      <ProductsGrid />

      <LeaderboardSection showViewAll={false} />

      <ActivityFeed />

      <section className="pb-4 relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            <PopGraph />
          </div>
        </div>
      </section>

      <WipesSection showViewAll={false} />

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center p-12 rounded-2xl bg-gradient-card border border-primary/20">
            <h2 className="text-4xl font-bold mb-8">Ready to Get Started?</h2>
            <Link href="/shop">
              <button className="px-8 py-4 rounded-xl bg-primary hover:bg-primary/90 text-background font-semibold text-lg transition-all glow-primary hover:scale-105 inline-flex items-center gap-2 cursor-pointer">
                Explore Shop
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
