'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatRWF } from '@/lib/utils/currency';

interface Product {
  _id: string;
  title: string;
  slug: string;
  description: string;
  media: { url: string; type: string; isPrimary: boolean }[];
  pricing: { base: number; compareAt?: number; currency: string };
  inventory: { totalStock: number };
  stats: { avgRating: number; reviewCount: number };
  condition: string;
  sellerId: string;
  sellerName: string;
  sellerSlug: string;
  sellerTier: string;
}

export default function RecentlyViewedPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecentlyViewedProducts() {
      try {
        const response = await fetch('/api/products/recently-viewed');
        const data = await response.json();

        if (data.success) {
          setProducts(data.data);
        } else {
          setError(data.error || 'Failed to fetch recently viewed products');
        }
      } catch (err) {
        console.error('Failed to fetch recently viewed products:', err);
        setError('Failed to fetch recently viewed products');
      } finally {
        setLoading(false);
      }
    }

    fetchRecentlyViewedProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Recently Viewed</h1>
            <p className="text-gray-500 mt-2">Products you've checked out recently</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="aspect-square bg-gray-200 animate-pulse" />
                <div className="p-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Recently Viewed</h1>
            <p className="text-gray-500 mt-2">Products you've checked out recently</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Products</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-hipa-primary text-white rounded-lg hover:bg-hipa-secondary transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Recently Viewed</h1>
            <p className="text-gray-500 mt-2">Products you've checked out recently</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recently Viewed Products</h3>
            <p className="text-gray-500 mb-4">Start browsing products to see them here</p>
            <Link
              href="/"
              className="px-4 py-2 bg-hipa-primary text-white rounded-lg hover:bg-hipa-secondary transition-colors inline-block"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Recently Viewed</h1>
          <p className="text-gray-500 mt-2">Products you've checked out recently</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product) => {
            const imageUrl = product.media?.[0]?.url || '/images/placeholder.png';
            const price = product.pricing?.base || 0;
            const compareAt = product.pricing?.compareAt;
            const discount = compareAt && compareAt > price 
              ? Math.round(((compareAt - price) / compareAt) * 100) 
              : 0;

            return (
              <Link
                key={product._id}
                href={`/product/${product.slug}`}
                className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt={product.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                  {discount > 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      -{discount}%
                    </div>
                  )}
                  {product.condition === 'new' && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                      New
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 text-sm line-clamp-2 group-hover:text-hipa-primary transition-colors mb-1">
                    {product.title}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    by {product.sellerName}
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs text-gray-600">
                        {product.stats?.avgRating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      ({product.stats?.reviewCount || 0} reviews)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-gray-900">
                      {formatRWF(price)}
                    </span>
                    {compareAt && compareAt > price && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatRWF(compareAt)}
                      </span>
                    )}
                  </div>
                  {product.inventory?.totalStock !== undefined && (
                    <p className={`text-xs mt-1 ${product.inventory.totalStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.inventory.totalStock > 0 ? 'In Stock' : 'Out of Stock'}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
