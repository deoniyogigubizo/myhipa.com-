'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface Store {
  _id: string;
  store: {
    name: string;
    storeName: string;
    slug: string;
    logo?: string;
    banner?: string;
    bio?: string;
    location?: string;
    categories?: string[];
  };
  tier: string;
  stats: {
    totalSales: number;
    avgRating: number;
    productCount: number;
    totalRevenue: number;
  };
  verifiedAt: string;
  kycStatus: string;
  productCount: number;
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    category: '',
    tier: '',
    search: '',
    sortBy: 'stats.totalRevenue',
    sortOrder: 'desc'
  });

  useEffect(() => {
    fetchStores();
  }, [pagination.page, filters]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.category && { category: filters.category }),
        ...(filters.tier && { tier: filters.tier }),
        ...(filters.search && { search: filters.search }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });
      
      const response = await fetch(`/api/stores?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setStores(data.data);
        setPagination(prev => ({
          ...prev,
          ...data.pagination
        }));
      } else {
        setError(data.error || 'Failed to load stores');
      }
    } catch (err) {
      setError('Failed to connect to database');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: '', name: 'All Categories' },
    { id: 'electronics', name: 'Electronics' },
    { id: 'fashion', name: 'Fashion' },
    { id: 'home', name: 'Home & Living' },
    { id: 'food', name: 'Food & Grocery' },
    { id: 'beauty', name: 'Beauty & Health' },
    { id: 'sports', name: 'Sports' },
    { id: 'toys', name: 'Toys & Games' },
  ];

  const tiers = [
    { id: '', name: 'All Tiers' },
    { id: 'gold', name: 'Gold' },
    { id: 'silver', name: 'Silver' },
    { id: 'pro', name: 'Pro' },
    { id: 'standard', name: 'Standard' },
  ];

  const sortOptions = [
    { value: 'stats.totalRevenue', label: 'Revenue' },
    { value: 'stats.totalSales', label: 'Total Sales' },
    { value: 'stats.avgRating', label: 'Rating' },
    { value: 'createdAt', label: 'Newest' },
  ];

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'gold': return 'bg-yellow-500 text-white';
      case 'silver': return 'bg-gray-400 text-white';
      case 'pro': return 'bg-purple-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f5f5dc' }}>
      <Navbar />
      
      {/* Hero Section - Black background */}
      <div className="relative py-16 px-4" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#f5f5dc' }}>
            Discover Stores
          </h1>
          <p className="text-lg md:text-xl max-w-2xl" style={{ color: '#87ceeb' }}>
            Explore verified sellers across Africa. Find trusted suppliers and artisans 
            offering quality products on Hipa.
          </p>
        </div>
        
        {/* Skyblue accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: '#87ceeb' }} />
      </div>

      {/* Filters Section - Beige background */}
      <div className="py-6 px-4" style={{ backgroundColor: '#faebd7' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search stores..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  borderColor: '#87ceeb', 
                  backgroundColor: '#fffdd0',
                  color: '#1a1a1a'
                }}
              />
            </div>
            
            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="px-4 py-2 rounded-lg border-2"
              style={{ 
                borderColor: '#87ceeb', 
                backgroundColor: '#fffdd0',
                color: '#1a1a1a'
              }}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            
            {/* Tier Filter */}
            <select
              value={filters.tier}
              onChange={(e) => setFilters(prev => ({ ...prev, tier: e.target.value }))}
              className="px-4 py-2 rounded-lg border-2"
              style={{ 
                borderColor: '#87ceeb', 
                backgroundColor: '#fffdd0',
                color: '#1a1a1a'
              }}
            >
              {tiers.map(tier => (
                <option key={tier.id} value={tier.id}>{tier.name}</option>
              ))}
            </select>
            
            {/* Sort */}
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="px-4 py-2 rounded-lg border-2"
              style={{ 
                borderColor: '#87ceeb', 
                backgroundColor: '#fffdd0',
                color: '#1a1a1a'
              }}
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>Sort by {opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="px-4 py-4" style={{ backgroundColor: '#fffdd0' }}>
        <div className="max-w-7xl mx-auto">
          <p style={{ color: '#2d2d2d' }}>
            Showing <strong>{stores.length}</strong> of <strong>{pagination.total}</strong> stores
          </p>
        </div>
      </div>

      {/* Main Content - Stores Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                <div className="h-24" style={{ backgroundColor: '#2d2d2d' }} />
                <div className="p-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-xl" style={{ color: '#1a1a1a' }}>{error}</p>
            <button 
              onClick={fetchStores}
              className="mt-4 px-6 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: '#1a1a1a' }}
            >
              Try Again
            </button>
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl" style={{ border: '2px solid #87ceeb' }}>
            <p className="text-xl" style={{ color: '#1a1a1a' }}>No stores found</p>
            <p className="mt-2" style={{ color: '#5bbce4' }}>Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {stores.map((store) => (
              <Link 
                key={store._id}
                href={`/store/${store.store.slug}`}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
                style={{ border: '1px solid #e5e5e5' }}
              >
                {/* Banner */}
                <div className="h-24 relative" style={{ backgroundColor: '#2d2d2d' }}>
                  {store.store.banner ? (
                    <img src={store.store.banner} alt={store.store.storeName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl">🏪</span>
                    </div>
                  )}
                  
                  {/* Tier Badge */}
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${getTierBadgeColor(store.tier)}`}>
                    {store.tier?.toUpperCase()}
                  </div>
                  
                  {/* Verified Badge */}
                  {store.kycStatus === 'verified' && (
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-500 text-white">
                        ✓ Verified
                      </span>
                    </div>
                  )}
                </div>

                {/* Store Info */}
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#f5f5dc' }}>
                      {store.store.logo ? (
                        <img src={store.store.logo} alt={store.store.storeName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-xl">🏪</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate" style={{ color: '#1a1a1a' }}>
                        {store.store.storeName}
                      </h3>
                      <p className="text-sm truncate" style={{ color: '#87ceeb' }}>
                        📍 {typeof store.store.location === 'string' 
                          ? store.store.location 
                          : [(store.store.location as any)?.city, (store.store.location as any)?.country].filter(Boolean).join(', ') || 'Location TBD'}
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-sm mb-3 line-clamp-2" style={{ color: '#2d2d2d' }}>
                    {store.store.bio || 'Quality products and excellent service. Shop with confidence!'}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t" style={{ borderColor: '#e5e5e5' }}>
                    <div className="text-center">
                      <p className="font-bold text-sm" style={{ color: '#1a1a1a' }}>
                        {store.stats?.totalSales || 0}
                      </p>
                      <p className="text-xs" style={{ color: '#87ceeb' }}>Sales</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-sm" style={{ color: '#1a1a1a' }}>
                        {store.stats?.avgRating?.toFixed(1) || 'N/A'}
                      </p>
                      <p className="text-xs" style={{ color: '#87ceeb' }}>Rating</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-sm" style={{ color: '#1a1a1a' }}>
                        {store.productCount || 0}
                      </p>
                      <p className="text-xs" style={{ color: '#87ceeb' }}>Products</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 rounded-lg font-medium disabled:opacity-50"
              style={{ backgroundColor: '#1a1a1a', color: 'white' }}
            >
              Previous
            </button>
            <span className="px-4 py-2" style={{ color: '#2d2d2d' }}>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 rounded-lg font-medium disabled:opacity-50"
              style={{ backgroundColor: '#1a1a1a', color: 'white' }}
            >
              Next
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
