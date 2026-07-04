import 'server-only';
import { engagementDb } from '@/lib/engagement/db';
import { computeCheckin, utcDateString } from '@/lib/engagement/streak';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_MAP,
  evaluateAchievements,
} from '@/lib/engagement/achievements';
import { REWARD_MAP } from '@/lib/engagement/rewards';
import {
  grantLegendRole,
  isLegendRoleConfigured,
  postToFeedChannel,
} from '@/lib/engagement/discord';
import { getAllWipes } from '@/lib/cms-service';
import { getLeaderboard } from '@/lib/cms-service';
import type { LeaderboardData } from '@/lib/leaderboard-data';
import type {
  ActivityEvent,
  AchievementWithState,
  Challenge,
  ChallengeType,
  ChallengeWithProgress,
  EngagementProfile,
  PointTransaction,
  Redemption,
  SessionUser,
} from '@/lib/engagement/types';

const STREAK_MILESTONES = new Set([7, 14, 30, 60, 100]);

const FEED_EMOJI: Record<string, string> = {
  achievement: '🏆',
  streak: '🔥',
  purchase: '💎',
  challenge: '⚡',
  referral: '🤝',
};

async function addFeedEvent(
  profile: EngagementProfile,
  type: string,
  message: string
): Promise<void> {
  if (!profile.show_activity) return;
  await engagementDb()
    .from('activity_events')
    .insert({ discord_id: profile.discord_id, type, message });

  const emoji = FEED_EMOJI[type] ?? '✨';
  await postToFeedChannel(`${emoji} **${profile.username}** ${message}`);
}

export async function upsertProfile(
  user: SessionUser,
  referredBy?: string | null
): Promise<EngagementProfile> {
  const db = engagementDb();

  const { data: existing } = await db
    .from('engagement_profiles')
    .select('*')
    .eq('discord_id', user.id)
    .maybeSingle();

  if (existing) {
    const { data } = await db
      .from('engagement_profiles')
      .update({ username: user.username, avatar: user.avatar })
      .eq('discord_id', user.id)
      .select()
      .single();
    return (data ?? existing) as EngagementProfile;
  }

  // Referral attribution only counts on first signup, never yourself,
  // and only when the referrer actually has a profile.
  let referrer: string | null = null;
  if (referredBy && referredBy !== user.id) {
    const { data: referrerProfile } = await db
      .from('engagement_profiles')
      .select('discord_id')
      .eq('discord_id', referredBy)
      .maybeSingle();
    if (referrerProfile) referrer = referredBy;
  }

  const { data, error } = await db
    .from('engagement_profiles')
    .insert({
      discord_id: user.id,
      username: user.username,
      avatar: user.avatar,
      referred_by: referrer,
    })
    .select()
    .single();
  if (error || !data) throw new Error(`Failed to create profile: ${error?.message}`);

  await unlockAchievements(data as EngagementProfile, ['first_steps']);
  return data as EngagementProfile;
}

export async function getProfile(discordId: string): Promise<EngagementProfile | null> {
  const { data } = await engagementDb()
    .from('engagement_profiles')
    .select('*')
    .eq('discord_id', discordId)
    .maybeSingle();
  return (data as EngagementProfile) ?? null;
}

export async function updateProfileSettings(
  discordId: string,
  settings: { game_name?: string | null; show_activity?: boolean; dm_reminders?: boolean }
): Promise<void> {
  await engagementDb()
    .from('engagement_profiles')
    .update(settings)
    .eq('discord_id', discordId);
}

async function adjustPoints(
  discordId: string,
  amount: number,
  type: string,
  description: string,
  ref: string | null
): Promise<number> {
  const { data, error } = await engagementDb().rpc('adjust_points', {
    p_discord_id: discordId,
    p_amount: amount,
    p_type: type,
    p_description: description,
    p_ref: ref,
  });
  if (error) throw new Error(error.message);
  return data as number;
}

