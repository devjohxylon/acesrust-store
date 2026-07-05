import { getStoreWhoami } from '@/lib/api-client';
import { Hero } from '@/components/home/hero';
import { PurchasesTicker } from '@/components/home/purchases-ticker';
import { WipeCountdown } from '@/components/home/wipe-countdown';
import { HomeFeaturedProducts } from '@/components/home/home-featured-products';
import { QuickLinks } from '@/components/layout/quick-links';
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

      <QuickLinks />

      <HomeFeaturedProducts />

      <WipeCountdown />
    </div>
  );
}

export default HomePage;
