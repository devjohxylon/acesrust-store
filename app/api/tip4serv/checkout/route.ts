import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { CheckoutRequestSchema, CheckoutResponseSchema } from '@/lib/schemas';
import { isAllowedOrigin } from '@/lib/safe-redirect';
import { clientIp, rateLimit } from '@/lib/security';

function clampRedirect(
  value: string | undefined,
  requestOrigin: string
): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (!isAllowedOrigin(url.origin, requestOrigin)) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(`checkout:${clientIp(request)}`, 20, 60_000);
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
    const store = searchParams.get('store');
    const requestOrigin = request.nextUrl.origin;

    if (!store || !/^\d+$/.test(store)) {
      return NextResponse.json(
        { error: 'Missing required parameter: store' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validatedBody = CheckoutRequestSchema.parse(body);
    validatedBody.redirect_success_checkout = clampRedirect(
      validatedBody.redirect_success_checkout,
      requestOrigin
    );
    validatedBody.redirect_canceled_checkout = clampRedirect(
      validatedBody.redirect_canceled_checkout,
      requestOrigin
    );
    validatedBody.redirect_pending_checkout = clampRedirect(
      validatedBody.redirect_pending_checkout,
      requestOrigin
    );

    const url = `${config.api.baseUrl}/store/checkout?store=${store}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.api.key ? { Authorization: `Bearer ${config.api.key}` } : {}),
      },
      body: JSON.stringify(validatedBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Checkout error:', errorText);
      console.error('Checkout request was:', JSON.stringify(validatedBody, null, 2));
      
      // Try to parse error as JSON to extract error message
      let errorMessage = 'Failed to create checkout';
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // Not JSON, use as-is
        errorMessage = errorText.substring(0, 200);
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse checkout response as JSON:', parseError);
      console.error('Response was:', responseText.substring(0, 1000));
      return NextResponse.json(
        { error: 'Invalid response from checkout API', details: 'Response is not valid JSON' },
        { status: 500 }
      );
    }
    
    // Parse and validate the checkout response
    const validated = CheckoutResponseSchema.parse(data);

    return NextResponse.json(validated);
  } catch (error) {
    console.error('Error creating checkout:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