async function unlockAchievements(
  profile: EngagementProfile,
  ids: string[]
): Promise<number> {
  if (ids.length === 0) return 0;
  const db = engagementDb();
  let pointsEarned = 0;

  for (const id of ids) {
    const def = ACHIEVEMENT_MAP.get(id);
    if (!def) continue;

    const { error } = await db
      .from('user_achievements')
      .insert({ discord_id: profile.discord_id, achievement_id: id });
    // Duplicate key means it was already unlocked (e.g. concurrent request).
    if (error) continue;

    await adjustPoints(
      profile.discord_id,
      def.points,
      'achievement',
      `Achievement unlocked: ${def.name}`,
      `ach:${id}:${profile.discord_id}`
    );
    pointsEarned += def.points;
    await addFeedEvent(profile, 'achievement', `unlocked ${def.icon} ${def.name}`);
  }

  return pointsEarned;
}

async function bumpChallenges(
  profile: EngagementProfile,
  type: ChallengeType,
  amount: number
): Promise<number> {
  if (amount <= 0) return 0;
  const db = engagementDb();
  const nowIso = new Date().toISOString();

  const { data: challenges } = await db
    .from('challenges')
    .select('*')
    .eq('type', type)
    .eq('active', true)
    .lte('starts_at', nowIso)
    .gte('ends_at', nowIso);

  let pointsEarned = 0;

  for (const challenge of (challenges ?? []) as Challenge[]) {
    const { data: row } = await db
      .from('challenge_progress')
      .select('*')
      .eq('challenge_id', challenge.id)
      .eq('discord_id', profile.discord_id)
      .maybeSingle();

    if (row?.completed_at) continue;

    const progress = Math.min((row?.progress ?? 0) + amount, challenge.goal);
    const completed = progress >= challenge.goal;

    await db.from('challenge_progress').upsert({
      challenge_id: challenge.id,
      discord_id: profile.discord_id,
      progress,
      completed_at: completed ? nowIso : null,
    });

    if (completed) {
      await adjustPoints(
        profile.discord_id,
        challenge.points,
        'challenge',
        `Challenge completed: ${challenge.title}`,
        `chal:${challenge.id}:${profile.discord_id}`
      );
      pointsEarned += challenge.points;
      await addFeedEvent(profile, 'challenge', `completed the challenge “${challenge.title}”`);
    }
  }

  return pointsEarned;
}

async function wipeContext(now: Date): Promise<{ isWipeDay: boolean; withinWipeHour: boolean }> {
  try {
    const wipes = (await getAllWipes()).filter((w) => w.isPublished);
    const today = utcDateString(now);
    const isWipeDay = wipes.some((w) => utcDateString(new Date(w.scheduledAt)) === today);
    const withinWipeHour = wipes.some((w) => {
      const at = new Date(w.scheduledAt).getTime();
      return now.getTime() >= at && now.getTime() <= at + 60 * 60 * 1000;
    });
    return { isWipeDay, withinWipeHour };
  } catch {
    return { isWipeDay: false, withinWipeHour: false };
  }
}

async function safeLeaderboard(): Promise<LeaderboardData | null> {
  try {
    return await getLeaderboard();
  } catch {
    return null;
  }
}

export type CheckinOutcome = {
  status: 'checked_in' | 'already_checked_in';
  points: number;
  streak: number;
  unlocked: { id: string; name: string; icon: string }[];
};

