'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  media: Array<{ url: string; type: string }> | string[];
  pricing: {
    base: number;
    compareAt?: number;
    currency: string;
  };
  inventory: {
    totalStock: number;
    lowStockThreshold: number;
    trackInventory: boolean;
    allowBackorder: boolean;
  };
  status: string;
  category: {
    primary: string;
    secondary?: string;
    tertiary?: string;
    path: string[];
  };
  tags: string[];
  variants: Array<{
    id: string;
    name: string;
    options: string[];
  }>;
  stats: {
    views: number;
    addedToCart: number;
    purchased: number;
    conversionRate: number;
    avgRating: number;
    reviewCount: number;
    wishlistCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      const token = useAuthStore.getState().token;
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/seller/products/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }

      const data = await response.json();
      setProduct(data.product);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const token = useAuthStore.getState().token;
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/seller/products/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      router.push('/seller/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      draft: 'bg-gray-100 text-gray-700',
      paused: 'bg-yellow-100 text-yellow-700',
      archived: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStockColor = (stock: number, threshold: number) => {
    if (stock === 0) return 'text-red-600';
    if (stock <= threshold) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/seller/products"
            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Product not found</p>
          <Link
            href="/seller/products"
            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/seller/products"
                className="text-sm text-teal-600 hover:underline mb-2 block"
              >
                ← Back to Products
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
              <p className="text-sm text-gray-500">Product Details</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/seller/products/${product.id}/edit`}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Product
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Images */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {product.media && product.media.length > 0 ? (
                  product.media.map((media, index) => (
                    <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={typeof media === 'string' ? media : media.url}
                        alt={`${product.title} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No images available
                  </div>
                )}
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="mt-1 text-gray-900">{product.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Category</label>
                    <p className="mt-1 text-gray-900">
                      {product.category.primary}
                      {product.category.secondary && ` > ${product.category.secondary}`}
                      {product.category.tertiary && ` > ${product.category.tertiary}`}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className="mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                        {product.status}
                      </span>
                    </p>
                  </div>
                </div>
                {product.tags && product.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tags</label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {product.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Variants</h2>
                <div className="space-y-3">
                  {product.variants.map((variant, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">{variant.name}</p>
                      <p className="text-sm text-gray-500">{variant.options && Array.isArray(variant.options) ? variant.options.join(', ') : 'No options'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Base Price</label>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {formatCurrency(product.pricing.base)}
                  </p>
                </div>
                {product.pricing.compareAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Compare at Price</label>
                    <p className="mt-1 text-lg text-gray-500 line-through">
                      {formatCurrency(product.pricing.compareAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Inventory */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Stock</label>
                  <p className={`mt-1 text-2xl font-bold ${getStockColor(product.inventory.totalStock, product.inventory.lowStockThreshold)}`}>
                    {product.inventory.totalStock}
                  </p>
                  {product.inventory.totalStock === 0 && (
                    <span className="text-xs text-red-500">Out of stock</span>
                  )}
                  {product.inventory.totalStock > 0 && product.inventory.totalStock <= product.inventory.lowStockThreshold && (
                    <span className="text-xs text-yellow-500">Low stock</span>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Low Stock Threshold</label>
                  <p className="mt-1 text-gray-900">{product.inventory.lowStockThreshold}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Views</span>
                  <span className="font-medium text-gray-900">{product.stats.views}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Added to Cart</span>
                  <span className="font-medium text-gray-900">{product.stats.addedToCart}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Purchased</span>
                  <span className="font-medium text-gray-900">{product.stats.purchased}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Conversion Rate</span>
                  <span className="font-medium text-gray-900">{product.stats.conversionRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Rating</span>
                  <span className="font-medium text-gray-900">{product.stats.avgRating}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Reviews</span>
                  <span className="font-medium text-gray-900">{product.stats.reviewCount}</span>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Timestamps</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="mt-1 text-gray-900">
                    {new Date(product.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="mt-1 text-gray-900">
                    {new Date(product.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Product</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{product.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
