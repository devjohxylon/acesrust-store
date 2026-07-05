'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';

const MESSAGES: Record<string, string> = {
  not_configured:
    'Discord login is not configured yet. Add DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET in Vercel.',
  missing_code: 'Login was interrupted. Please try again.',
  state_mismatch:
    'Login session expired or your site URL changed mid-flow. Use the same domain you bookmarked (e.g. acesrust.com, not www).',
  token_exchange:
    'Discord rejected the login. In the Discord developer portal, add this redirect URL exactly: https://acesrust.com/api/auth/discord/callback',
  get_user: 'Could not load your Discord profile. Please try again.',
  no_secret:
    'Server is missing AUTH_SECRET (or DISCORD_CLIENT_SECRET). Add AUTH_SECRET in Vercel and redeploy.',
  unknown: 'Something went wrong during login. Please try again.',
};

/**
 * Surfaces ?login_error=… from the OAuth callback and refreshes engagement
 * state after a successful return (no error param).
 */
export function LoginErrorBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const error = searchParams.get('login_error');
    if (error) {
      setMessage(MESSAGES[error] ?? MESSAGES.unknown);
      setVisible(true);

      const url = new URL(window.location.href);
      url.searchParams.delete('login_error');
      const next = `${url.pathname}${url.search}`;
      router.replace(next as Parameters<typeof router.replace>[0]);
      return;
    }

    if (searchParams.get('logged_in')) {
      queryClient.invalidateQueries({ queryKey: ['engagement', 'me'] });
      const url = new URL(window.location.href);
      url.searchParams.delete('logged_in');
      const next = `${url.pathname}${url.search}`;
      router.replace(next as Parameters<typeof router.replace>[0]);
    }
  }, [searchParams, router, queryClient]);

  useEffect(() => {
    if (!visible) return;
    const id = setTimeout(() => setVisible(false), 12_000);
    return () => clearTimeout(id);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[min(100%,28rem)] px-4">
      <div className="rounded-xl border border-primary/40 bg-card shadow-2xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Login failed</p>
          <p className="text-xs text-muted mt-1">{message}</p>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="text-xs text-muted hover:text-foreground shrink-0 cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