export async function performCheckin(user: SessionUser): Promise<CheckinOutcome> {
  const db = engagementDb();
  const now = new Date();

  const profile = (await getProfile(user.id)) ?? (await upsertProfile(user));
  const result = computeCheckin(profile.last_checkin_date, profile.streak_count, now);

  if (result.status === 'already_checked_in') {
    return { status: 'already_checked_in', points: 0, streak: result.streak, unlocked: [] };
  }

  const { isWipeDay, withinWipeHour } = await wipeContext(now);
  const today = utcDateString(now);

  const { data: updated } = await db
    .from('engagement_profiles')
    .update({
      streak_count: result.streak,
      last_checkin_date: today,
      wipe_checkin_count: profile.wipe_checkin_count + (isWipeDay ? 1 : 0),
    })
    .eq('discord_id', user.id)
    .select()
    .single();

  const fresh = (updated as EngagementProfile) ?? profile;

  await adjustPoints(
    user.id,
    result.points,
    'daily_checkin',
    `Daily check-in (day ${result.streak})`,
    `checkin:${user.id}:${today}`
  );

  if (STREAK_MILESTONES.has(result.streak)) {
    await addFeedEvent(fresh, 'streak', `hit a ${result.streak}-day check-in streak`);
  }

  const { data: unlockedRows } = await db
    .from('user_achievements')
    .select('achievement_id')
    .eq('discord_id', user.id);
  const alreadyUnlocked = new Set((unlockedRows ?? []).map((r) => r.achievement_id as string));

  const newIds = evaluateAchievements(
    {
      profile: fresh,
      leaderboard: await safeLeaderboard(),
      checkedInWithinWipeHour: withinWipeHour,
      now,
    },
    alreadyUnlocked
  );
  const achievementPoints = await unlockAchievements(fresh, newIds);

  let totalEarned = result.points + achievementPoints;
  totalEarned += await bumpChallenges(fresh, 'checkin_days', 1);
  await bumpChallenges(fresh, 'points_earned', totalEarned);

  return {
    status: 'checked_in',
    points: result.points,
    streak: result.streak,
    unlocked: newIds
      .map((id) => ACHIEVEMENT_MAP.get(id))
      .filter((d) => d !== undefined)
      .map((d) => ({ id: d.id, name: d.name, icon: d.icon })),
  };
}

/**
 * Credit points for a verified purchase (Tip4Serv webhook).
 * Idempotent on the payment reference — retried webhooks never double-credit.
 */
export async function creditPurchase(input: {
  discordId: string;
  amountPaid: number;
  paymentRef: string;
  productName: string;
}): Promise<void> {
  const db = engagementDb();

  const profile = await getProfile(input.discordId);
  if (!profile) return; // Buyer has no site account; nothing to credit.

  const ref = `purchase:${input.paymentRef}`;
  const { data: dupe } = await db
    .from('point_transactions')
    .select('id')
    .eq('ref', ref)
    .maybeSingle();
  if (dupe) return;

  const points = Math.max(1, Math.round(input.amountPaid * 5));
  const newSpend = Number(profile.lifetime_spend) + input.amountPaid;

  const { data: updated } = await db
    .from('engagement_profiles')
    .update({ lifetime_spend: newSpend })
    .eq('discord_id', input.discordId)
    .select()
    .single();
  const fresh = (updated as EngagementProfile) ?? profile;

  await adjustPoints(
    input.discordId,
    points,
    'purchase',
    `Purchase: ${input.productName}`,
    ref
  );

  const isFirstPurchase = Number(profile.lifetime_spend) === 0;
  if (isFirstPurchase) {
    await addFeedEvent(fresh, 'purchase', 'made their first purchase 💎');
    if (fresh.referred_by) {
      await payReferralReward(fresh);
    }
  }

  const { data: unlockedRows } = await db
    .from('user_achievements')
    .select('achievement_id')
    .eq('discord_id', input.discordId);
  const alreadyUnlocked = new Set((unlockedRows ?? []).map((r) => r.achievement_id as string));

  const newIds = evaluateAchievements(
    {
      profile: fresh,
      leaderboard: await safeLeaderboard(),
      checkedInWithinWipeHour: false,
      now: new Date(),
    },
    alreadyUnlocked
  );
  const achievementPoints = await unlockAchievements(fresh, newIds);

  let totalEarned = points + achievementPoints;
  totalEarned += await bumpChallenges(fresh, 'purchases', 1);
  await bumpChallenges(fresh, 'points_earned', totalEarned);
}

const REFERRER_REWARD = 250;
const REFERRED_BONUS = 100;

