'use client';

import { useProducts, useCategories, useStore } from '@/hooks/use-api';
import { useCart } from '@/hooks/use-cart';
import { ProductCard } from '@/components/product/product-card';
import { PageShell } from '@/components/layout/page-shell';
import { PointsBanner } from '@/components/engagement/points-banner';
import { Package, Filter, AlertCircle, RefreshCcw, Loader2, Search } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Category } from '@/lib/schemas';

export default function ShopPage() {
  const cart = useCart();
  const { data: store } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const observerTarget = useRef<HTMLDivElement>(null);
  const processedDataRef = useRef<{ page: number; category: number | null; ids: string }>({ page: 0, category: null, ids: '' });
  
  useEffect(() => {
    cart.clearIfExpired();
  }, []);

  const { data: categories, error: categoriesError } = useCategories();
  const { data: products, isLoading, error: productsError, refetch } = useProducts({ 
    page: currentPage, 
    maxPage: 50, 
    onlyEnabled: true,
    category: selectedCategory ?? undefined,
  });

  const selectedCategoryData = categories?.categories.find(c => c.id === selectedCategory);

  const categoriesByParent = categories?.categories.reduce((acc, cat) => {
    const parentId = cat.parent_id ?? 0;
    if (!acc[parentId]) acc[parentId] = [];
    acc[parentId].push(cat);
    return acc;
  }, {} as Record<number, typeof categories.categories>);

  useEffect(() => {
    setCurrentPage(1);
    setAllProducts([]);
    setHasMore(true);
    processedDataRef.current = { page: 0, category: selectedCategory, ids: '' };
  }, [selectedCategory]);

  const renderCategoryButton = (category: Category) => {
    const isSelected = selectedCategory === category.id;

    return (
      <button
        key={category.id}
        onClick={() => setSelectedCategory(category.id)}
        className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm transition-colors cursor-pointer ${
          isSelected
            ? 'bg-primary text-background border-primary'
            : 'bg-card border-border hover:border-primary/40'
        }`}
      >
        <div className="relative w-8 h-8 rounded overflow-hidden bg-muted/30 shrink-0">
          {category.image ? (
            <Image
              src={category.image}
              alt={category.name}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted">
              <Package className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
        <span className="font-medium">{category.name}</span>
      </button>
    );
  };

  useEffect(() => {
    if (isLoading || productsError || !products?.products) return;
    if (products.products.length === 0) {
      setHasMore(false);
      return;
    }
    
    const dataIds = products.products.map(p => p.id).join(',');
    const dataSignature = { page: currentPage, category: selectedCategory, ids: dataIds };
    
    if (
      processedDataRef.current.page === dataSignature.page &&
      processedDataRef.current.category === dataSignature.category &&
      processedDataRef.current.ids === dataSignature.ids
    ) {
      return;
    }
    
    processedDataRef.current = dataSignature;
    
    setAllProducts(prev => {
      if (currentPage === 1) return products.products;
      const existingIds = new Set(prev.map(p => p.id));
      const newProducts = products.products.filter(p => !existingIds.has(p.id));
      if (newProducts.length === 0) return prev;
      return [...prev, ...newProducts];
    });
    
    setHasMore(products.products.length === 50);
  }, [isLoading, productsError, products?.products, currentPage, selectedCategory]);

  useEffect(() => {
    if (allProducts.length === 0 || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          setCurrentPage(prev => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [allProducts.length, isLoading, hasMore]);

  const filteredProducts = allProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <PageShell
      title="Shop"
      description={store?.title ? `Official store for ${store.title}` : 'Browse kits and VIP packages'}
      width="xl"
    >
      <PointsBanner />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border focus:border-primary focus:outline-none text-sm"
        />
      </div>

      {categoriesError && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Could not load categories. Showing all products.
        </div>
      )}

      {categories && categories.categories.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-white">Categories</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors cursor-pointer ${
                selectedCategory === null
                  ? 'bg-primary text-background border-primary'
                  : 'bg-card border-border hover:border-primary/40'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              All
            </button>
            {(() => {
              const hasSubcategories = 
                selectedCategory !== null && 
                selectedCategoryData && 
                categoriesByParent?.[selectedCategory] && 
                categoriesByParent[selectedCategory]!.length > 0;
              const isSubcategory = selectedCategoryData?.parent_id && selectedCategoryData.parent_id !== 0;
              const parentId = isSubcategory ? selectedCategoryData.parent_id : null;
              
              if (hasSubcategories && selectedCategory !== null) {
                return categoriesByParent[selectedCategory]!.filter(cat => !cat.hide).map(renderCategoryButton);
              } else if (isSubcategory && parentId && categoriesByParent?.[parentId]) {
                return categoriesByParent[parentId]!.filter(cat => !cat.hide).map(renderCategoryButton);
              }
              return categoriesByParent?.[0]?.filter(cat => !cat.hide).map(renderCategoryButton);
            })()}
          </div>
        </div>
      )}

      {isLoading && allProducts.length === 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-80 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : productsError ? (
        <div className="rounded-xl border border-border bg-red-500/10 p-5 text-red-400 space-y-3">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-5 h-5" />
            Could not load products.
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm cursor-pointer"
          >
            <RefreshCcw className="w-4 h-4" />
            Retry
          </button>
        </div>
      ) : filteredProducts.length > 0 ? (
        <>
          <p className="text-xs text-muted">{filteredProducts.length} products</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} hideFeaturedBadge />
            ))}
          </div>
          {hasMore && (
            <div ref={observerTarget} className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
        </>
      ) : allProducts.length > 0 ? (
        <div className="text-center py-16 text-muted text-sm">
          No products match &ldquo;{searchQuery}&rdquo;
        </div>
      ) : (
        <div className="text-center py-16 text-muted text-sm">No products in this category.</div>
      )}
    </PageShell>
  );
}
