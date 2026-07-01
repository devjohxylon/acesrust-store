import { NextResponse } from 'next/server';
import { getPurchases } from '@/lib/cms-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const purchases = await getPurchases();
    // Only expose display-safe fields.
    const safe = purchases.map((p) => ({
      id: p.id,
      buyer: p.buyer,
      product: p.product,
      at: p.at,
    }));
    return NextResponse.json(
      { purchases: safe },
      { headers: { 'Cache-Control': 'public, max-age=20' } }
    );
  } catch {
    return NextResponse.json({ error: 'Failed to load purchases' }, { status: 500 });
  }
}
