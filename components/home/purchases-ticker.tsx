'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';

type Purchase = { id: string; buyer: string; product: string; at: string };

export function PurchasesTicker() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch('/api/purchases', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { purchases: Purchase[] };
        if (active) setPurchases(data.purchases ?? []);
      } catch {
        // ignore
      }
    }
    load();
    const id = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  if (purchases.length === 0) return null;

  // Duplicate the list so the marquee scrolls seamlessly.
  const items = [...purchases, ...purchases];

  return (
    <div className="border-y border-border bg-card/40 backdrop-blur overflow-hidden">
      <div className="relative flex overflow-hidden">
        <div className="ticker-track flex items-center gap-8 py-2.5 whitespace-nowrap">
          {items.map((p, i) => (
            <span key={`${p.id}-${i}`} className="inline-flex items-center gap-2 text-sm">
              <ShoppingBag className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-white font-medium">{p.buyer}</span>
              <span className="text-muted">purchased</span>
              <span className="text-primary font-medium">{p.product}</span>
              <span className="text-border">•</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