/** Pays out both sides of a referral when the recruited player first purchases. */
async function payReferralReward(buyer: EngagementProfile): Promise<void> {
  const db = engagementDb();
  const referrer = await getProfile(buyer.referred_by!);
  if (!referrer) return;

  // Idempotent: a buyer can only ever trigger one payout.
  const { data: dupe } = await db
    .from('point_transactions')
    .select('id')
    .eq('ref', `referral:${buyer.discord_id}`)
    .maybeSingle();
  if (dupe) return;

  await adjustPoints(
    referrer.discord_id,
    REFERRER_REWARD,
    'referral',
    `Referral reward: ${buyer.username} made their first purchase`,
    `referral:${buyer.discord_id}`
  );
  await adjustPoints(
    buyer.discord_id,
    REFERRED_BONUS,
    'referral_bonus',
    'Welcome bonus for joining through a referral',
    `referral-bonus:${buyer.discord_id}`
  );

  const { data: updatedReferrer } = await db
    .from('engagement_profiles')
    .update({ referral_count: referrer.referral_count + 1 })
    .eq('discord_id', referrer.discord_id)
    .select()
    .single();
  const freshReferrer = (updatedReferrer as EngagementProfile) ?? referrer;

  await addFeedEvent(freshReferrer, 'referral', 'recruited a new player to the server 🤝');

  const { data: unlockedRows } = await db
    .from('user_achievements')
    .select('achievement_id')
    .eq('discord_id', referrer.discord_id);
  const alreadyUnlocked = new Set((unlockedRows ?? []).map((r) => r.achievement_id as string));
  const newIds = evaluateAchievements(
    {
      profile: freshReferrer,
      leaderboard: null,
      checkedInWithinWipeHour: false,
      now: new Date(),
    },
    alreadyUnlocked
  );
  await unlockAchievements(freshReferrer, newIds);
}

export type SeasonLeaderboardEntry = {
  rank: number;
  discord_id: string;
  username: string;
  avatar: string | null;
  points: number;
};

export type SeasonLeaderboard = {
  seasonStart: string;
  seasonLabel: string;
  top: SeasonLeaderboardEntry[];
  me: SeasonLeaderboardEntry | null;
};

/** The season starts at the most recent published wipe (fallback: start of month). */
async function seasonStart(now: Date): Promise<{ start: Date; label: string }> {
  try {
    const wipes = (await getAllWipes()).filter(
      (w) => w.isPublished && new Date(w.scheduledAt).getTime() <= now.getTime()
    );
    if (wipes.length > 0) {
      const latest = wipes.reduce((a, b) =>
        new Date(a.scheduledAt).getTime() > new Date(b.scheduledAt).getTime() ? a : b
      );
      return { start: new Date(latest.scheduledAt), label: latest.title };
    }
  } catch {
    // CMS unavailable — fall through to the monthly window.
  }
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return { start: monthStart, label: 'This Month' };
}

export async function getSeasonLeaderboard(
  discordId: string | null
): Promise<SeasonLeaderboard> {
  const now = new Date();
  const { start, label } = await seasonStart(now);

  const { data, error } = await engagementDb().rpc('season_points_leaderboard', {
    p_since: start.toISOString(),
    p_limit: 50,
  });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Omit<SeasonLeaderboardEntry, 'rank'>[];
  const ranked = rows.map((row, index) => ({
    ...row,
    points: Number(row.points),
    rank: index + 1,
  }));

  return {
    seasonStart: start.toISOString(),
    seasonLabel: label,
    top: ranked.slice(0, 10),
    me: discordId ? (ranked.find((r) => r.discord_id === discordId) ?? null) : null,
  };
}

