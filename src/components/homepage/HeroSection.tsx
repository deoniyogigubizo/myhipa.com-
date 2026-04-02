'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  href: string;
}

const categories: Category[] = [
  {
    id: 'fashion',
    name: 'Fashion',
    icon: '👗',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    href: '/search?category=fashion',
  },
  {
    id: 'electronics',
    name: 'Electronics',
    icon: '📱',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    href: '/search?category=electronics',
  },
  {
    id: 'home',
    name: 'Home & Living',
    icon: '🏠',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    href: '/search?category=home',
  },
  {
    id: 'beauty',
    name: 'Beauty',
    icon: '💄',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    href: '/search?category=beauty',
  },
  {
    id: 'sports',
    name: 'Sports',
    icon: '⚽',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    href: '/search?category=sports',
  },
  {
    id: 'agri',
    name: 'Agri',
    icon: '🌾',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    href: '/search?category=agri',
  },
];

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedSort, setSelectedSort] = useState('Best Match');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <section className="relative bg-[#f9f9f9] overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 400C200 300 400 500 600 400C800 300 1000 500 1200 400C1400 300 1440 400 1440 400V800H0V400Z" fill="url(#wave-gradient)" />
          <defs>
            <linearGradient id="wave-gradient" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#87CEEB" stopOpacity="0.3" />
              <stop offset="1" stopColor="#F5F5DC" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Discover <span className="text-[#87CEEB]">Rwanda's</span>
              <br />
              Trusted Marketplace
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
              Buy and sell with confidence. Verified sellers, secure payments, and fast delivery across Rwanda.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-8">
              <div className="relative max-w-2xl mx-auto lg:mx-0">
                <div className="flex flex-col md:flex-row gap-3">
                  {/* Filter Dropdowns */}
                  <div className="flex gap-2">
                    <div className="relative">
                      <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="appearance-none bg-white/80 backdrop-blur-md border border-gray-200 rounded-full px-4 py-3 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#87CEEB] focus:border-transparent cursor-pointer"
                      >
                        <option>All Locations</option>
                        <option>Kigali</option>
                        <option>Huye</option>
                        <option>Musanze</option>
                        <option>Rubavu</option>
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <div className="relative">
                      <select
                        value={selectedSort}
                        onChange={(e) => setSelectedSort(e.target.value)}
                        className="appearance-none bg-white/80 backdrop-blur-md border border-gray-200 rounded-full px-4 py-3 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#87CEEB] focus:border-transparent cursor-pointer"
                      >
                        <option>Best Match</option>
                        <option>Price: Low to High</option>
                        <option>Price: High to Low</option>
                        <option>Newest First</option>
                        <option>Top Rated</option>
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Search Input */}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products, sellers, categories..."
                      className="w-full px-6 py-3 pl-12 rounded-full bg-white border border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#87CEEB] focus:border-transparent shadow-lg"
                    />
                    <svg
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#87CEEB] hover:bg-[#6bb8d9] text-white px-6 py-2 rounded-full font-medium transition-colors"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                </svg>
                <span>Verified Sellers</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                </svg>
                <span>Secure Payments</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                </svg>
                <span>Fast Delivery</span>
              </div>
            </div>
          </div>

          {/* Right Content - People Image with Trust Badges */}
          <div className="flex-1 relative hidden lg:block">
            <div className="relative w-full max-w-md mx-auto">
              {/* People Group Image Placeholder */}
              <div className="relative bg-gradient-to-br from-[#87CEEB]/20 to-[#F5F5DC]/40 rounded-3xl p-8 backdrop-blur-sm">
                <div className="flex justify-center items-center gap-4">
                  {/* Person 1 */}
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-4xl shadow-lg">
                      👩
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                      </svg>
                      Verified
                    </div>
                  </div>

                  {/* Person 2 */}
                  <div className="relative -mt-8">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-5xl shadow-lg">
                      👨
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                      </svg>
                      Verified
                    </div>
                  </div>

                  {/* Person 3 */}
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white text-4xl shadow-lg">
                      👧
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                      </svg>
                      Verified
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-6 text-center">
                  <p className="text-2xl font-bold text-gray-900">50,000+</p>
                  <p className="text-gray-600">Trusted Sellers</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Category Cards */}
        <div className="mt-12 md:mt-16">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-8">
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={category.href}
                className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                style={{
                  boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                }}
              >
                <div className={`w-16 h-16 ${category.bgColor} rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                  {category.icon}
                </div>
                <h3 className={`text-center font-semibold ${category.color} group-hover:opacity-80 transition-opacity`}>
                  {category.name}
                </h3>
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-[#87CEEB]/30 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
