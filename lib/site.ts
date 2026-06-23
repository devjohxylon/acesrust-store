import { shareMetadata } from '@/lib/share-metadata';

export const siteConfig = {
  name: 'Aces Vanilla+',
  title: shareMetadata.title,
  logo: '/aces-logo.png',
  description: shareMetadata.description,
  tagline: 'Rust Console Store',
  heroFallback:
    'Support Aces Vanilla+ on console and unlock VIP kits, priority queue, and exclusive in-game perks.',
  ctaFallback:
    'Browse kits and ranks built for our vanilla+ Rust Console experience.',
} as const;