export async function redeemReward(
  user: SessionUser,
  rewardId: string
): Promise<{ ok: true; redemption: Redemption } | { ok: false; error: string }> {
  const reward = REWARD_MAP.get(rewardId);
  if (!reward) return { ok: false, error: 'Unknown reward' };

  const profile = await getProfile(user.id);
  if (!profile) return { ok: false, error: 'Profile not found' };
  if (profile.total_points < reward.cost) {
    return { ok: false, error: 'Not enough points' };
  }

  const db = engagementDb();
  const { data, error } = await db
    .from('redemptions')
    .insert({
      discord_id: user.id,
      reward_id: reward.id,
      reward_name: reward.name,
      cost: reward.cost,
    })
    .select()
    .single();
  if (error || !data) return { ok: false, error: 'Failed to create redemption' };

  try {
    await adjustPoints(
      user.id,
      -reward.cost,
      'redemption',
      `Redeemed: ${reward.name}`,
      `redeem:${data.id}`
    );
  } catch {
    // Balance check failed at the database level (e.g. concurrent spend).
    await db.from('redemptions').delete().eq('id', data.id);
    return { ok: false, error: 'Not enough points' };
  }

  let redemption = data as Redemption;

  // The Site Legend role is granted instantly when the bot is configured;
  // everything else stays in the admin fulfillment queue.
  if (reward.id === 'discord_legend' && isLegendRoleConfigured()) {
    const granted = await grantLegendRole(user.id);
    if (granted) {
      const { data: fulfilled } = await db
        .from('redemptions')
        .update({ status: 'fulfilled', code: 'auto: role granted' })
        .eq('id', redemption.id)
        .select()
        .single();
      if (fulfilled) redemption = fulfilled as Redemption;
    }
  }

  return { ok: true, redemption };
}

export async function getFeed(limit = 30): Promise<(ActivityEvent & { username: string; avatar: string | null })[]> {
  const { data } = await engagementDb()
    .from('activity_events')
    .select('*, engagement_profiles(username, avatar)')
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => {
    const joined = row as ActivityEvent & {
      engagement_profiles: { username: string; avatar: string | null } | null;
    };
    return {
      id: joined.id,
      discord_id: joined.discord_id,
      type: joined.type,
      message: joined.message,
      created_at: joined.created_at,
      username: joined.engagement_profiles?.username ?? 'Player',
      avatar: joined.engagement_profiles?.avatar ?? null,
    };
  });
}

export async function getAchievementsState(
  discordId: string | null
): Promise<AchievementWithState[]> {
  const db = engagementDb();

  const [{ count: totalPlayers }, { data: counts }, userRows] = await Promise.all([
    db.from('engagement_profiles').select('*', { count: 'exact', head: true }),
    db.from('user_achievements').select('achievement_id'),
    discordId
      ? db.from('user_achievements').select('achievement_id, unlocked_at').eq('discord_id', discordId)
      : Promise.resolve({ data: [] as { achievement_id: string; unlocked_at: string }[] }),
  ]);

  const countMap = new Map<string, number>();
  for (const row of counts ?? []) {
    const id = row.achievement_id as string;
    countMap.set(id, (countMap.get(id) ?? 0) + 1);
  }

  const unlockedMap = new Map<string, string>();
  for (const row of userRows.data ?? []) {
    unlockedMap.set(row.achievement_id as string, row.unlocked_at as string);
  }

  const players = totalPlayers ?? 0;
  return ACHIEVEMENTS.map((def) => ({
    ...def,
    unlocked: unlockedMap.has(def.id),
    unlockedAt: unlockedMap.get(def.id) ?? null,
    rarity: players > 0 ? (countMap.get(def.id) ?? 0) / players : 0,
  }));
}

