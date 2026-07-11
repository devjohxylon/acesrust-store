import { getStoreWhoami } from '@/lib/api-client';
import { Hero } from '@/components/home/hero';
import { WipeCountdown } from '@/components/home/wipe-countdown';
import { ServerActivityPanel } from '@/components/server/server-activity-panel';
import { siteConfig } from '@/lib/site';

export const revalidate = 60;

async function HomePage() {
  const store = await getStoreWhoami();

  return (
    <div className="min-h-screen flex flex-col">
      <Hero
        title={store?.title || siteConfig.name}
        descriptionHtml={store?.description || siteConfig.heroFallback}
      />

      <section className="pb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <ServerActivityPanel variant="home" />
          </div>
        </div>
      </section>

      <WipeCountdown />
    </div>
  );
}

export default HomePage;
