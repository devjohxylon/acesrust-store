import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID || process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL('/?login_error=not_configured', request.nextUrl.origin));
  }

  const returnTo = request.nextUrl.searchParams.get('return_to') || '/';
  const safeReturn = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/';
  const nonce = randomBytes(16).toString('hex');

  const authorize = new URL('https://discord.com/api/oauth2/authorize');
  authorize.searchParams.set('client_id', clientId);
  authorize.searchParams.set('redirect_uri', `${request.nextUrl.origin}/api/auth/discord/callback`);
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('scope', 'identify');
  authorize.searchParams.set('state', nonce);

  const response = NextResponse.redirect(authorize);
  response.cookies.set('aces_oauth', `${nonce}:${safeReturn}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600,
  });
  return response;
}