export async function getActiveChallenges(
  discordId: string | null
): Promise<ChallengeWithProgress[]> {
  const db = engagementDb();
  const nowIso = new Date().toISOString();

  const { data: challenges } = await db
    .from('challenges')
    .select('*')
    .eq('active', true)
    .lte('starts_at', nowIso)
    .gte('ends_at', nowIso)
    .order('created_at', { ascending: true });

  const list = (challenges ?? []) as Challenge[];
  if (list.length === 0) return [];

  const progressMap = new Map<string, { progress: number; completed: boolean }>();
  if (discordId) {
    const { data: rows } = await db
      .from('challenge_progress')
      .select('challenge_id, progress, completed_at')
      .eq('discord_id', discordId)
      .in('challenge_id', list.map((c) => c.id));
    for (const row of rows ?? []) {
      progressMap.set(row.challenge_id as string, {
        progress: row.progress as number,
        completed: Boolean(row.completed_at),
      });
    }
  }

  return list.map((c) => ({
    ...c,
    progress: progressMap.get(c.id)?.progress ?? 0,
    completed: progressMap.get(c.id)?.completed ?? false,
  }));
}

export async function getRecentTransactions(
  discordId: string,
  limit = 20
): Promise<PointTransaction[]> {
  const { data } = await engagementDb()
    .from('point_transactions')
    .select('*')
    .eq('discord_id', discordId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as PointTransaction[];
}

// ---- Admin operations ----

export async function listAllChallenges(): Promise<Challenge[]> {
  const { data } = await engagementDb()
    .from('challenges')
    .select('*')
    .order('starts_at', { ascending: false });
  return (data ?? []) as Challenge[];
}

export async function createChallenge(input: Omit<Challenge, 'id' | 'created_at'>): Promise<Challenge> {
  const { data, error } = await engagementDb()
    .from('challenges')
    .insert(input)
    .select()
    .single();
  if (error || !data) throw new Error(`Failed to create challenge: ${error?.message}`);
  return data as Challenge;
}

export async function updateChallenge(
  id: string,
  input: Partial<Omit<Challenge, 'id' | 'created_at'>>
): Promise<void> {
  const { error } = await engagementDb().from('challenges').update(input).eq('id', id);
  if (error) throw new Error(`Failed to update challenge: ${error.message}`);
}

export async function deleteChallenge(id: string): Promise<void> {
  await engagementDb().from('challenges').delete().eq('id', id);
}

export async function listRedemptions(): Promise<(Redemption & { username: string })[]> {
  const { data } = await engagementDb()
    .from('redemptions')
    .select('*, engagement_profiles(username)')
    .order('created_at', { ascending: false })
    .limit(100);

  return (data ?? []).map((row) => {
    const joined = row as Redemption & { engagement_profiles: { username: string } | null };
    return { ...joined, username: joined.engagement_profiles?.username ?? 'Player' };
  });
}

export async function resolveRedemption(
  id: string,
  status: 'fulfilled' | 'refunded',
  code: string | null
): Promise<void> {
  const db = engagementDb();
  const { data: redemption } = await db
    .from('redemptions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!redemption) throw new Error('Redemption not found');
  if (redemption.status !== 'pending') throw new Error('Redemption already resolved');

  await db.from('redemptions').update({ status, code }).eq('id', id);

  if (status === 'refunded') {
    await adjustPoints(
      redemption.discord_id as string,
      redemption.cost as number,
      'refund',
      `Refund: ${redemption.reward_name}`,
      `refund:${id}`
    );
  }
}

export async function grantPoints(
  discordId: string,
  amount: number,
  description: string
): Promise<number> {
  return adjustPoints(discordId, amount, 'admin_grant', description, null);
}

/**
 * Players whose streak is alive (checked in yesterday) but who haven't checked
 * in today — the group that would lose their streak at midnight UTC.
 */
export async function getStreakReminderCandidates(
  now: Date
): Promise<Pick<EngagementProfile, 'discord_id' | 'username' | 'streak_count'>[]> {
  const yesterday = utcDateString(new Date(now.getTime() - 24 * 60 * 60 * 1000));

  const { data } = await engagementDb()
    .from('engagement_profiles')
    .select('discord_id, username, streak_count')
    .eq('dm_reminders', true)
    .eq('last_checkin_date', yesterday)
    .gte('streak_count', 2)
    .limit(200);

  return (data ?? []) as Pick<EngagementProfile, 'discord_id' | 'username' | 'streak_count'>[];
}
