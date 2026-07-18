import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import {
  discordAuthRedirectUri,
  getDiscordClientId,
  getDiscordClientSecret,
} from '@/lib/engagement/discord-oauth';
import { setOAuthStateCookies } from '@/lib/engagement/session';
import { sanitizeReturnPath } from '@/lib/safe-redirect';
import { clientIp, rateLimit } from '@/lib/security';

export async function GET(request: NextRequest) {
  const limited = rateLimit(`discord-login:${clientIp(request)}`, 30, 60_000);
  if (!limited.ok) {
    return NextResponse.redirect(
      new URL('/?login_error=rate_limited', request.nextUrl.origin)
    );
  }

  const clientId = getDiscordClientId();
  const clientSecret = getDiscordClientSecret();

  if (!clientId) {
    return NextResponse.redirect(new URL('/?login_error=not_configured', request.nextUrl.origin));
  }
  if (!clientSecret) {
    return NextResponse.redirect(new URL('/?login_error=no_secret', request.nextUrl.origin));
  }

  const safeReturn = sanitizeReturnPath(request.nextUrl.searchParams.get('return_to'), '/');
  const nonce = randomBytes(16).toString('hex');
  const redirectUri = discordAuthRedirectUri(request.nextUrl.origin);

  const authorize = new URL('https://discord.com/api/oauth2/authorize');
  authorize.searchParams.set('client_id', clientId);
  authorize.searchParams.set('redirect_uri', redirectUri);
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('scope', 'identify');
  authorize.searchParams.set('state', nonce);

  const response = NextResponse.redirect(authorize);
  setOAuthStateCookies(response, nonce, safeReturn, redirectUri);
  return response;
}
