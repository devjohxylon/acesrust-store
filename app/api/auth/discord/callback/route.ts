import { NextRequest, NextResponse } from 'next/server';
import {
  applySessionCookie,
  clearOAuthStateCookies,
} from '@/lib/engagement/session';
import {
  classifyDiscordTokenError,
  getDiscordClientId,
  getDiscordClientSecret,
  discordAuthRedirectUri,
} from '@/lib/engagement/discord-oauth';
import { isEngagementConfigured } from '@/lib/engagement/db';
import { upsertProfile } from '@/lib/engagement/service';
import { sanitizeReturnPath } from '@/lib/safe-redirect';
import { safeCompare } from '@/lib/security';

const DISCORD_API = 'https://discord.com/api/v10';

function fail(origin: string, reason: string) {
  return NextResponse.redirect(new URL(`/?login_error=${reason}`, origin));
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const stored = request.cookies.get('aces_oauth')?.value;

  if (!code || !state || !stored) return fail(origin, 'missing_code');

  const clientId = getDiscordClientId();
  const clientSecret = getDiscordClientSecret();
  if (!clientId) return fail(origin, 'not_configured');
  if (!clientSecret) return fail(origin, 'no_secret');

  const separator = stored.indexOf(':');
  const nonce = separator === -1 ? stored : stored.slice(0, separator);
  const returnTo = sanitizeReturnPath(
    separator === -1 ? '/' : stored.slice(separator + 1) || '/',
    '/'
  );
  if (!safeCompare(nonce, state)) return fail(origin, 'state_mismatch');

  // Must match the redirect_uri from the authorize step byte-for-byte.
  const redirectUri =
    request.cookies.get('aces_oauth_redirect')?.value ??
    discordAuthRedirectUri(origin);

  try {
    const tokenResponse = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const detail = await tokenResponse.text();
      const errorCode = classifyDiscordTokenError(tokenResponse.status, detail);
      console.error('Discord token exchange failed:', {
        status: tokenResponse.status,
        redirectUri,
        clientIdSet: Boolean(clientId),
        detail,
      });
      return fail(origin, errorCode);
    }

    const { access_token: accessToken } = await tokenResponse.json();
    const userResponse = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userResponse.ok) return fail(origin, 'get_user');

    const discordUser = await userResponse.json();
    const avatar = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=128`
      : null;

    const user = {
      id: String(discordUser.id),
      username: String(discordUser.global_name || discordUser.username || 'Player'),
      avatar,
    };

    if (isEngagementConfigured()) {
      try {
        const referredBy = request.cookies.get('aces_ref')?.value ?? null;
        await upsertProfile(user, referredBy);
      } catch (error) {
        console.error('Profile upsert failed (login continues):', error);
      }
    }

    const landing = new URL(returnTo, origin);
    landing.searchParams.set('logged_in', '1');
    const response = NextResponse.redirect(landing);
    if (!applySessionCookie(response, user)) return fail(origin, 'no_secret');

    clearOAuthStateCookies(response);
    response.cookies.delete('aces_ref');
    return response;
  } catch (error) {
    console.error('Discord login error:', error);
    return fail(origin, 'unknown');
  }
}
