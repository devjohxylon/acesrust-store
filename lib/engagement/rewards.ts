import type { RewardDefinition } from '@/lib/engagement/types';

export const REWARDS: RewardDefinition[] = [
  {
    id: 'discount_5',
    name: '5% Shop Discount',
    description: 'A one-time 5% discount code for the shop, delivered by the team.',
    cost: 500,
  },
  {
    id: 'discount_10',
    name: '10% Shop Discount',
    description: 'A one-time 10% discount code for the shop, delivered by the team.',
    cost: 900,
  },
  {
    id: 'discord_legend',
    name: 'Site Legend Discord Role',
    description: 'The exclusive Site Legend role on the Aces Vanilla+ Discord.',
    cost: 1500,
  },
];

export const REWARD_MAP = new Map(REWARDS.map((r) => [r.id, r]));
