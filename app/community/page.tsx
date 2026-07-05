import type { Metadata } from 'next';
import { CommunityHub } from '@/components/engagement/community-hub';
import { siteConfig } from '@/lib/site';

export const metadata: Metadata = {
  title: `Community | ${siteConfig.name}`,
  description: 'Weekly challenges, points race, community activity, and rewards.',
};

export default function CommunityPage() {
  return <CommunityHub />;
}
