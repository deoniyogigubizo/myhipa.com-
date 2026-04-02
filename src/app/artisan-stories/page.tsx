'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface Artisan {
  _id: string;
  store: {
    name: string;
    storeName: string;
    slug: string;
    logo?: string;
    bio?: string;
    story?: string;
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
  createdAt: string;
}

export default function ArtisanStoriesPage() {
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchArtisans();
  }, [selectedRegion]);

  const fetchArtisans = async () => {
    try {
      setLoading(true);
      const url = selectedRegion 
        ? `/api/artisans?region=${selectedRegion}&limit=20`
        : '/api/artisans?limit=20';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setArtisans(data.data);
      } else {
        setError(data.error || 'Failed to load artisans');
      }
    } catch (err) {
      setError('Failed to connect to database');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const regions = [
    { id: '', name: 'All Regions' },
    { id: 'east-africa', name: 'East Africa' },
    { id: 'west-africa', name: 'West Africa' },
    { id: 'southern-africa', name: 'Southern Africa' },
    { id: 'north-africa', name: 'North Africa' },
    { id: 'central-africa', name: 'Central Africa' },
  ];

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'gold': return 'bg-yellow-500';
      case 'silver': return 'bg-gray-400';
      case 'pro': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f5f5dc' }}>
      <Navbar />
      
      {/* Hero Section - Black background */}
      <div className="relative py-16 px-4" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#f5f5dc' }}>
            Artisan Stories
          </h1>
          <p className="text-lg md:text-xl max-w-2xl" style={{ color: '#87ceeb' }}>
            Discover the inspiring stories behind our sellers. Learn about their craft, 
            their heritage, and the products they bring to the Hipa marketplace.
          </p>
        </div>
        
        {/* Skyblue accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: '#87ceeb' }} />
      </div>

      {/* Filter Section - Beige background */}
      <div className="py-6 px-4" style={{ backgroundColor: '#faebd7' }}>
        <div className="max-w-7xl mx-auto flex flex-wrap gap-4 items-center">
          <span className="font-semibold" style={{ color: '#2d2d2d' }}>Filter by Region:</span>
          {regions.map((region) => (
            <button
              key={region.id}
              onClick={() => setSelectedRegion(region.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedRegion === region.id 
                  ? 'text-white' 
                  : 'text-gray-700'
              }`}
              style={{
                backgroundColor: selectedRegion === region.id ? '#1a1a1a' : '#fffdd0',
                border: selectedRegion === region.id ? 'none' : '1px solid #87ceeb'
              }}
            >
              {region.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-xl" style={{ color: '#1a1a1a' }}>{error}</p>
            <p className="mt-2" style={{ color: '#87ceeb' }}>Please ensure MongoDB is running</p>
            <button 
              onClick={fetchArtisans}
              className="mt-4 px-6 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: '#1a1a1a' }}
            >
              Try Again
            </button>
          </div>
        ) : artisans.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl" style={{ color: '#1a1a1a' }}>No artisan stories found</p>
            <p className="mt-2" style={{ color: '#5bbce4' }}>Check back soon for new stories</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {artisans.map((artisan) => (
              <article 
                key={artisan._id}
                className="bg-white rounded-xl overflow-hidden shadow-lg transition-transform hover:-translate-y-1"
                style={{ border: '1px solid #e5e5e5' }}
              >
                {/* Store Image/Banner */}
                <div className="h-32 relative" style={{ backgroundColor: '#2d2d2d' }}>
                  {artisan.store.logo ? (
                    <img 
                      src={artisan.store.logo} 
                      alt={artisan.store.storeName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl" style={{ color: '#87ceeb' }}>🏪</span>
                    </div>
                  )}
                  
                  {/* Tier Badge */}
                  <div className={`absolute top-3 right-3 px-2 py-1 rounded text-xs text-white font-medium ${getTierBadgeColor(artisan.tier)}`}>
                    {artisan.tier?.toUpperCase()}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-2" style={{ color: '#1a1a1a' }}>
                    {artisan.store.storeName || 'Artisan Store'}
                  </h2>
                  
                  <p className="text-sm mb-3" style={{ color: '#5bbce4' }}>
                    📍 {typeof artisan.store.location === 'string' 
                      ? artisan.store.location 
                      : [(artisan.store.location as any)?.city, (artisan.store.location as any)?.country].filter(Boolean).join(', ') || 'Location not specified'}
                  </p>
                  
                  <p className="text-sm mb-4 line-clamp-3" style={{ color: '#2d2d2d' }}>
                    {artisan.store.bio || artisan.store.story || 
                      'Passionate seller bringing quality products to the Hipa marketplace. ' +
                      'Dedicated to customer satisfaction and excellent service.'}
                  </p>

                  {/* Stats */}
                  <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: '#e5e5e5' }}>
                    <div className="text-center">
                      <p className="text-lg font-bold" style={{ color: '#1a1a1a' }}>
                        {artisan.stats?.totalSales || 0}
                      </p>
                      <p className="text-xs" style={{ color: '#87ceeb' }}>Sales</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold" style={{ color: '#1a1a1a' }}>
                        {artisan.stats?.avgRating?.toFixed(1) || 'N/A'}
                      </p>
                      <p className="text-xs" style={{ color: '#87ceeb' }}>Rating</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold" style={{ color: '#1a1a1a' }}>
                        {artisan.stats?.productCount || 0}
                      </p>
                      <p className="text-xs" style={{ color: '#87ceeb' }}>Products</p>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Link 
                    href={`/store/${artisan.store.slug}`}
                    className="block w-full mt-4 py-3 text-center rounded-lg font-medium transition-colors text-white"
                    style={{ backgroundColor: '#1a1a1a' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2d2d2d'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                  >
                    Visit Store
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
