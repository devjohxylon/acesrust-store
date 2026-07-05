'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Award,
  Calendar,
  Check,
  Coins,
  Copy,
  Flame,
  Pencil,
  ShoppingBag,
  User,
  Users,
} from 'lucide-react';
import { usePublicProfile, useUpdateProfileSettings } from '@/hooks/use-engagement';
import { isValidAvatarUrl } from '@/lib/engagement/avatar';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

const TX_LABELS: Record<string, string> = {
  daily_checkin: 'Check-in',
  purchase: 'Purchase',
  achievement: 'Achievement',
  challenge: 'Challenge',
  redemption: 'Redemption',
  refund: 'Refund',
  admin_grant: 'Adjustment',
  referral: 'Referral',
  referral_bonus: 'Referral Bonus',
};

function ReferralCard({ discordId, recruits }: { discordId: string; recruits: number }) {
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState('');

  useEffect(() => {
    setLink(`${window.location.origin}/?ref=${discordId}`);
  }, [discordId]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the input below is selectable as a fallback.
    }
  }

  return (
    <div className="rounded-2xl bg-gradient-card border border-primary/20 p-6">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        Recruit Friends
      </h2>
      <p className="text-sm text-muted mt-1">
        Share your link. When a friend logs in through it and makes their first purchase, you
        earn <span className="text-primary font-semibold">250 points</span> and they get{' '}
        <span className="text-primary font-semibold">100 points</span>.
      </p>
      <div className="mt-4 flex items-center gap-2">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.target.select()}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-background border border-border text-xs text-muted"
        />
        <button
          type="button"
          onClick={copyLink}
          className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-background text-xs font-semibold hover:bg-primary/90 cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {recruits > 0 && (
        <p className="text-xs text-primary font-medium mt-3">
          🤝 {recruits} {recruits === 1 ? 'player' : 'players'} recruited so far
        </p>
      )}
    </div>
  );
}

export function ProfileView({ discordId }: { discordId: string }) {
  const { data, isLoading, error } = usePublicProfile(discordId);
  const updateSettings = useUpdateProfileSettings();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto h-40 rounded-2xl bg-card border border-border shimmer" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <p className="text-muted">Profile not found.</p>
      </div>
    );
  }

  const { profile, achievements, transactions, isOwner } = data;
  const unlocked = achievements.filter((a) => a.unlocked);

  async function saveGameName() {
    await updateSettings.mutateAsync({ game_name: nameDraft.trim() || null });
    setEditingName(false);
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-card border border-primary/20 p-8">
          <div className="flex items-center gap-5">
            <span className="relative w-20 h-20 rounded-full overflow-hidden bg-border shrink-0 border-2 border-primary/40">
              {isValidAvatarUrl(profile.avatar) ? (
                <Image src={profile.avatar} alt={profile.username} fill className="object-cover" unoptimized />
              ) : (
                <User className="w-8 h-8 absolute inset-0 m-auto text-muted" />
              )}
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-white truncate">{profile.username}</h1>
              <p className="text-sm text-muted mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Member since {formatDate(profile.created_at)}
              </p>
              {isOwner && (
                <div className="mt-2">
                  {editingName ? (
                    <span className="flex items-center gap-2">
                      <input
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                        placeholder="Your Rust name"
                        className="px-2 py-1 rounded-md bg-background border border-border text-xs w-44"
                        maxLength={64}
                      />
                      <button
                        type="button"
                        onClick={saveGameName}
                        disabled={updateSettings.isPending}
                        className="text-xs text-primary hover:underline cursor-pointer"
                      >
                        Save
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setNameDraft(profile.game_name ?? '');
                        setEditingName(true);
                      }}
                      className="text-xs text-muted hover:text-foreground flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      {profile.game_name
                        ? `Rust name: ${profile.game_name}`
                        : 'Set your Rust name to unlock leaderboard achievements'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl bg-card border border-border p-4 text-center">
            <Coins className="w-5 h-5 text-primary mx-auto mb-1.5" />
            <p className="text-xl font-bold text-white">{profile.total_points.toLocaleString()}</p>
            <p className="text-xs text-muted">Points</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-4 text-center">
            <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1.5" />
            <p className="text-xl font-bold text-white">{profile.streak_count}</p>
            <p className="text-xs text-muted">Day Streak</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-4 text-center">
            <Award className="w-5 h-5 text-secondary mx-auto mb-1.5" />
            <p className="text-xl font-bold text-white">
              {unlocked.length}/{achievements.length}
            </p>
            <p className="text-xs text-muted">Achievements</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-4 text-center">
            <ShoppingBag className="w-5 h-5 text-accent mx-auto mb-1.5" />
            <p className="text-xl font-bold text-white">
              {profile.lifetime_points.toLocaleString()}
            </p>
            <p className="text-xs text-muted">Lifetime Points</p>
          </div>
        </div>

        {/* Achievements summary */}
        <div className="rounded-xl border border-border bg-card/40 p-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Achievements</h2>
            <p className="text-sm text-muted mt-1">
              {unlocked.length} of {achievements.length} unlocked
            </p>
            {unlocked.length > 0 && (
              <div className="flex gap-2 mt-3">
                {unlocked.slice(0, 5).map((a) => (
                  <span key={a.id} className="text-xl" title={a.name}>
                    {a.icon}
                  </span>
                ))}
              </div>
            )}
          </div>
          <Link
            href="/achievements"
            className="text-sm text-primary hover:underline whitespace-nowrap shrink-0"
          >
            View all →
          </Link>
        </div>

        {/* Referral card (owner only) */}
        {isOwner && <ReferralCard discordId={profile.discord_id} recruits={profile.referral_count} />}

        {/* Own activity (owner only) */}
        {isOwner && transactions.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-3">Recent Points Activity</h2>
            <div className="rounded-xl border border-border bg-card/60 divide-y divide-border overflow-hidden">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-4 py-2.5 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{tx.description}</p>
                    <p className="text-[11px] text-muted">
                      {TX_LABELS[tx.type] ?? tx.type} ·{' '}
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-bold whitespace-nowrap ${
                      tx.amount >= 0 ? 'text-primary' : 'text-muted'
                    }`}
                  >
                    {tx.amount >= 0 ? '+' : ''}
                    {tx.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings (owner only) */}
        {isOwner && (
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={profile.show_activity}
                onChange={(e) => updateSettings.mutate({ show_activity: e.target.checked })}
                className="accent-[var(--primary)]"
              />
              Show my milestones in the public community feed
            </label>
            <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={profile.dm_reminders}
                onChange={(e) => updateSettings.mutate({ dm_reminders: e.target.checked })}
                className="accent-[var(--primary)]"
              />
              DM me on Discord before my check-in streak expires
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
