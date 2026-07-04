import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { addPurchase } from '@/lib/cms-service';
import { safeCompare } from '@/lib/security';
import { isEngagementConfigured } from '@/lib/engagement/db';
import { creditPurchase } from '@/lib/engagement/service';

type Tip4ServWebhook = {
  event?: string;
  mode?: string;
  data?: {
    id?: string | number;
    payment_id?: string | number;
    transaction_id?: string | number;
    amount?: { total_paid?: number; currency?: string };
    user?: {
      username?: string;
      discord_id?: string | number;
      discord_username?: string;
      steam_username?: string;
    };
    basket?: { name?: string }[];
  };
};

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.TIP4SERV_WEBHOOK_SECRET;
  if (!secret) return false;

  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key') ?? request.headers.get('x-webhook-secret') ?? '';
  return safeCompare(key, secret);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rawBody = await request.text();
  let body: Tip4ServWebhook;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Only surface successful live payments on the ticker.
  if (body.event !== 'payment.success' || body.mode === 'test') {
    return NextResponse.json({ ok: true, ignored: body.event ?? 'unknown' });
  }

  const user = body.data?.user;
  const basket = body.data?.basket ?? [];
  const buyer = user?.discord_username || user?.username || user?.steam_username || 'Someone';
  const firstProduct = basket[0]?.name ?? 'a package';
  const product =
    basket.length > 1 ? `${firstProduct} +${basket.length - 1} more` : firstProduct;
  const amountPaid = body.data?.amount?.total_paid ?? 0;

  await addPurchase({
    buyer,
    product,
    amount: amountPaid,
    currency: body.data?.amount?.currency ?? 'USD',
  });

  // Credit engagement points when the buyer has a site profile.
  const discordId = user?.discord_id;
  if (isEngagementConfigured() && discordId && amountPaid > 0) {
    // Retried webhooks carry the same payload, so a body hash is a stable
    // fallback ref when no payment id is present.
    const paymentRef = String(
      body.data?.payment_id ??
        body.data?.transaction_id ??
        body.data?.id ??
        createHash('sha256').update(rawBody).digest('hex')
    );

    try {
      await creditPurchase({
        discordId: String(discordId),
        amountPaid,
        paymentRef,
        productName: product,
      });
    } catch (error) {
      // The ticker entry already succeeded; never fail the webhook over points.
      console.error('Failed to credit purchase points:', error);
    }
  }

  return NextResponse.json({ ok: true });
}
