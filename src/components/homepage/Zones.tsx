'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatRWF, formatNumber } from '@/lib/utils/currency';
import { useCartStore } from '@/store/cartStore';

// Product type for API response
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

// ============================================
// HERO SECTION - Two Column Layout
// Left: Super Categories (40%) | Right: Banner Carousel (60%)
// ============================================

interface SuperCategory {
  id: string;
  name: string;
  icon: string;
  slug: string;
}

// SVG Icons - Outlined style with uniform stroke weight (2px), monochromatic black
const CategoryIcon = ({ slug }: { slug: string }) => {
  const iconClass = "w-5 h-5 text-black";

  switch (slug) {
    case 'grocery-gourmet':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case 'fresh-produce':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case 'seafood':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      );
    case 'frozen-foods':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      );
    case 'breads-snacks':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      );
    case 'health-household':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      );
    case 'home-kitchen':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      );
    case 'clothing-jewelry':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      );
    case 'baby':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l6.75-9.75M9.75 10.5l-6.75 9.75" />
        </svg>
      );
    case 'arts-gifts':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.785-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597l-5.814 3.876a15.996 15.996 0 01-4.648 4.764m-3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
        </svg>
      );
    case 'services-special-deals':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      );
  }
};

const SUPER_CATEGORIES: SuperCategory[] = [
  { id: '1', name: 'Electronics & Media', icon: 'electronics-media', slug: 'electronics-media' },
  { id: '2', name: 'Fashion & Apparel', icon: 'fashion-apparel', slug: 'fashion-apparel' },
  { id: '3', name: 'Home, Garden & Tools', icon: 'home-garden-tools', slug: 'home-garden-tools' },
  { id: '4', name: 'Health, Beauty & Personal Care', icon: 'health-beauty', slug: 'health-beauty' },
  { id: '5', name: 'Sports, Outdoors & Travel', icon: 'sports-outdoors', slug: 'sports-outdoors' },
  { id: '6', name: 'Baby & Kids', icon: 'baby-kids', slug: 'baby-kids' },
  { id: '7', name: 'Automotive & Industrial', icon: 'automotive-industrial', slug: 'automotive-industrial' },
  { id: '8', name: 'Pet Supplies', icon: 'pet-supplies', slug: 'pet-supplies' },
  { id: '9', name: 'Groceries & Essentials', icon: 'groceries-essentials', slug: 'groceries-essentials' },
  { id: '10', name: 'Digital Products', icon: 'digital-products', slug: 'digital-products' },
];

interface HeroSlide {
  id: number;
  image: string;
}

const HERO_SLIDES: HeroSlide[] = [
  { id: 1, image: '/banner/banner.png' },
  { id: 2, image: '/banner/banner2.png' },
  { id: 3, image: '/banner/banner3.png' },
];

