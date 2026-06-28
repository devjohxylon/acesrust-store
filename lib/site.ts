import { shareMetadata } from '@/lib/share-metadata';

export const siteConfig = {
  name: 'Aces Vanilla+',
  title: shareMetadata.title,
  logo: '/aces-logo.png',
  description: shareMetadata.description,
  heroFallback:
    'Support Aces Vanilla+ and unlock a VIP Kit & Priority Queue.',
} as const;
