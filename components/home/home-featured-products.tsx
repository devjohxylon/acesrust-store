'use client';

import Link from 'next/link';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { useProducts } from '@/hooks/use-api';
import { ProductCard } from '@/components/product/product-card';

export function HomeFeaturedProducts() {
  const { data: products, isLoading } = useProducts({ maxPage: 12, onlyEnabled: true });
  const featured = products?.products.filter((p) => p.featured).slice(0, 4) ?? [];

  if (!isLoading && featured.length === 0) return null;

  return (
    <section className="py-12 relative">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Featured
            </h2>
            <Link href="/shop" className="text-sm text-primary hover:underline flex items-center gap-1">
              View shop
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-72 rounded-xl bg-card border border-border animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} hideFeaturedBadge />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
