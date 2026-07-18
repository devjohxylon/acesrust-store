import { NextRequest, NextResponse } from 'next/server';
import { safeCheckoutOrigin, sanitizeReturnPath } from '@/lib/safe-redirect';

const DISCORD_API_URL = 'https://discord.com/api/v10';
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

export async function GET(request: NextRequest) {
  const requestOrigin = request.nextUrl.origin;
  try {
    const code = request.nextUrl.searchParams.get('code');
    const state = request.nextUrl.searchParams.get('state');

    let baseOrigin = requestOrigin;
    let returnPath = '/checkout';

    if (state && state.includes('|')) {
      const parts = state.split('|');
      baseOrigin = safeCheckoutOrigin(parts[0], requestOrigin);
      if (parts.length === 2) {
        returnPath = sanitizeReturnPath(parts[1], '/checkout');
      }
    } else if (state) {
      baseOrigin = safeCheckoutOrigin(state, requestOrigin);
    }

    if (!code) {
      return NextResponse.redirect(new URL('/checkout?discord_error=no_code', baseOrigin));
    }

    const redirectUri = `${baseOrigin}/api/oauth/discord/callback`;

    const tokenResponse = await fetch(`${DISCORD_API_URL}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID || '',
        client_secret: CLIENT_SECRET || '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.redirect(
        new URL('/checkout?discord_error=token_exchange', baseOrigin)
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const userResponse = await fetch(`${DISCORD_API_URL}/users/@me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userResponse.ok) {
      return NextResponse.redirect(new URL('/checkout?discord_error=get_user', baseOrigin));
    }

    const userData = await userResponse.json();
    const redirectUrl = new URL(returnPath, baseOrigin);
    redirectUrl.searchParams.set('discord_id', userData.id);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Discord OAuth error:', error);
    return NextResponse.redirect(
      new URL('/checkout?discord_error=unknown', requestOrigin)
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    const redirectUri =
      process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI ||
      `${request.nextUrl.origin}/api/oauth/discord/callback`;

    const tokenResponse = await fetch(`${DISCORD_API_URL}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID || '',
        client_secret: CLIENT_SECRET || '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.json({ error: 'Token exchange failed' }, { status: 400 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const userResponse = await fetch(`${DISCORD_API_URL}/users/@me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userResponse.ok) {
      return NextResponse.json({ error: 'Failed to get user info' }, { status: 400 });
    }

    const userData = await userResponse.json();
    return NextResponse.json({ id: userData.id });
  } catch (error) {
    console.error('Discord OAuth POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
