'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface Product {
  _id: string;
  title: string;
  slug: string;
  pricing: {
    base: number;
    compareAt?: number;
  };
  media: Array<{ url: string; alt?: string }>;
  category: {
    primary: string;
    secondary?: string;
  };
  stats: {
    avgRating: number;
    totalSold: number;
  };
}

interface Seller {
  _id: string;
  store: {
    storeName: string;
    slug: string;
    logo?: string;
    location?: string;
  };
  tier: string;
}

interface RegionData {
  region: {
    id: string;
    name: string;
    countries: string[];
  };
  sellers: Seller[];
  products: Product[];
  productCount: number;
  sellerCount: number;
}

const REGION_FLAGS: Record<string, string> = {
  'east-africa': '🌍',
  'west-africa': '🌴',
  'southern-africa': '🏝️',
  'north-africa': '🏜️',
  'central-africa': '🌺',
};

export default function RegionalCollectionsPage() {
  const [regionalData, setRegionalData] = useState<Record<string, RegionData>>({});
  const [selectedRegion, setSelectedRegion] = useState<string>('east-africa');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchRegionalData();
  }, []);

  const fetchRegionalData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/collections/regional?limit=12');
      const data = await response.json();
      
      if (data.success) {
        setRegionalData(data.data);
      } else {
        setError(data.error || 'Failed to load regional data');
      }
    } catch (err) {
      setError('Failed to connect to database');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const regions = [
    { id: 'east-africa', name: 'East Africa', flag: '🌍' },
    { id: 'west-africa', name: 'West Africa', flag: '🌴' },
    { id: 'southern-africa', name: 'Southern Africa', flag: '🏝️' },
    { id: 'north-africa', name: 'North Africa', flag: '🏜️' },
    { id: 'central-africa', name: 'Central Africa', flag: '🌺' },
  ];

  const currentRegionData = regionalData[selectedRegion];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f5f5dc' }}>
      <Navbar />
      
      {/* Hero Section - Black background */}
      <div className="relative py-16 px-4" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#f5f5dc' }}>
            Regional Collections
          </h1>
          <p className="text-lg md:text-xl max-w-2xl" style={{ color: '#87ceeb' }}>
            Explore unique products from different regions across Africa. 
            Discover local treasures and support regional artisans.
          </p>
        </div>
        
        {/* Skyblue accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: '#87ceeb' }} />
      </div>

      {/* Region Tabs - Beige background */}
      <div className="py-6 px-4" style={{ backgroundColor: '#faebd7' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-4">
            {regions.map((region) => (
              <button
                key={region.id}
                onClick={() => setSelectedRegion(region.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  selectedRegion === region.id ? 'text-white' : 'text-gray-700'
                }`}
                style={{
                  backgroundColor: selectedRegion === region.id ? '#1a1a1a' : '#fffdd0',
                  border: selectedRegion === region.id ? 'none' : '2px solid #87ceeb'
                }}
              >
                <span className="text-xl">{region.flag}</span>
                <span>{region.name}</span>
                {regionalData[region.id] && (
                  <span className="ml-1 px-2 py-0.5 text-xs rounded-full" 
                    style={{ 
                      backgroundColor: selectedRegion === region.id ? '#87ceeb' : '#1a1a1a',
                      color: selectedRegion === region.id ? '#1a1a1a' : 'white'
                    }}
                  >
                    {regionalData[region.id].productCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="h-40 bg-gray-200 rounded-lg mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-xl" style={{ color: '#1a1a1a' }}>{error}</p>
            <button 
              onClick={fetchRegionalData}
              className="mt-4 px-6 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: '#1a1a1a' }}
            >
              Try Again
            </button>
          </div>
        ) : !currentRegionData ? (
          <div className="text-center py-16">
            <p className="text-xl" style={{ color: '#1a1a1a' }}>No data available for this region</p>
          </div>
        ) : (
          <div>
            {/* Region Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>
                  {REGION_FLAGS[selectedRegion]} {regions.find(r => r.id === selectedRegion)?.name}
                </h2>
                <p style={{ color: '#5bbce4' }}>
                  {currentRegionData.sellerCount} sellers • {currentRegionData.productCount} products
                </p>
              </div>
              <Link 
                href={`/search?region=${selectedRegion}`}
                className="px-6 py-2 rounded-lg font-medium text-white"
                style={{ backgroundColor: '#1a1a1a' }}
              >
                View All
              </Link>
            </div>

            {/* Products Grid */}
            {currentRegionData.products && currentRegionData.products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentRegionData.products.map((product) => (
                  <Link 
                    key={product._id}
                    href={`/product/${product.slug}`}
                    className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow"
                    style={{ border: '1px solid #e5e5e5' }}
                  >
                    {/* Product Image */}
                    <div className="h-40 relative" style={{ backgroundColor: '#2d2d2d' }}>
                      {product.media && product.media[0] ? (
                        <img 
                          src={product.media[0].url} 
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-3xl">📦</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <div className="p-3">
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2" style={{ color: '#1a1a1a' }}>
                        {product.title}
                      </h3>
                      <p className="text-xs mb-2" style={{ color: '#87ceeb' }}>
                        {product.category.primary}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold" style={{ color: '#1a1a1a' }}>
                          ${product.pricing?.base?.toFixed(2) || '0.00'}
                        </span>
                        {product.stats?.avgRating && (
                          <span className="text-xs flex items-center gap-1" style={{ color: '#5bbce4' }}>
                            ⭐ {product.stats.avgRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl" style={{ border: '1px solid #87ceeb' }}>
                <p className="text-lg" style={{ color: '#1a1a1a' }}>No products available in this region yet</p>
                <p className="mt-2" style={{ color: '#5bbce4' }}>Check back soon for new arrivals</p>
              </div>
            )}

            {/* Sellers Section */}
            {currentRegionData.sellers && currentRegionData.sellers.length > 0 && (
              <div className="mt-12">
                <h3 className="text-xl font-bold mb-4" style={{ color: '#1a1a1a' }}>
                  Top Sellers in {regions.find(r => r.id === selectedRegion)?.name}
                </h3>
                <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {currentRegionData.sellers.slice(0, 5).map((seller) => (
                    <Link 
                      key={seller._id}
                      href={`/store/${seller.store.slug}`}
                      className="bg-white rounded-lg p-4 text-center hover:shadow-lg transition-shadow"
                      style={{ border: '1px solid #e5e5e5' }}
                    >
                      <div className="w-16 h-16 mx-auto rounded-full mb-3 flex items-center justify-center" style={{ backgroundColor: '#f5f5dc' }}>
                        {seller.store.logo ? (
                          <img src={seller.store.logo} alt={seller.store.storeName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-2xl">🏪</span>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm" style={{ color: '#1a1a1a' }}>
                        {seller.store.storeName}
                      </h4>
                      <p className="text-xs" style={{ color: '#87ceeb' }}>
                        {typeof seller.store.location === 'string' 
                          ? seller.store.location 
                          : [(seller.store.location as any)?.city, (seller.store.location as any)?.country].filter(Boolean).join(', ') || 'Location not specified'}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