export function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(2); // Start with banner3

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-[#F5F5DC] py-4 pt-22">
      <div className="max-w-7xl mx-auto px-4">
        {/* Mobile: Banner first, then categories */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Banner - First on mobile */}
          <div className="w-full md:w-[70%] order-1 md:order-2">
            {/* Mobile: Single static image */}
            <div className="relative h-[150px] md:h-[280px] lg:h-[320px] overflow-hidden bg-gray-200 animate-fade-in-up md:hidden">
              <Image
                src="/banner/banner4.png"
                alt="Banner"
                fill
                className="object-cover"
                priority
              />
            </div>
            {/* Desktop: Animated carousel */}
            <div className="relative h-[280px] lg:h-[320px] overflow-hidden bg-gray-200 animate-fade-in-up hidden md:block">
              {/* Background Slides */}
              {HERO_SLIDES.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <Image
                    src={slide.image}
                    alt={`Banner ${slide.id}`}
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                </div>
              ))}

              {/* Slide Indicators */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {HERO_SLIDES.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      index === currentSlide
                        ? 'bg-white w-6'
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Categories - Below on mobile */}
          <div className="w-full md:w-[30%] flex flex-col order-2 md:order-1">
            <div className="mb-1">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-800 tracking-tight">
                <span className="hidden sm:inline">You can find all you want in: </span>
                <span className="sm:hidden">Find all in: </span>
              </h3>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-3 gap-2 flex-1">
              {SUPER_CATEGORIES.map((category, index) => (
                <Link
                  key={category.id}
                  href={`/search?category=${category.slug}`}
                  className="flex flex-col items-center justify-center p-1.5 sm:p-2 bg-white rounded-lg border border-gray-200 hover:border-hipa-primary hover:shadow-md transition-all group animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-7 h-7 mb-1 flex items-center justify-center rounded-full bg-gray-50 group-hover:bg-hipa-primary/10 transition-colors">
                    <CategoryIcon slug={category.icon} />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-gray-700 group-hover:text-hipa-primary text-center leading-tight tracking-tight">
                    {category.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ZONE C - SEARCH, LOCATION, NEARBY SELLERS & PROMOTIONAL BANNER
// ============================================

interface NearbySeller {
  id: string;
  name: string;
  storeSlug: string;
  logo: string;
  distance: string;
  productCount: number;
  rating: number;
}

const MOCK_NEARBY_SELLERS: NearbySeller[] = [
  { id: '1', name: 'Kigali Electronics', storeSlug: 'kigali-electronics', logo: 'https://ui-avatars.com/api/?name=KE&size=64&background=3b82f6&color=fff', distance: '0.5 km', productCount: 156, rating: 4.8 },
  { id: '2', name: 'Rwanda Fashion Hub', storeSlug: 'rwanda-fashion', logo: 'https://ui-avatars.com/api/?name=RF&size=64&background=ec4899&color=fff', distance: '1.2 km', productCount: 89, rating: 4.6 },
  { id: '3', name: 'Mombasa Foods', storeSlug: 'mombasa-foods', logo: 'https://ui-avatars.com/api/?name=MF&size=64&background=22c55e&color=fff', distance: '2.0 km', productCount: 234, rating: 4.9 },
];

export function CategoryGrid() {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState<{lat: number; lng: number} | null>(null);
  const [locationName, setLocationName] = useState<string>('Detecting...');
  const [locationError, setLocationError] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  // Rwanda locations database (District, Cell)
  const rwandaLocations = [
    { district: 'Kigali', cell: 'Kigali' },
    { district: 'Gasabo', cell: 'Kacyiru' },
    { district: 'Gasabo', cell: 'Gikomero' },
    { district: 'Kicukiro', cell: 'Kicukiro' },
    { district: 'Kicukiro', cell: 'Niboye' },
    { district: 'Nyarugenge', cell: 'Nyarugenge' },
    { district: 'Nyarugenge', cell: 'Kimisagara' },
    { district: 'Ruhengeri', cell: 'Ruhengeri' },
    { district: 'Gisenyi', cell: 'Gisenyi' },
    { district: 'Byumba', cell: 'Byumba' },
    { district: 'Ruhango', cell: 'Ruhango' },
    { district: 'Huye', cell: 'Huye' },
    { district: 'Butare', cell: 'Butare' },
    { district: 'Muhanga', cell: 'Muhanga' },
    { district: 'Nyagatare', cell: 'Nyagatare' },
    { district: 'Rwamagana', cell: 'Rwamagana' },
  ];

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      setLocationName('Kigali, Kigali');
      return;
    }

    setIsLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocation({ lat, lng });

        // Map coordinates to Rwanda districts (simplified mapping)
        // Kigali area: approx lat -1.9 to -2.0, lng 29.9 to 30.1
        let selectedLocation;

        if (lat >= -1.95 && lat <= -1.85 && lng >= 29.9 && lng <= 30.15) {
          // Kigali city area
          if (lng >= 30.0 && lng <= 30.1) {
            selectedLocation = { district: 'Nyarugenge', cell: 'Nyarugenge' };
          } else if (lng >= 29.95 && lng <= 30.0) {
            selectedLocation = { district: 'Kicukiro', cell: 'Kicukiro' };
          } else {
            selectedLocation = { district: 'Gasabo', cell: 'Kacyiru' };
          }
        } else if (lat >= -2.1 && lat <= -1.95) {
          // Northern province area
          selectedLocation = { district: 'Ruhengeri', cell: 'Ruhengeri' };
        } else if (lat >= -2.5 && lat <= -2.1) {
          // Western province
          selectedLocation = { district: 'Gisenyi', cell: 'Gisenyi' };
        } else if (lat >= -2.8 && lat <= -2.5) {
          // Southern province
          selectedLocation = { district: 'Huye', cell: 'Huye' };
        } else if (lat >= -1.85 && lat <= -1.7) {
          // Eastern province
          selectedLocation = { district: 'Rwamagana', cell: 'Rwamagana' };
        } else {
          // Default to Kigali
          selectedLocation = { district: 'Kigali', cell: 'Kigali' };
        }

        setLocationName(`${selectedLocation.district}, ${selectedLocation.cell}`);
        setIsLocating(false);
      },
      (error) => {
        setLocationError('Location unavailable');
        setLocationName('Kigali, Kigali');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Auto-get location on mount
  useEffect(() => {
    getLocation();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <section className="pt-0 pb-8 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top Section: Search & Location */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Search Banner */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 tracking-tight">Search Products</h2>
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products, brands, categories..."
                className="w-full px-5 py-4 pr-14 rounded-xl border border-gray-200 focus:border-hipa-primary focus:ring-2 focus:ring-hipa-primary/20 outline-none transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>

          {/* Auto-detected Location */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 tracking-tight">Your Location</h2>
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-hipa-primary/5 to-hipa-secondary/5 rounded-xl border border-hipa-primary/10">
              <div className="w-10 h-10 bg-hipa-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-hipa-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">
                  {isLocating ? 'Detecting...' : 'Your District & Cell'}
                </p>
                {isLocating ? (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin text-hipa-primary" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span className="text-sm text-gray-500">Getting your location...</span>
                  </div>
                ) : (
                  <p className="font-semibold text-gray-900">
                    {locationName}
                  </p>
                )}
              </div>
            </div>
            {location && (
              <p className="text-xs text-gray-400 mt-2">
                {location.lat.toFixed(4)}°S, {location.lng.toFixed(4)}°E
              </p>
            )}
          </div>
        </div>

        {/* Middle Section: Nearby Sellers */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Sellers Near You</h2>
              <p className="text-gray-500 text-sm mt-0.5">Discover amazing local sellers in your area</p>
            </div>
            <Link href="/stores" className="text-hipa-primary hover:text-hipa-secondary font-medium text-sm flex items-center gap-1">
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_NEARBY_SELLERS.map((seller) => (
              <Link
                key={seller.id}
                href={`/store/${seller.storeSlug}`}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
              >
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  <Image
                    src={seller.logo}
                    alt={seller.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate group-hover:text-hipa-primary transition-colors tracking-tight">
                    {seller.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {seller.distance}
                    </span>
                    <span>•</span>
                    <span>{seller.productCount} products</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {seller.rating}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Section: Promotional Banner */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Sell on Hipa */}
          <Link href="/seller/register" className="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
            <div className="relative">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center mb-3.5">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold mb-1.5 tracking-tight">Start Selling</h3>
              <p className="text-blue-100 text-xs mb-3">Join thousands of sellers growing their business on Hipa</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium group-hover:translate-x-1 transition-transform">
                Register Now
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </div>
          </Link>

          {/* Advertise */}
          <Link href="/advertising" className="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-purple-600 to-purple-700 text-white">
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
            <div className="relative">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center mb-3.5">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold mb-1.5 tracking-tight">Advertise Your Business</h3>
              <p className="text-purple-100 text-xs mb-3">Reach thousands of potential customers with targeted ads</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium group-hover:translate-x-1 transition-transform">
                Start Advertising
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </div>
          </Link>

          {/* Hipa Pro */}
          <Link href="/hipa-pro" className="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
            <div className="relative">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center mb-3.5">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold mb-1.5 tracking-tight">Hipa Pro</h3>
              <p className="text-amber-100 text-xs mb-3">Unlock premium features and grow your business faster</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium group-hover:translate-x-1 transition-transform">
                Upgrade Now
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============================================
// ZONE D - RECENT PRODUCTS
// ============================================

export function RecentProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    async function fetchRecentProducts() {
      try {
        const response = await fetch('/api/products/recent');
        const data = await response.json();

        if (data.success) {
          setProducts(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch recent products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecentProducts();
  }, []);

  if (loading) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Recent Products</h2>
              <p className="text-gray-500 mt-0.5">Fresh arrivals from our sellers</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="aspect-square bg-gray-200 animate-pulse" />
                <div className="p-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Recent Products</h2>
            <p className="text-gray-500 mt-0.5">Fresh arrivals from our sellers</p>
          </div>
          <Link href="/search?sort=recent" className="text-hipa-primary hover:text-hipa-secondary font-medium text-sm flex items-center gap-1">
            View More
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product) => {
            const imageUrl = product.media?.[0]?.url || '/images/placeholder.png';
            const price = product.pricing?.base || 0;
            const rating = product.stats?.avgRating || 0;
            const reviewCount = product.stats?.reviewCount || 0;

            return (
              <Link
                key={product._id}
                href={`/product/${product.slug}`}
                className="block"
              >
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all group h-full">
                  <div className="relative aspect-square bg-gray-100">
                    <Image
                      src={imageUrl}
                      alt={product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1 group-hover:text-hipa-primary transition-colors tracking-tight">
                      {product.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-1">
                      by {product.sellerName}
                    </p>
                    <div className="flex items-center gap-1 mb-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-3 h-3 ${star <= Math.round(rating) ? 'text-amber-400' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">({reviewCount})</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-bold text-gray-900">
                        {formatRWF(price)}
                      </span>
                      {product.pricing?.compareAt && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatRWF(product.pricing.compareAt)}
                        </span>
                      )}
                    </div>
                    {/* Add to Cart Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addItem({
                          productId: product._id,
                          slug: product.slug,
                          title: product.title,
                          image: imageUrl,
                          price: price,
                          quantity: 1,
                          sellerId: product.sellerId,
                          sellerName: product.sellerName,
                        });
                      }}
                      className="w-full mt-2 py-1.5 rounded-lg flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: '#1a1a1a', color: 'white' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <svg className="w-3 h-3" fill="none" style={{ color: '#ef4444' }} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function RecentlyViewedPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentlyViewedProducts() {
      try {
        const response = await fetch('/api/products/recently-viewed');
        const data = await response.json();

        if (data.success) {
          setProducts(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch recently viewed products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecentlyViewedProducts();
  }, []);

  if (loading) {
    return (
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Recently Viewed</h2>
              <p className="text-gray-500 text-sm mt-0.5">Products you've checked out recently</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="aspect-square bg-gray-200 animate-pulse" />
                <div className="p-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Recently Viewed</h2>
            <p className="text-gray-500 text-sm mt-0.5">Products you've checked out recently</p>
          </div>
          <Link href="/recently-viewed" className="text-hipa-primary hover:text-hipa-secondary font-medium text-sm flex items-center gap-1">
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {products.map((product) => {
            const imageUrl = product.media?.[0]?.url || '/images/placeholder.png';
            const price = product.pricing?.base || 0;

            return (
              <Link
                key={product._id}
                href={`/product/${product.slug}`}
                className="group"
              >
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                  <Image
                    src={imageUrl}
                    alt={product.title}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                </div>
                <h3 className="font-medium text-gray-900 text-sm line-clamp-2 group-hover:text-hipa-primary transition-colors">
                  {product.title}
                </h3>
                <p className="text-xs text-gray-500 mb-1">
                  by {product.sellerName}
                </p>
                <p className="text-base font-bold text-gray-900">
                  {formatRWF(price)}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function VisualCategoryPanel() {
  const categories = [
    {
      id: 'electronics',
      name: 'Electronics',
      image: 'https://placehold.co/400x300/3b82f6/white?text=📱',
      slug: 'electronics',
      productCount: 1250,
    },
    {
      id: 'fashion',
      name: 'Fashion & Clothing',
      image: 'https://placehold.co/400x300/ec4899/white?text=👕',
      slug: 'fashion',
      productCount: 890,
    },
    {
      id: 'home',
      name: 'Home & Garden',
      image: 'https://placehold.co/400x300/10b981/white?text=🏠',
      slug: 'home',
      productCount: 675,
    },
    {
      id: 'sports',
      name: 'Sports & Outdoors',
      image: 'https://placehold.co/400x300/f59e0b/white?text=⚽',
      slug: 'sports',
      productCount: 432,
    },
    {
      id: 'beauty',
      name: 'Beauty & Personal Care',
      image: 'https://placehold.co/400x300/8b5cf6/white?text=💄',
      slug: 'beauty',
      productCount: 567,
    },
    {
      id: 'books',
      name: 'Books & Media',
      image: 'https://placehold.co/400x300/6b7280/white?text=📚',
      slug: 'books',
      productCount: 234,
    },
  ];

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Shop by Category</h2>
          <p className="text-gray-600 text-lg">Discover amazing products across all categories</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/search?category=${category.slug}`}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="aspect-[4/3] relative">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-hipa-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {formatNumber(category.productCount)} products
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AsSeenInSection() {
  const mediaOutlets = [
    { name: 'BBC Africa', logo: 'https://placehold.co/120x60/000000/white?text=BBC' },
    { name: 'CNN', logo: 'https://placehold.co/120x60/ff0000/white?text=CNN' },
    { name: 'Al Jazeera', logo: 'https://placehold.co/120x60/0066cc/white?text=Al+Jazeera' },
    { name: 'The Guardian', logo: 'https://placehold.co/120x60/005689/white?text=Guardian' },
    { name: 'Reuters', logo: 'https://placehold.co/120x60/ff8000/white?text=Reuters' },
    { name: 'Bloomberg', logo: 'https://placehold.co/120x60/000000/white?text=Bloomberg' },
  ];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">As Seen In</h2>
          <p className="text-gray-600">Featured in leading media outlets worldwide</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
          {mediaOutlets.map((outlet) => (
            <div
              key={outlet.name}
              className="flex items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Image
                src={outlet.logo}
                alt={outlet.name}
                width={120}
                height={60}
                className="object-contain opacity-60 hover:opacity-100 transition-opacity"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ShopTheLookPanel() {
  const ugcPosts = [
    {
      id: '1',
      image: 'https://placehold.co/400x400/e91e63/white?text=👗',
      user: '@sarah_k',
      likes: 1240,
      products: [
        { name: 'Summer Dress', price: 45000, position: { x: 30, y: 40 } },
        { name: 'Sandals', price: 25000, position: { x: 70, y: 80 } },
      ],
    },
    {
      id: '2',
      image: 'https://placehold.co/400x400/2196f3/white?text=💼',
      user: '@john_doe',
      likes: 892,
      products: [
        { name: 'Leather Jacket', price: 85000, position: { x: 50, y: 30 } },
        { name: 'Sneakers', price: 65000, position: { x: 40, y: 85 } },
      ],
    },
    {
      id: '3',
      image: 'https://placehold.co/400x400/4caf50/white?text=👒',
      user: '@maria_l',
      likes: 1567,
      products: [
        { name: 'Sun Hat', price: 15000, position: { x: 45, y: 20 } },
        { name: 'Beach Bag', price: 35000, position: { x: 65, y: 60 } },
      ],
    },
  ];

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Shop the Look</h2>
            <p className="text-gray-500 mt-0.5">Get inspired by real customer outfits</p>
          </div>
          <Link href="/community" className="text-hipa-primary hover:text-hipa-secondary font-medium text-sm flex items-center gap-1">
            View Community
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ugcPosts.map((post) => (
            <div key={post.id} className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow">
              <div className="aspect-square relative">
                <Image
                  src={post.image}
                  alt={`Post by ${post.user}`}
                  fill
                  className="object-cover"
                />
                {/* Product tags */}
                {post.products.map((product, index) => (
                  <div
                    key={index}
                    className="absolute w-6 h-6 bg-hipa-primary rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:scale-110 transition-transform"
                    style={{
                      left: `${product.position.x}%`,
                      top: `${product.position.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    +
                  </div>
                ))}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{post.user}</span>
                  <div className="flex items-center gap-1 text-gray-500">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs">{post.likes}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  {post.products.slice(0, 2).map((product, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 truncate">{product.name}</span>
                      <span className="text-gray-900 font-medium">{formatRWF(product.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function OurValuesPanel() {
  const values = [
    {
      icon: '🌱',
      title: 'Sustainable Sourcing',
      description: 'We partner with eco-friendly suppliers and promote sustainable practices throughout our supply chain.',
      stats: '95% of products from sustainable sources',
    },
    {
      icon: '♻️',
      title: 'Circular Economy',
      description: 'Encouraging product reuse, recycling, and reducing waste through our platform initiatives.',
      stats: 'Reduced waste by 40% this year',
    },
    {
      icon: '🌍',
      title: 'Community Impact',
      description: 'Supporting local artisans and communities while minimizing our environmental footprint.',
      stats: 'Supported 500+ local artisans',
    },
    {
      icon: '⚡',
      title: 'Carbon Neutral',
      description: 'Committed to achieving net-zero carbon emissions across all our operations by 2030.',
      stats: '60% reduction in carbon footprint',
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Our Values</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Building a sustainable future through conscious commerce and responsible business practices
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl">{value.icon}</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
              <p className="text-gray-600 mb-3">{value.description}</p>
              <div className="text-sm font-medium text-hipa-primary">{value.stats}</div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/sustainability"
            className="inline-flex items-center gap-2 px-6 py-3 bg-hipa-primary text-white font-semibold rounded-lg hover:bg-hipa-secondary transition-colors"
          >
            Learn More About Our Impact
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function CuratedStaffPicks() {
  const collections = [
    {
      id: 'summer-essentials',
      title: 'Summer Essentials',
      curator: 'Sarah Johnson',
      curatorRole: 'Fashion Editor',
      image: 'https://placehold.co/600x400/ff6b6b/white?text=☀️',
      products: [
        { name: 'Beach Hat', price: 15000 },
        { name: 'Sunglasses', price: 25000 },
        { name: 'Swimwear', price: 35000 },
      ],
      description: 'Everything you need for the perfect summer',
    },
    {
      id: 'workspace-setup',
      title: 'Home Office Setup',
      curator: 'Mike Chen',
      curatorRole: 'Tech Reviewer',
      image: 'https://placehold.co/600x400/4ecdc4/white?text=💻',
      products: [
        { name: 'Ergonomic Chair', price: 150000 },
        { name: 'Standing Desk', price: 200000 },
        { name: 'Monitor', price: 250000 },
      ],
      description: 'Create your perfect productive workspace',
    },
    {
      id: 'eco-friendly-living',
      title: 'Eco-Friendly Living',
      curator: 'Emma Green',
      curatorRole: 'Sustainability Expert',
      image: 'https://placehold.co/600x400/45b7d1/white?text=🌱',
      products: [
        { name: 'Bamboo Toothbrush', price: 5000 },
        { name: 'Reusable Bags', price: 8000 },
        { name: 'Solar Charger', price: 45000 },
      ],
      description: 'Sustainable products for conscious living',
    },
  ];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Staff Picks</h2>
            <p className="text-gray-500 mt-0.5">Curated collections by our expert team</p>
          </div>
          <Link href="/collections/staff-picks" className="text-hipa-primary hover:text-hipa-secondary font-medium text-sm flex items-center gap-1">
            View All Collections
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.map((collection) => (
            <div key={collection.id} className="group bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-[3/2] relative">
                <Image
                  src={collection.image}
                  alt={collection.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-hipa-primary transition-colors">
                  {collection.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3">{collection.description}</p>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-hipa-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-hipa-primary">
                      {collection.curator.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{collection.curator}</p>
                    <p className="text-xs text-gray-500">{collection.curatorRole}</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  {collection.products.slice(0, 3).map((product, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{product.name}</span>
                      <span className="text-gray-900 font-medium">{formatRWF(product.price)}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href={`/collections/${collection.id}`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-hipa-primary text-white text-sm font-medium rounded-lg hover:bg-hipa-secondary transition-colors"
                >
                  Shop Collection
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorksVideoPanel() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">How It Works</h2>
          <p className="text-gray-600 text-lg">See how easy it is to shop and sell on Hipa</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="aspect-video bg-gray-200 rounded-xl flex items-center justify-center relative overflow-hidden">
            {/* Placeholder for video */}
            <div className="text-center">
              <div className="w-20 h-20 bg-hipa-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Video Coming Soon</h3>
              <p className="text-gray-600">We're preparing an amazing video to show you how Hipa works</p>
            </div>
            {/* Play button overlay */}
            <button className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group">
              <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-hipa-primary ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FrequentSearchedTags() {
  const tags = [
    { name: 'iPhone', count: 15420, color: 'bg-blue-100 text-blue-800' },
    { name: 'Samsung', count: 12890, color: 'bg-purple-100 text-purple-800' },
    { name: 'Fashion', count: 9876, color: 'bg-pink-100 text-pink-800' },
    { name: 'Electronics', count: 8765, color: 'bg-green-100 text-green-800' },
    { name: 'Home & Garden', count: 7654, color: 'bg-yellow-100 text-yellow-800' },
    { name: 'Books', count: 6543, color: 'bg-indigo-100 text-indigo-800' },
    { name: 'Sports', count: 5432, color: 'bg-red-100 text-red-800' },
    { name: 'Beauty', count: 4321, color: 'bg-teal-100 text-teal-800' },
    { name: 'Kitchen', count: 3210, color: 'bg-orange-100 text-orange-800' },
    { name: 'Toys', count: 2109, color: 'bg-cyan-100 text-cyan-800' },
    { name: 'Under 50k', count: 1987, color: 'bg-lime-100 text-lime-800' },
    { name: 'New Arrivals', count: 1765, color: 'bg-emerald-100 text-emerald-800' },
  ];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2 tracking-tight">Popular Searches</h2>
          <p className="text-gray-600">Quick access to trending products and categories</p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          {tags.map((tag) => (
            <Link
              key={tag.name}
              href={`/search?q=${encodeURIComponent(tag.name)}`}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 ${tag.color} hover:shadow-md`}
            >
              <span>{tag.name}</span>
              <span className="text-xs opacity-75">({formatNumber(tag.count)})</span>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 text-hipa-primary hover:text-hipa-secondary font-medium"
          >
            Browse All Categories
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function NearToZeroAlert() {
  const limitedStockProducts = [
    {
      id: '1',
      title: 'Limited Edition Watch',
      price: 125000,
      originalPrice: 150000,
      stockLeft: 2,
      image: 'https://placehold.co/300x300/1a1a1a/white?text=⌚',
      slug: 'limited-edition-watch',
    },
    {
      id: '2',
      title: 'Designer Handbag',
      price: 85000,
      originalPrice: 120000,
      stockLeft: 1,
      image: 'https://placehold.co/300x300/1a1a1a/white?text=👜',
      slug: 'designer-handbag',
    },
    {
      id: '3',
      title: 'Vintage Camera',
      price: 65000,
      originalPrice: 90000,
      stockLeft: 3,
      image: 'https://placehold.co/300x300/1a1a1a/white?text=📷',
      slug: 'vintage-camera',
    },
  ];

  return (
    <section className="py-12 bg-red-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Almost Gone!</h2>
              <p className="text-gray-600 mt-0.5">Limited stock items - act fast before they're sold out</p>
            </div>
          </div>
          <Link href="/search?stock=low" className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-1">
            View All Limited Stock
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {limitedStockProducts.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="relative">
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                {/* Stock alert badge */}
                <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  Only {product.stockLeft} left!
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
                  {product.title}
                </h3>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-lg font-bold text-gray-900">
                    {formatRWF(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-gray-400 line-through">
                      {formatRWF(product.originalPrice)}
                    </span>
                  )}
                </div>
                <button className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                  Buy Now - Limited Stock!
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PaymentMethodsSection() {
  const paymentMethods = [
    {
      name: 'Mobile Money',
      description: 'MTN Mobile Money, Airtel Money',
      icon: '📱',
      color: 'bg-green-100 text-green-800',
    },
    {
      name: 'Bank Transfer',
      description: 'Direct bank transfers',
      icon: '🏦',
      color: 'bg-blue-100 text-blue-800',
    },
    {
      name: 'Credit/Debit Cards',
      description: 'Visa, Mastercard, American Express',
      icon: '💳',
      color: 'bg-purple-100 text-purple-800',
    },
    {
      name: 'Cash on Delivery',
      description: 'Pay when you receive',
      icon: '💵',
      color: 'bg-orange-100 text-orange-800',
    },
    {
      name: 'Cryptocurrency',
      description: 'Bitcoin, Ethereum, and more',
      icon: '₿',
      color: 'bg-yellow-100 text-yellow-800',
    },
    {
      name: 'Digital Wallets',
      description: 'PayPal, Apple Pay, Google Pay',
      icon: '📱',
      color: 'bg-indigo-100 text-indigo-800',
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Secure Payment Options</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Choose from multiple secure payment methods that work best for you
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {paymentMethods.map((method, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${method.color}`}>
                  {method.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{method.name}</h3>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            All transactions are secured with 256-bit SSL encryption
          </div>
        </div>
      </div>
    </section>
  );
}

export function SellOnHipa() {
  return (
    <section className="py-16 bg-gradient-to-br from-teal-600 to-teal-800 text-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Start Selling on Hipa</h2>
        <p className="text-xl mb-8 text-teal-100">
          Join thousands of sellers growing their business on Africa's fastest-growing marketplace
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/seller/register"
            className="inline-flex items-center justify-center px-8 py-3 bg-white text-teal-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Start Selling Today
          </a>
          <a
            href="/learn/selling"
            className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-teal-600 transition-colors"
          >
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
}
