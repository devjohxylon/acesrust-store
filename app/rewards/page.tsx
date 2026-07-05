import { PointsRewardsSection } from '@/components/engagement/points-rewards-section';

export const metadata = { title: 'Rewards — Aces Vanilla+' };

export default function RewardsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <PointsRewardsSection variant="page" />
      </div>
    </div>
  );
}
