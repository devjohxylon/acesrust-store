import { NextRequest, NextResponse } from 'next/server';
import { addPurchase } from '@/lib/cms-service';
import { safeCompare } from '@/lib/security';

type Tip4ServWebhook = {
  event?: string;
  mode?: string;
  data?: {
    amount?: { total_paid?: number; currency?: string };
    user?: { username?: string; discord_username?: string; steam_username?: string };
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

  let body: Tip4ServWebhook;
  try {
    body = await request.json();
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

  await addPurchase({
    buyer,
    product,
    amount: body.data?.amount?.total_paid ?? 0,
    currency: body.data?.amount?.currency ?? 'USD',
  });

  return NextResponse.json({ ok: true });
}
