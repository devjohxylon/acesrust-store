'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Activity, User } from 'lucide-react';
import { useFeed } from '@/hooks/use-engagement';
import { isValidAvatarUrl } from '@/lib/engagement/avatar';

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

type Props = {
  embedded?: boolean;
};

export function ActivityFeed({ embedded = false }: Props) {
  const { data } = useFeed();
  const events = data?.events ?? [];

  const content = (
    <>
      <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-primary" />
        Community Activity
      </h2>

      {events.length === 0 ? (
        <p className="text-sm text-muted rounded-xl border border-border bg-card/40 px-4 py-6 text-center">
          No recent activity yet. Be the first to check in or unlock an achievement.
        </p>
      ) : (
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur divide-y divide-border overflow-hidden">
          {events.slice(0, embedded ? 6 : 8).map((event) => (
            <Link
              key={event.id}
              href={`/profile/${event.discord_id}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors"
            >
              <span className="relative w-8 h-8 rounded-full overflow-hidden bg-border shrink-0">
                {isValidAvatarUrl(event.avatar) ? (
                  <Image src={event.avatar} alt={event.username} fill className="object-cover" unoptimized />
                ) : (
                  <User className="w-4 h-4 absolute inset-0 m-auto text-muted" />
                )}
              </span>
              <p className="text-sm min-w-0 flex-1 truncate">
                <span className="font-semibold text-white">{event.username}</span>{' '}
                <span className="text-foreground/80">{event.message}</span>
              </p>
              <span className="text-[11px] text-muted whitespace-nowrap shrink-0">
                {timeAgo(event.created_at)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );

  if (embedded) return content;

  return (
    <section className="py-8 relative">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">{content}</div>
      </div>
    </section>
  );
}
