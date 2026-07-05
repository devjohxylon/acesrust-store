'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Crown, User, Zap } from 'lucide-react';
import { useMe, usePointsLeaderboard } from '@/hooks/use-engagement';
import { isValidAvatarUrl } from '@/lib/engagement/avatar';

const MEDALS = ['🥇', '🥈', '🥉'];

export function PointsRace() {
  const { data } = usePointsLeaderboard();
  const { data: me } = useMe();

  const board = data?.leaderboard;
  const myId = me?.user?.id;
  const inTop = Boolean(myId && board?.top.some((e) => e.discord_id === myId));

  if (!board) {
    return (
      <div className="rounded-xl border border-border bg-card/40 px-5 py-8 text-center text-sm text-muted">
        Points race unavailable — login with Discord to compete.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-white flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-primary" />
            Points Race
          </h2>
          <p className="text-xs text-muted mt-0.5">Since {board.seasonLabel}</p>
        </div>
        <Link href="/rewards" className="text-xs text-primary hover:underline">
          Earn points →
        </Link>
      </div>

      {board.top.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted">
          No entries yet. Check in or shop to earn points.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {board.top.map((entry) => {
            const isMe = entry.discord_id === myId;
            return (
              <Link
                key={entry.discord_id}
                href={`/profile/${entry.discord_id}`}
                className={`flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors ${
                  isMe ? 'bg-primary/5' : ''
                }`}
              >
                <span className="w-6 text-center shrink-0 text-sm">
                  {entry.rank <= 3 ? MEDALS[entry.rank - 1] : entry.rank}
                </span>
                <span className="relative w-7 h-7 rounded-full overflow-hidden bg-border shrink-0">
                  {isValidAvatarUrl(entry.avatar) ? (
                    <Image src={entry.avatar} alt={entry.username} fill className="object-cover" unoptimized />
                  ) : (
                    <User className="w-3.5 h-3.5 absolute inset-0 m-auto text-muted" />
                  )}
                </span>
                <span className="text-sm text-white truncate flex-1">
                  {entry.username}
                  {entry.rank === 1 && <Crown className="w-3 h-3 text-yellow-400 inline ml-1" />}
                  {isMe && <span className="text-[10px] text-primary ml-1">(you)</span>}
                </span>
                <span className="text-sm font-medium text-primary whitespace-nowrap">
                  {entry.points.toLocaleString()}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {board.me && !inTop && (
        <div className="px-4 py-2.5 border-t border-border bg-primary/5 flex items-center gap-3 text-sm">
          <span className="w-6 text-center text-muted shrink-0">{board.me.rank}</span>
          <span className="flex-1 text-white">
            {board.me.username} <span className="text-[10px] text-primary">(you)</span>
          </span>
          <span className="font-medium text-primary">{board.me.points.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
