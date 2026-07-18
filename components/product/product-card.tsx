'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Zap, Check, ArrowRight } from 'lucide-react';
import type { ProductGeneral } from '@/lib/schemas';
import { useCart } from '@/hooks/use-cart';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useProduct } from '@/hooks/use-api';
import { CustomFieldsModal } from './custom-fields-modal';
import { useRouter } from 'next/navigation';

type ProductCardProps = {
  product: ProductGeneral;
  hideFeaturedBadge?: boolean;
};

export function ProductCard({ product, hideFeaturedBadge = false }: ProductCardProps) {
  const cart = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [needsCustomFields, setNeedsCustomFields] = useState(false);
  const { data: detailedProduct } = useProduct(product.slug);
  
  const isOutOfStock = typeof product.stock === 'number' && product.stock === 0;

  useEffect(() => {
    // Check if product has custom fields, is a subscription that allows onetime purchase, is a donation product, or requires server selection
    if (detailedProduct) {
      const hasCustomFields = 'custom_fields' in detailedProduct && detailedProduct.custom_fields && detailedProduct.custom_fields.length > 0;
      const isSubscriptionWithChoice = detailedProduct.subscription && detailedProduct.onetime_sub === true;
      const isDonation = 'donation' in detailedProduct && detailedProduct.donation === true;
      const hasServerChoice = 'server_choice' in detailedProduct && detailedProduct.server_choice === true;
      setNeedsCustomFields(hasCustomFields || isSubscriptionWithChoice || isDonation || hasServerChoice);
    }
  }, [detailedProduct]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();

    // Prevent adding if out of stock or stock is 0
    if (typeof product.stock === 'number' && product.stock === 0) return;

    // If product needs modal (custom fields or subscription type choice), open it
    if (needsCustomFields && detailedProduct) {
      setShowModal(true);
      return;
    }

    // For subscriptions without custom fields, default to recurring and go to cart
    const subscriptionType = product.subscription ? 'recurring' : undefined;
    // Prevent adding more than stock (if stock is defined)
    const currentInCart = cart.items.find((item) => item.product.id === product.id)?.quantity || 0;
    if (typeof product.stock === 'number' && currentInCart + 1 > product.stock) {
      // Optionally show a toast or error here
      setAdded(false);
      return;
    }
    cart.addItem(product, 1, {}, subscriptionType);
    
    // If it's a subscription without custom fields, redirect directly to cart
    if (product.subscription && !needsCustomFields) {
      router.push('/cart');
      return;
    }
    
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  // Strip HTML tags from description
  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').trim();
  };

  const cardClass = `group relative h-full rounded-xl bg-card border border-border transition-all duration-300 overflow-hidden ${
    isOutOfStock
      ? 'opacity-60 grayscale cursor-not-allowed'
      : 'hover:border-primary'
  }`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cardClass}
    >
      {/* Badges */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5 items-end max-w-[70%]">
        {product.subscription && product.recurring_discount === false && product.old_price && product.old_price > product.price && product.period_num && product.duration_periodicity && (
          <span className="px-2 py-1 text-[10px] sm:text-xs font-semibold rounded-full border border-primary/70 text-primary bg-background/60">
            {product.period_num} {product.duration_periodicity}{product.period_num > 1 ? 's' : ''} at ${product.old_price.toFixed(2)}
          </span>
        )}
        {product.featured && !hideFeaturedBadge && (
          <span className="px-2 py-1 text-[10px] sm:text-xs font-semibold rounded-full border border-primary/70 text-primary bg-background/60">
            Featured
          </span>
        )}
        {product.percent_off && product.percent_off > 0 && product.price > 0 && (
          <span className="px-2 py-1 text-[10px] sm:text-xs font-semibold rounded-full border border-primary/70 text-primary bg-background/60">
            -{product.percent_off}%
          </span>
        )}
        {typeof product.stock === 'number' && (
          <span className="px-2 py-1 text-[10px] sm:text-xs font-semibold rounded-full border border-red-500/70 text-red-400 bg-background/60">
            {product.stock === 0 ? 'Out of stock' : `Stock: ${product.stock}`}
          </span>
        )}
      </div>

      {isOutOfStock ? (
        <div className="relative w-full h-36 sm:h-48 bg-gradient-card overflow-hidden">
          {product.image ? (
            <Image src={product.image} alt={product.name} fill className="object-contain" unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Zap className="w-12 h-12 sm:w-16 sm:h-16 text-primary/30" />
            </div>
          )}
        </div>
      ) : (
        <Link href={`/product/${product.slug}`} className="block touch-manipulation">
          <div className="relative w-full h-36 sm:h-48 bg-gradient-card overflow-hidden">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-contain transition-transform duration-300 group-hover:scale-105"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Zap className="w-12 h-12 sm:w-16 sm:h-16 text-primary/30" />
              </div>
            )}
          </div>
        </Link>
      )}

      <div className="p-3 sm:p-4 flex flex-col gap-2 sm:gap-3">
        {isOutOfStock ? (
          <h3 className="font-semibold text-sm sm:text-lg line-clamp-2">{product.name}</h3>
        ) : (
          <Link href={`/product/${product.slug}`} className="touch-manipulation">
            <h3 className="font-semibold text-sm sm:text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
        )}

        <div className="hidden sm:block min-h-[44px] text-sm text-muted">
          {product.small_description ? (
            <p className="line-clamp-2">{stripHtml(product.small_description)}</p>
          ) : (
            <span className="invisible">placeholder</span>
          )}
        </div>

        <div className="flex items-end justify-between gap-2 mt-auto">
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-lg sm:text-2xl font-bold text-primary">
                {product.price > 0 ? `$${product.price.toFixed(2)}` : 'Free'}
              </span>
              {product.subscription && product.recurring_discount === false && product.old_price && product.old_price > product.price ? (
                <>
                  <span className="text-xs sm:text-sm text-muted">then</span>
                  <span className="text-xs sm:text-sm text-muted">${product.old_price.toFixed(2)}</span>
                  {product.period_num && product.duration_periodicity && (
                    <span className="text-xs sm:text-sm text-muted">
                      / {product.period_num > 1 ? `${product.period_num} ` : ''}{product.duration_periodicity}
                      {product.period_num > 1 ? 's' : ''}
                    </span>
                  )}
                </>
              ) : (
                <>
                  {product.subscription && product.period_num && product.duration_periodicity && (
                    <span className="text-xs sm:text-sm text-muted">
                      / {product.period_num > 1 ? `${product.period_num} ` : ''}{product.duration_periodicity}
                      {product.period_num > 1 ? 's' : ''}
                    </span>
                  )}
                  {product.old_price && product.old_price > 0 && product.old_price > product.price ? (
                    <span className="text-xs sm:text-sm text-muted line-through">
                      ${product.old_price.toFixed(2)}
                    </span>
                  ) : null}
                </>
              )}
            </div>
            {product.price > 0 && (
              <p className="text-[10px] sm:text-[11px] text-primary/90 font-medium">
                +{Math.max(1, Math.round(product.price * 5))} pts
              </p>
            )}
          </div>

          <motion.button
            type="button"
            onClick={handleAddToCart}
            whileTap={{ scale: 0.9 }}
            animate={added ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
            className={`shrink-0 w-11 h-11 sm:w-auto sm:h-auto p-2.5 sm:p-2 rounded-lg text-background transition-all cursor-pointer touch-manipulation ${
              isOutOfStock
                ? 'bg-muted/50 cursor-not-allowed'
                : added
                  ? 'bg-green-500 glow-primary'
                  : 'bg-primary hover:bg-primary/90 glow-primary'
            }`}
            aria-label={product.subscription && !needsCustomFields ? 'Subscribe' : 'Add to cart'}
            disabled={isOutOfStock}
          >
            {added ? (
              <Check className="w-5 h-5" />
            ) : product.subscription && !needsCustomFields ? (
              <ArrowRight className="w-5 h-5" />
            ) : (
              <ShoppingCart className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </div>

      {needsCustomFields && detailedProduct && (
        <CustomFieldsModal
          product={detailedProduct}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </motion.div>
  );
}
