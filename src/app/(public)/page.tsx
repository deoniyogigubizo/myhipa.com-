'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Hero product data
const heroProduct = {
  headline: "Discover Amazing Products",
  subheadline: "Find everything you need in one place",
  cta: "Shop Now",
  image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop"
};

// Sample sellers for scroll
const sampleSellers = [
  { id: 1, name: "Kigali Electronics", distance: "0.5 km", rating: 4.8, products: 156 },
  { id: 2, name: "Rwanda Fashion Hub", distance: "1.2 km", rating: 4.6, products: 89 },
  { id: 3, name: "Mombasa Foods", distance: "2.0 km", rating: 4.9, products: 234 },
  { id: 4, name: "Tech Store Rwanda", distance: "1.8 km", rating: 4.7, products: 67 },
  { id: 5, name: "Home Essentials", distance: "2.5 km", rating: 4.5, products: 98 }
];

export default function AppHomePage() {
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyShops, setNearbyShops] = useState([]);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });

        // Fetch nearby shops
        try {
          const response = await fetch(`/api/nearby-shops?lat=${latitude}&lng=${longitude}&radius=10`);
          if (response.ok) {
            const shops = await response.json();
            setNearbyShops(shops);
          }
        } catch (error) {
          console.error('Failed to fetch nearby shops:', error);
        }
      },
      (error) => {
        console.log("Location denied. Using default location.");
        setLocationError("Location access denied. Showing default results.");
        // Fallback to Kigali coordinates
        setUserLocation({ latitude: -1.9441, longitude: 30.0619 });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="min-h-screen bg-white pb-16">
      {/* Split Screen Hero */}
      <div className="flex flex-col md:flex-row min-h-[70vh]">
        {/* Text Content */}
        <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="max-w-md text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              {heroProduct.headline}
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              {heroProduct.subheadline}
            </p>
            <Link
              href="/search"
              className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-all duration-200"
            >
              {heroProduct.cta}
            </Link>
          </div>
        </div>

        {/* Product Image */}
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
          <div className="relative w-full max-w-md h-80 md:h-96">
            <Image
              src={heroProduct.image}
              alt="Featured Product"
              fill
              className="object-cover rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Search Panel */}
      <div className="px-4 py-6 bg-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Search Products</h2>
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Search for products, brands, categories..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200">
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sellers Horizontal Scroll */}
      <div className="px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Sellers</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {sampleSellers.map((seller) => (
              <div key={seller.id} className="flex-shrink-0 w-80 bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{seller.name}</h3>
                    <p className="text-sm text-gray-600">📍 {seller.distance}</p>
                  </div>
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200">
                    Follow
                  </button>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>⭐ {seller.rating}</span>
                  <span>{seller.products} products</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nearby Shops Panel - Map Style */}
      <div className="px-4 py-4 bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  Shops Near You
                </h2>
              </div>
              {userLocation && (
                <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-medium text-blue-700">
                    {userLocation.latitude.toFixed(3)}°, {userLocation.longitude.toFixed(3)}°
                  </span>
                </div>
              )}
              {locationError && (
                <p className="text-xs text-red-600">{locationError}</p>
              )}
            </div>

            {nearbyShops.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {nearbyShops.map((shop) => (
                  <div key={shop.id} className="group relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-3 hover:shadow-lg transition-all duration-200 border border-slate-200 hover:border-blue-300 hover:-translate-y-1">
                    {/* Location Pin */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-md">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    
                    {/* Shop Info */}
                    <div className="mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{shop.name}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span className="text-xs text-gray-500">{shop.distance_km} km</span>
                      </div>
                    </div>
                    
                    {/* Visit Button */}
                    <button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Visit
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="inline-flex items-center gap-2 text-gray-500">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">Locating nearby shops...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
