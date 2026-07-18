import { NextRequest, NextResponse } from 'next/server';
import { fetchFromTip4Serv } from '@/lib/api-client';
import { PrecheckoutRequestSchema, CheckoutResponseSchema } from '@/lib/schemas';
import { isAllowedOrigin } from '@/lib/safe-redirect';
import { clientIp, rateLimit } from '@/lib/security';

function safeRedirectUrl(
  value: string,
  requestOrigin: string
): string | null {
  try {
    const url = new URL(value);
    if (!isAllowedOrigin(url.origin, requestOrigin)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(`precheckout:${clientIp(request)}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'Too many checkout attempts. Please wait a moment.' },
      {
        status: 429,
        headers: { 'Retry-After': String(limited.retryAfterSeconds) },
      }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const storeId = searchParams.get('store');
    const redirect = searchParams.get('redirect');
    const requestOrigin = request.nextUrl.origin;

    if (!storeId || !/^\d+$/.test(storeId)) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = PrecheckoutRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid checkout payload' },
        { status: 400 }
      );
    }

    const success = safeRedirectUrl(parsed.data.redirect_success_checkout, requestOrigin);
    const canceled = safeRedirectUrl(parsed.data.redirect_canceled_checkout, requestOrigin);
    const pending = safeRedirectUrl(parsed.data.redirect_pending_checkout, requestOrigin);
    if (!success || !canceled || !pending) {
      return NextResponse.json(
        { error: 'Invalid redirect URLs' },
        { status: 400 }
      );
    }

    const payload = {
      ...parsed.data,
      redirect_success_checkout: success,
      redirect_canceled_checkout: canceled,
      redirect_pending_checkout: pending,
    };

    const response = await fetchFromTip4Serv(
      '/store/checkout?store=' + storeId + (redirect ? '&redirect=true' : ''),
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      let errorMessage = 'Failed to process checkout';
      const errorText = await response.text().catch(() => '');

      console.error('[precheckout] error response', {
        status: response.status,
        body: errorText?.slice(0, 500),
      });

      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          errorMessage = errorJson.error;
        } else if (errorJson.details) {
          errorMessage = errorJson.details;
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch {
        if (errorText) {
          errorMessage = errorText.slice(0, 200);
        }
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    const validated = CheckoutResponseSchema.parse(data);

    return NextResponse.json(validated);
  } catch (error) {
    console.error('Error in precheckout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
