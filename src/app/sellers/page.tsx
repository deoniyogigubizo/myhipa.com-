'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatNumber } from '@/lib/utils/currency';
import { useAuthStore } from '@/store/authStore';

interface Seller {
  _id: string;
  businessName: string;
  slug: string;
  logo: string;
  banner?: string;
  description: string;
  categories: string[];
  address: {
    district: string;
    sector: string;
  };
  stats: {
    followers: number;
    products: number;
    rating: number;
  };
  tier: string;
}

const RWANDA_DISTRICTS = [
  'Kigali', 'Gasabo', 'Kicukiro', 'Nyarugenge',
  'Ruhengeri', 'Gisenyi', 'Byumba', 'Ruhango',
  'Huye', 'Butare', 'Muhanga', 'Nyagatare', 'Rwamagana'
];

const SELLER_CATEGORIES = [
  { value: 'electronics_office', label: 'Electronics & Office' },
  { value: 'clothing_jewelry', label: 'Clothing & Jewelry' },
  { value: 'home_kitchen', label: 'Home & Kitchen' },
  { value: 'grocery', label: 'Grocery' },
  { value: 'health_household', label: 'Health & Household' },
  { value: 'services', label: 'Services' },
  { value: 'arts_gifts', label: 'Arts & Gifts' },
  { value: 'baby', label: 'Baby Products' },
  { value: 'frozen_foods', label: 'Frozen Foods' },
  { value: 'fresh_produce', label: 'Fresh Produce' },
  { value: 'meat_poultry', label: 'Meat & Poultry' },
  { value: 'seafood', label: 'Seafood' },
  { value: 'breads_snacks', label: 'Breads & Snacks' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'bags_travel', label: 'Bags & Travel' },
  { value: 'Electronics', label: 'Electronics' }
];

export default function SellersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [following, setFollowing] = useState<Set<string>>(new Set());

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedLocation) params.append('location', selectedLocation);

      const response = await fetch(`/api/sellers?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setSellers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [selectedCategory, selectedLocation]);

  const handleFollow = async (sellerId: string, currentlyFollowing: boolean) => {
    try {
      const response = await fetch('/api/sellers/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellerId,
          action: currentlyFollowing ? 'unfollow' : 'follow',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFollowing(prev => {
          const newSet = new Set(prev);
          if (currentlyFollowing) {
            newSet.delete(sellerId);
          } else {
            newSet.add(sellerId);
          }
          return newSet;
        });

        // Update the seller's follower count locally
        setSellers(prev => prev.map(seller =>
          seller._id === sellerId
            ? {
                ...seller,
                stats: {
                  ...seller.stats,
                  followers: currentlyFollowing
                    ? seller.stats.followers - 1
                    : seller.stats.followers + 1
                }
              }
            : seller
        ));
      }
    } catch (error) {
      console.error('Failed to follow/unfollow seller:', error);
    }
  };

  const handleChat = (sellerSlug: string) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/sellers`);
      return;
    }
    router.push(`/messages?store=${sellerSlug}`);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'bg-amber-100 text-amber-800';
      case 'verified': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Sellers</h1>
            <p className="text-gray-600">Find amazing local businesses and start following your favorites</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hipa-primary focus:border-transparent"
              >
                <option value="">All Categories</option>
                {SELLER_CATEGORIES.map(category => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hipa-primary focus:border-transparent"
              >
                <option value="">All Locations</option>
                {RWANDA_DISTRICTS.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Sellers Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="h-48 bg-gray-200 animate-pulse" />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
                    <div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-1" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                    </div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : sellers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No sellers found</h3>
            <p className="text-gray-600">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sellers.map((seller) => {
              const isFollowing = following.has(seller._id);

              return (
                <div key={seller._id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  {/* Banner */}
                  {seller.banner && (
                    <div className="h-32 relative bg-gray-200">
                      <Image
                        src={seller.banner}
                        alt={seller.businessName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}

                  <div className="p-6">
                    {/* Logo and Basic Info */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                          {seller.logo ? (
                            <Image
                              src={seller.logo}
                              alt={seller.businessName}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-xl font-bold">
                                {seller.businessName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        {seller.tier && (
                          <div className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTierColor(seller.tier)}`}>
                            {seller.tier}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link href={`/store/${seller.slug}`}>
                          <h3 className="font-semibold text-gray-900 hover:text-hipa-primary transition-colors truncate">
                            {seller.businessName}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-500 truncate">
                          {seller.address?.district}, {seller.address?.sector}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {seller.description || 'Quality products and excellent service'}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {formatNumber(seller.stats.followers)}
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        {formatNumber(seller.stats.products)}
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {seller.stats.rating.toFixed(1)}
                      </div>
                    </div>

                    {/* Categories */}
                    {seller.categories && seller.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {seller.categories.slice(0, 2).map((category, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            {category}
                          </span>
                        ))}
                        {seller.categories.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{seller.categories.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFollow(seller._id, isFollowing)}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                          isFollowing
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                      <button
                        onClick={() => handleChat(seller.slug)}
                        className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Message
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}