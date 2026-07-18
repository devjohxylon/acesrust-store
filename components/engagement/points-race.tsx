'use client';

import Image from 'next/image';
import Link from 'next/link';
import { User } from 'lucide-react';
import { useMe, usePointsLeaderboard } from '@/hooks/use-engagement';
import { isValidAvatarUrl } from '@/lib/engagement/avatar';

export function PointsRace() {
  const { data } = usePointsLeaderboard();
  const { data: me } = useMe();

  const board = data?.leaderboard;
  const myId = me?.user?.id;
  const inTop = Boolean(myId && board?.top.some((e) => e.discord_id === myId));

  if (!board) {
    return (
      <div className="rounded-lg border border-border bg-card/40 px-5 py-8 text-center text-sm text-muted">
        Points race unavailable — login with Discord to compete.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card/50 overflow-hidden">
      <div className="px-4 sm:px-5 py-3.5 border-b border-border flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted mb-0.5">Season</p>
          <h2 className="text-base font-semibold text-white tracking-tight">Points race</h2>
          <p className="text-xs text-muted mt-0.5">Since {board.seasonLabel}</p>
        </div>
        <Link
          href="/rewards"
          className="text-xs text-muted hover:text-white transition-colors shrink-0"
        >
          Earn points
        </Link>
      </div>

      {board.top.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted">
          No entries yet. Check in or shop to earn points.
        </div>
      ) : (
        <div className="divide-y divide-border/70">
          {board.top.map((entry) => {
            const isMe = entry.discord_id === myId;
            return (
              <Link
                key={entry.discord_id}
                href={`/profile/${entry.discord_id}`}
                className={`flex items-center gap-3 px-4 sm:px-5 py-2.5 hover:bg-white/[0.03] transition-colors ${
                  isMe ? 'bg-white/[0.03]' : ''
                }`}
              >
                <span
                  className={`w-7 font-mono text-xs tabular-nums shrink-0 ${
                    entry.rank <= 3 ? 'text-white' : 'text-muted'
                  }`}
                >
                  {String(entry.rank).padStart(2, '0')}
                </span>
                <span className="relative w-7 h-7 rounded-full overflow-hidden bg-border shrink-0">
                  {isValidAvatarUrl(entry.avatar) ? (
                    <Image
                      src={entry.avatar}
                      alt={entry.username}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <User className="w-3.5 h-3.5 absolute inset-0 m-auto text-muted" />
                  )}
                </span>
                <span className="text-sm text-white truncate flex-1">
                  {entry.username}
                  {isMe ? <span className="text-[10px] text-muted ml-1.5">you</span> : null}
                </span>
                <span className="text-sm font-mono tabular-nums text-primary/90 whitespace-nowrap">
                  {entry.points.toLocaleString()}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {board.me && !inTop && (
        <div className="px-4 sm:px-5 py-2.5 border-t border-border bg-white/[0.02] flex items-center gap-3 text-sm">
          <span className="w-7 font-mono text-xs text-muted tabular-nums shrink-0">
            {String(board.me.rank).padStart(2, '0')}
          </span>
          <span className="flex-1 text-white truncate">
            {board.me.username}
            <span className="text-[10px] text-muted ml-1.5">you</span>
          </span>
          <span className="font-mono tabular-nums text-primary/90">
            {board.me.points.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
