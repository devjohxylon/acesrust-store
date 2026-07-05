import 'server-only';
import { config } from '@/lib/config';

/** Server-side Discord OAuth credentials (never expose the secret to the client). */
export function getDiscordClientId(): string {
  return (
    process.env.DISCORD_CLIENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID?.trim() ||
    ''
  );
}

export function getDiscordClientSecret(): string {
  return process.env.DISCORD_CLIENT_SECRET?.trim() || '';
}

/**
 * OAuth callback URL — must be identical in the authorize URL and token exchange,
 * and must match an entry in the Discord developer portal exactly.
 */
export function discordAuthRedirectUri(requestOrigin?: string): string {
  const override = process.env.DISCORD_AUTH_REDIRECT_URI?.trim().replace(/\/$/, '');
  if (override) return override;

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  if (
    configured &&
    configured.startsWith('http') &&
    !configured.includes('localhost') &&
    !configured.includes('127.0.0.1')
  ) {
    return `${configured}/api/auth/discord/callback`;
  }

  if (requestOrigin) {
    return `${requestOrigin.replace(/\/$/, '')}/api/auth/discord/callback`;
  }

  return `${config.app.siteUrl.replace(/\/$/, '')}/api/auth/discord/callback`;
}

export type DiscordTokenErrorCode =
  | 'token_exchange'
  | 'token_exchange_secret'
  | 'token_exchange_client'
  | 'token_exchange_redirect';

/** Map Discord's OAuth error JSON to a short code for the login error banner. */
export function classifyDiscordTokenError(status: number, body: string): DiscordTokenErrorCode {
  try {
    const data = JSON.parse(body) as { error?: string; error_description?: string };
    const err = data.error ?? '';
    const desc = (data.error_description ?? '').toLowerCase();

    if (err === 'invalid_client') return 'token_exchange_secret';
    if (err === 'invalid_grant' && desc.includes('redirect_uri')) return 'token_exchange_redirect';
    if (err === 'invalid_grant' && desc.includes('client')) return 'token_exchange_client';
  } catch {
    // body wasn't JSON
  }

  if (status === 401) return 'token_exchange_secret';
  return 'token_exchange';
}
