import { getStoreWhoami } from '@/lib/api-client';
import { Hero } from '@/components/home/hero';
import { WipeCountdown } from '@/components/home/wipe-countdown';
import { siteConfig } from '@/lib/site';

export const revalidate = 60;

async function HomePage() {
  const store = await getStoreWhoami();

  return (
    <div className="min-h-[70vh] flex flex-col">
      <Hero
        title={store?.title || siteConfig.name}
        descriptionHtml={store?.description || siteConfig.heroFallback}
      />
      <WipeCountdown />
    </div>
  );
}

export default HomePage;
