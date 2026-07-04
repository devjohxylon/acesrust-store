'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Crown, User, Zap } from 'lucide-react';
import { useMe, usePointsLeaderboard } from '@/hooks/use-engagement';

const MEDALS = ['🥇', '🥈', '🥉'];

export function PointsRace() {
  const { data } = usePointsLeaderboard();
  const { data: me } = useMe();

  const board = data?.leaderboard;
  if (!board || board.top.length === 0) return null;

  const myId = me?.user?.id;
  const inTop = Boolean(myId && board.top.some((e) => e.discord_id === myId));

  return (
    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Points Race
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Points earned since {board.seasonLabel} — resets every wipe
          </p>
        </div>
        <Link href="/rewards" className="text-xs text-primary hover:underline">
          How to earn points →
        </Link>
      </div>

      <div className="divide-y divide-border">
        {board.top.map((entry) => {
          const isMe = entry.discord_id === myId;
          return (
            <Link
              key={entry.discord_id}
              href={`/profile/${entry.discord_id}`}
              className={`flex items-center gap-3 px-5 py-2.5 hover:bg-white/5 transition-colors ${
                isMe ? 'bg-primary/10' : ''
              }`}
            >
              <span className="w-8 text-center shrink-0">
                {entry.rank <= 3 ? (
                  <span className="text-lg">{MEDALS[entry.rank - 1]}</span>
                ) : (
                  <span className="text-sm text-muted font-medium">{entry.rank}</span>
                )}
              </span>
              <span className="relative w-8 h-8 rounded-full overflow-hidden bg-border shrink-0">
                {entry.avatar ? (
                  <Image src={entry.avatar} alt={entry.username} fill className="object-cover" unoptimized />
                ) : (
                  <User className="w-4 h-4 absolute inset-0 m-auto text-muted" />
                )}
              </span>
              <span className="text-sm font-medium text-white truncate flex-1 flex items-center gap-1.5">
                {entry.username}
                {entry.rank === 1 && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
                {isMe && <span className="text-[10px] text-primary font-bold">(you)</span>}
              </span>
              <span className="text-sm font-bold text-primary whitespace-nowrap">
                {entry.points.toLocaleString()} pts
              </span>
            </Link>
          );
        })}
      </div>

      {board.me && !inTop && (
        <div className="px-5 py-2.5 border-t border-border bg-primary/5 flex items-center gap-3">
          <span className="w-8 text-center text-sm text-muted font-medium shrink-0">
            {board.me.rank}
          </span>
          <span className="text-sm font-medium text-white flex-1">
            {board.me.username} <span className="text-[10px] text-primary font-bold">(you)</span>
          </span>
          <span className="text-sm font-bold text-primary">
            {board.me.points.toLocaleString()} pts
          </span>
        </div>
      )}
    </div>
  );
}
