import { shareMetadata } from '@/lib/share-metadata';

export const siteConfig = {
  name: 'Astral Vanilla+',
  title: shareMetadata.title,
  logo: '/astral-logo.png',
  description: shareMetadata.description,
  heroFallback:
    'Support Astral Vanilla+ and unlock a VIP Kit & Priority Queue.',
} as const;
