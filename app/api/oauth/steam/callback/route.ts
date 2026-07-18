import { NextRequest, NextResponse } from 'next/server';
import { safeCheckoutOrigin } from '@/lib/safe-redirect';

const STEAM_API_URL = 'https://steamcommunity.com/openid/login';

export async function GET(request: NextRequest) {
  const requestOrigin = request.nextUrl.origin;
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('openid.mode');
    const queryOrigin = searchParams.get('origin');

    if (mode === 'id_res') {
      const verifyParams = new URLSearchParams();
      for (const [key, value] of searchParams) {
        verifyParams.append(key, value);
      }
      verifyParams.set('openid.mode', 'check_authentication');

      const verifyResponse = await fetch(STEAM_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: verifyParams,
      });

      const verifyText = await verifyResponse.text();

      if (verifyText.includes('is_valid:true')) {
        const identity = searchParams.get('openid.identity');
        const steamId = identity?.split('/').pop();

        if (steamId && /^\d{15,20}$/.test(steamId)) {
          const baseOrigin = safeCheckoutOrigin(queryOrigin, requestOrigin);
          const redirectUrl = new URL('/checkout', baseOrigin);
          redirectUrl.searchParams.set('steam_id', steamId);
          return NextResponse.redirect(redirectUrl);
        }
      }
    }

    return NextResponse.redirect(
      new URL('/checkout?steam_error=verification_failed', requestOrigin)
    );
  } catch (error) {
    console.error('Steam OAuth error:', error);
    return NextResponse.redirect(
      new URL('/checkout?steam_error=unknown', requestOrigin)
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { identity } = await request.json();

    if (!identity || typeof identity !== 'string') {
      return NextResponse.json({ error: 'No identity provided' }, { status: 400 });
    }

    const steamId = identity.split('/').pop();
    if (!steamId || !/^\d{15,20}$/.test(steamId)) {
      return NextResponse.json({ error: 'Could not extract Steam ID' }, { status: 400 });
    }

    return NextResponse.json({ id: steamId });
  } catch (error) {
    console.error('Steam OAuth POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
