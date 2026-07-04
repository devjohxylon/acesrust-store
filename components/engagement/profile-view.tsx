'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Award, Calendar, Coins, Flame, Pencil, ShoppingBag, User } from 'lucide-react';
import { usePublicProfile, useUpdateProfileSettings } from '@/hooks/use-engagement';

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
};

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
              {profile.avatar ? (
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

        {/* Achievements */}
        <div>
          <h2 className="text-lg font-bold mb-3">Achievements</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {achievements.map((a) => (
              <div
                key={a.id}
                title={`${a.name} — ${a.description}`}
                className={`rounded-xl border p-3 text-center transition-colors ${
                  a.unlocked
                    ? 'bg-card border-primary/40'
                    : 'bg-card/40 border-border opacity-40 grayscale'
                }`}
              >
                <p className="text-2xl">{a.icon}</p>
                <p className="text-[10px] font-medium text-white mt-1 leading-tight">{a.name}</p>
              </div>
            ))}
          </div>
        </div>

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
