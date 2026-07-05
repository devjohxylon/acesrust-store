import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Gift } from 'lucide-react';
import { ChallengeStrip } from '@/components/engagement/challenge-strip';
import { ActivityFeed } from '@/components/engagement/activity-feed';
import { PointsRace } from '@/components/engagement/points-race';
import { siteConfig } from '@/lib/site';

export const metadata: Metadata = {
  title: `Community | ${siteConfig.name}`,
  description: 'Weekly challenges, points race, community activity, and rewards.',
};

export default function CommunityPage() {
  return (
    <div className="min-h-screen py-12 md:py-16">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Community</h1>
            <p className="text-muted max-w-xl mx-auto">
              Earn points through check-ins, purchases, and challenges. Compete each wipe and
              redeem rewards in the shop.
            </p>
          </div>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white">Points Race</h2>
              <Link href="/rewards" className="text-xs text-primary hover:underline">
                How to earn →
              </Link>
            </div>
            <PointsRace />
          </section>

          <div className="grid gap-8 lg:grid-cols-2">
            <section>
              <ChallengeStrip embedded />
            </section>
            <section>
              <ActivityFeed embedded />
            </section>
          </div>

          <Link
            href="/rewards"
            className="block rounded-2xl border border-primary/25 bg-gradient-card p-6 hover:border-primary/40 transition-colors group"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-white flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  Rewards Store
                </h2>
                <p className="text-sm text-muted mt-1">
                  Redeem your points for VIP kits, discounts, and more.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
