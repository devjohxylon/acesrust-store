export type EngagementProfile = {
  discord_id: string;
  username: string;
  avatar: string | null;
  game_name: string | null;
  show_activity: boolean;
  dm_reminders: boolean;
  referred_by: string | null;
  referral_count: number;
  streak_count: number;
  last_checkin_date: string | null;
  total_points: number;
  lifetime_points: number;
  lifetime_spend: number;
  wipe_checkin_count: number;
  created_at: string;
};

export type PointTransaction = {
  id: string;
  discord_id: string;
  amount: number;
  type: string;
  description: string;
  ref: string | null;
  created_at: string;
};

export type ChallengeType = 'checkin_days' | 'purchases' | 'points_earned';

export type Challenge = {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  goal: number;
  points: number;
  starts_at: string;
  ends_at: string;
  active: boolean;
  created_at: string;
};

export type ChallengeWithProgress = Challenge & {
  progress: number;
  completed: boolean;
};

export type Redemption = {
  id: string;
  discord_id: string;
  reward_id: string;
  reward_name: string;
  cost: number;
  status: 'pending' | 'fulfilled' | 'refunded';
  code: string | null;
  created_at: string;
};

export type ActivityEvent = {
  id: string;
  discord_id: string;
  type: string;
  message: string;
  created_at: string;
};

export type AchievementCategory = 'loyalty' | 'supporter' | 'competitor' | 'community';

export type AchievementDefinition = {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  points: number;
  icon: string;
};

export type AchievementWithState = AchievementDefinition & {
  unlocked: boolean;
  unlockedAt: string | null;
  /** Fraction of players who have unlocked this, 0..1 */
  rarity: number;
};

export type RewardDefinition = {
  id: string;
  name: string;
  description: string;
  cost: number;
};

export type SessionUser = {
  id: string;
  username: string;
  avatar: string | null;
};

export type MeResponse = {
  user: SessionUser;
  profile: EngagementProfile;
};
