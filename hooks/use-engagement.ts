'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AchievementWithState,
  ChallengeWithProgress,
  EngagementProfile,
  PointTransaction,
  Redemption,
  SessionUser,
} from '@/lib/engagement/types';
import type { CheckinOutcome, SeasonLeaderboard } from '@/lib/engagement/service';

export type FeedEvent = {
  id: string;
  discord_id: string;
  type: string;
  message: string;
  created_at: string;
  username: string;
  avatar: string | null;
};

type MeData = { user: SessionUser | null; profile: EngagementProfile | null };

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

async function postJson<T>(url: string, body?: unknown, method = 'POST'): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export function useMe() {
  return useQuery<MeData>({
    queryKey: ['engagement', 'me'],
    queryFn: () => getJson('/api/engagement/me'),
    staleTime: 30_000,
  });
}

export function useCheckin() {
  const queryClient = useQueryClient();
  return useMutation<CheckinOutcome, Error>({
    mutationFn: () => postJson('/api/engagement/checkin'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement'] });
    },
  });
}

export function useFeed() {
  return useQuery<{ events: FeedEvent[] }>({
    queryKey: ['engagement', 'feed'],
    queryFn: () => getJson('/api/engagement/feed'),
    refetchInterval: 60_000,
  });
}

export function useChallenges() {
  return useQuery<{ challenges: ChallengeWithProgress[] }>({
    queryKey: ['engagement', 'challenges'],
    queryFn: () => getJson('/api/engagement/challenges'),
    staleTime: 60_000,
  });
}

export function useAchievements() {
  return useQuery<{ achievements: AchievementWithState[] }>({
    queryKey: ['engagement', 'achievements'],
    queryFn: () => getJson('/api/engagement/achievements'),
    staleTime: 60_000,
  });
}

export function usePublicProfile(discordId: string | null) {
  return useQuery<{
    profile: EngagementProfile;
    achievements: AchievementWithState[];
    transactions: PointTransaction[];
    isOwner: boolean;
  }>({
    queryKey: ['engagement', 'profile', discordId],
    queryFn: () => getJson(`/api/engagement/profile/${discordId}`),
    enabled: Boolean(discordId),
  });
}

export function useRedeem() {
  const queryClient = useQueryClient();
  return useMutation<{ redemption: Redemption }, Error, string>({
    mutationFn: (rewardId) => postJson('/api/engagement/redeem', { rewardId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement'] });
    },
  });
}

export function useUpdateProfileSettings() {
  const queryClient = useQueryClient();
  return useMutation<
    { ok: boolean },
    Error,
    { game_name?: string | null; show_activity?: boolean; dm_reminders?: boolean }
  >({
    mutationFn: (settings) => postJson('/api/engagement/me', settings, 'PATCH'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement'] });
    },
  });
}

export function usePointsLeaderboard() {
  return useQuery<{ leaderboard: SeasonLeaderboard | null }>({
    queryKey: ['engagement', 'points-leaderboard'],
    queryFn: () => getJson('/api/engagement/points-leaderboard'),
    staleTime: 60_000,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => postJson('/api/auth/logout'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement'] });
    },
  });
}
