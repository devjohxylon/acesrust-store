import type { LeaderboardData } from '@/lib/leaderboard-data';
import type { AchievementDefinition, EngagementProfile } from '@/lib/engagement/types';

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // Loyalty
  { id: 'first_steps', name: 'First Steps', description: 'Log in to the site for the first time', category: 'loyalty', points: 25, icon: '👣' },
  { id: 'regular', name: 'Regular', description: 'Reach a 7-day check-in streak', category: 'loyalty', points: 50, icon: '📅' },
  { id: 'devoted', name: 'Devoted', description: 'Reach a 30-day check-in streak', category: 'loyalty', points: 150, icon: '🔥' },
  { id: 'veteran', name: 'Veteran', description: 'Be a member for 6 months', category: 'loyalty', points: 100, icon: '🎖️' },
  // Supporter
  { id: 'first_purchase', name: 'First Purchase', description: 'Make your first purchase', category: 'supporter', points: 50, icon: '💎' },
  { id: 'big_spender', name: 'Big Spender', description: 'Spend $50 lifetime in the shop', category: 'supporter', points: 150, icon: '💰' },
  { id: 'whale', name: 'Whale', description: 'Spend $200 lifetime in the shop', category: 'supporter', points: 500, icon: '🐋' },
  // Competitor (matched via your Rust name on your profile)
  { id: 'ranked', name: 'Ranked', description: 'Appear on the server leaderboard', category: 'competitor', points: 50, icon: '⚔️' },
  { id: 'top_ten', name: 'Top 10', description: 'Reach the top 10 killers', category: 'competitor', points: 100, icon: '🏅' },
  { id: 'champion', name: 'Champion', description: 'Reach #1 on the killers leaderboard', category: 'competitor', points: 250, icon: '🏆' },
  // Community
  { id: 'early_bird', name: 'Early Bird', description: 'Check in within an hour of a wipe going live', category: 'community', points: 75, icon: '🐦' },
  { id: 'wipe_warrior', name: 'Wipe Day Warrior', description: 'Check in on 5 different wipe days', category: 'community', points: 100, icon: '💪' },
  { id: 'recruiter', name: 'Recruiter', description: 'Refer a friend who makes their first purchase', category: 'community', points: 100, icon: '🤝' },
  { id: 'headhunter', name: 'Headhunter', description: 'Refer 5 friends who make purchases', category: 'community', points: 300, icon: '🎯' },
];

export const ACHIEVEMENT_MAP = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 182;

export type AchievementContext = {
  profile: EngagementProfile;
  leaderboard: LeaderboardData | null;
  /** True when this evaluation happens within 1h after a published wipe went live */
  checkedInWithinWipeHour: boolean;
  now: Date;
};

function leaderboardRank(profile: EngagementProfile, leaderboard: LeaderboardData | null): number | null {
  const name = profile.game_name?.trim().toLowerCase();
  if (!name || !leaderboard) return null;
  const entry = leaderboard.topKillers.find((e) => e.player.trim().toLowerCase() === name);
  return entry ? entry.rank : null;
}

/** Returns achievement ids newly earned given the current context. */
export function evaluateAchievements(
  ctx: AchievementContext,
  alreadyUnlocked: Set<string>
): string[] {
  const { profile, now } = ctx;
  const rank = leaderboardRank(profile, ctx.leaderboard);
  const earned: string[] = [];

  const check = (id: string, condition: boolean) => {
    if (condition && !alreadyUnlocked.has(id)) earned.push(id);
  };

  check('first_steps', true);
  check('regular', profile.streak_count >= 7);
  check('devoted', profile.streak_count >= 30);
  check('veteran', now.getTime() - new Date(profile.created_at).getTime() >= SIX_MONTHS_MS);

  check('first_purchase', profile.lifetime_spend > 0);
  check('big_spender', profile.lifetime_spend >= 50);
  check('whale', profile.lifetime_spend >= 200);

  check('ranked', rank !== null);
  check('top_ten', rank !== null && rank <= 10);
  check('champion', rank === 1);

  check('early_bird', ctx.checkedInWithinWipeHour);
  check('wipe_warrior', profile.wipe_checkin_count >= 5);
  check('recruiter', profile.referral_count >= 1);
  check('headhunter', profile.referral_count >= 5);

  return earned;
}
