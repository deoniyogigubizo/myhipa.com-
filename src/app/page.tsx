"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/layout/Footer";

// Hero product data
const heroProduct = {
  headline: "Step into our digital coven of creators",
  subheadline:
    "Unearth hidden treasures and everyday essentials, gathered by our community of makers especially for you.",
  cta: "Shop Now",
  image:
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop",
};

// Sample sellers for scroll
const sampleSellers = [
  {
    id: 1,
    name: "Kigali Electronics",
    distance: "0.5 km",
    rating: 4.8,
    products: 156,
  },
  {
    id: 2,
    name: "Rwanda Fashion Hub",
    distance: "1.2 km",
    rating: 4.6,
    products: 89,
  },
  {
    id: 3,
    name: "Mombasa Foods",
    distance: "2.0 km",
    rating: 4.9,
    products: 234,
  },
  {
    id: 4,
    name: "Tech Store Rwanda",
    distance: "1.8 km",
    rating: 4.7,
    products: 67,
  },
  {
    id: 5,
    name: "Home Essentials",
    distance: "2.5 km",
    rating: 4.5,
    products: 98,
  },
];

// Sample trending products for fallback
const sampleTrendingProducts = [
  {
    _id: "sample1",
    title: "Gaming Laptop - HP Pavilion",
    pricing: { base: 650000 },
    media: [
      {
        url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200",
      },
    ],
    stats: { rating: 4.5 },
  },
  {
    _id: "sample2",
    title: "Wireless Bluetooth Headphones",
    pricing: { base: 45000 },
    media: [
      {
        url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200",
      },
    ],
    stats: { rating: 4.8 },
  },
  {
    _id: "sample3",
    title: "Samsung Galaxy A14 Smartphone",
    pricing: { base: 350000 },
    media: [
      {
        url: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=200",
      },
    ],
    stats: { rating: 4.2 },
  },
  {
    _id: "sample4",
    title: "Sectional Sofa - Modern Design",
    pricing: { base: 450000 },
    media: [
      {
        url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200",
      },
    ],
    stats: { rating: 4.7 },
  },
  {
    _id: "sample5",
    title: "Car Tire Set - Premium Quality",
    pricing: { base: 280000 },
    media: [
      {
        url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200",
      },
    ],
    stats: { rating: 4.3 },
  },
  {
    _id: "sample6",
    title: "Power Drill Set - Professional",
    pricing: { base: 85000 },
    media: [
      {
        url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200",
      },
    ],
    stats: { rating: 4.6 },
  },
];

// Sample featured shops for fallback (matching API structure)
const sampleFeaturedShops = [
  {
    _id: "sample1",
    businessName: "Genius Tech",
    slug: "genius-tech",
    categories: [
      "Electronics & Media",
      "Home, Garden & Tools",
      "Fashion & Apparel",
    ],
    address: { district: "Kigali", sector: "Kigali" },
    stats: { followers: 0, products: 28, rating: 4.8 },
  },
  {
    _id: "sample2",
    businessName: "Fresh Facte Ltd",
    slug: "fresh-facte-ltd",
    categories: [
      "Groceries & Essentials",
      "Health, Beauty & Personal Care",
      "Baby & Kids",
    ],
    address: { district: "Kigali", sector: "Kigali" },
    stats: { followers: 0, products: 8, rating: 4.6 },
  },
];

export default function HomePage() {
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyShops, setNearbyShops] = useState([]);
  const [shopsExpanded, setShopsExpanded] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [deals, setDeals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [featuredShops, setFeaturedShops] = useState([]);
  const [heroProducts, setHeroProducts] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [galleryProducts, setGalleryProducts] = useState([]);
  const [galleryPage, setGalleryPage] = useState(1);
  const [galleryTotalPages, setGalleryTotalPages] = useState(1);

  useEffect(() => {
    getUserLocation();
    fetchCategories();
    fetchDeals();
    fetchBestSellers();
    fetchNewArrivals();
    fetchFeaturedShops();
    fetchHeroProducts();
    fetchGalleryProducts();
  }, []);

  useEffect(() => {
    fetchGalleryProducts();
  }, [galleryPage]);

  useEffect(() => {
    if (heroProducts.length === 0) return undefined;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroProducts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [heroProducts]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchDeals = async () => {
    try {
      const response = await fetch("/api/products/deals?limit=6");
      if (response.ok) {
        const data = await response.json();
        setDeals(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch deals:", error);
    }
  };

  const fetchBestSellers = async () => {
    try {
      const response = await fetch("/api/products/trending?limit=6");
      if (response.ok) {
        const data = await response.json();
        setBestSellers(data.data || sampleTrendingProducts);
      } else {
        console.error("Failed to fetch trending products:", response.status);
        // Fallback to sample data
        setBestSellers(sampleTrendingProducts);
      }
    } catch (error) {
      console.error("Failed to fetch best sellers:", error);
      // Fallback to sample data
      setBestSellers(sampleTrendingProducts);
    }
  };

  const fetchNewArrivals = async () => {
    try {
      const response = await fetch("/api/products/new-arrivals?limit=24");
      if (response.ok) {
        const data = await response.json();
        setNewArrivals(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch new arrivals:", error);
    }
  };

  const fetchFeaturedShops = async () => {
    try {
      const response = await fetch("/api/artisans?limit=6");
      if (response.ok) {
        const data = await response.json();
        setFeaturedShops(data.data || []);
      } else {
        // Fallback to sample data, transform to match expected structure
        const transformedSample = sampleFeaturedShops.map((shop) => ({
          _id: shop._id,
          store: {
            name: shop.businessName,
            location: {
              city: shop.address.district,
            },
            categories: shop.categories,
            rating: shop.stats.rating,
          },
          stats: shop.stats,
        }));
        setFeaturedShops(transformedSample);
      }
    } catch (error) {
      console.error("Failed to fetch featured shops:", error);
      // Fallback to sample data, transform to match expected structure
      const transformedSample = sampleFeaturedShops.map((shop) => ({
        _id: shop._id,
        store: {
          name: shop.businessName,
          location: {
            city: shop.address.district,
          },
          categories: shop.categories,
          rating: shop.stats.rating,
        },
        stats: shop.stats,
      }));
      setFeaturedShops(transformedSample);
    }
  };

  const fetchHeroProducts = async () => {
    try {
      const response = await fetch("/api/products/trending?limit=6");
      if (response.ok) {
        const data = await response.json();
        setHeroProducts(data.data || sampleTrendingProducts);
      } else {
        setHeroProducts(sampleTrendingProducts);
      }
    } catch (error) {
      console.error("Failed to fetch hero products:", error);
      setHeroProducts(sampleTrendingProducts);
    }
  };

  const fetchGalleryProducts = async () => {
    try {
      const response = await fetch(
        `/api/products/new-arrivals?limit=25&page=${galleryPage}`,
      );
      if (response.ok) {
        const data = await response.json();
        setGalleryProducts(data.data || []);
        setGalleryTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch gallery products:", error);
    }
  };

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
          const response = await fetch(
            `/api/nearby-shops?lat=${latitude}&lng=${longitude}&radius=10`,
          );
          if (response.ok) {
            const shops = await response.json();
            setNearbyShops(shops);
          }
        } catch (error) {
          console.error("Failed to fetch nearby shops:", error);
        }
      },
      (error) => {
        console.log("Location denied. Using default location.");
        setLocationError("Location access denied. Showing default results.");
        // Fallback to Kigali coordinates
        setUserLocation({ latitude: -1.9441, longitude: 30.0619 });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Split Screen Hero */}
      <div className="flex flex-col-reverse md:flex-row min-h-[70vh]">
        {/* Text Content */}
        <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="max-w-md text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              {heroProduct.headline}
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              {heroProduct.subheadline}
            </p>
            <div className="flex items-center gap-3 md:gap-4 flex-nowrap">
              <Link
                href="/search"
                className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-semibold py-2 px-4 md:py-3 md:px-8 rounded-lg text-sm md:text-lg transition-all duration-200 whitespace-nowrap"
              >
                {heroProduct.cta}
              </Link>
              <Link
                href="/about"
                className="text-gray-500 hover:text-gray-900 text-xs md:text-sm underline underline-offset-2 transition-colors duration-200 whitespace-nowrap"
              >
                discover more on myhipa.com
              </Link>
            </div>
          </div>
        </div>

        {/* Product Image */}
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
          <div className="relative w-full max-w-md h-80 md:h-96 overflow-hidden rounded-lg shadow-lg">
            {heroProducts.length > 0 && heroProducts[heroIndex] ? (
              <div className="relative w-full h-full group">
                <Image
                  src={
                    heroProducts[heroIndex].media?.[0]?.url || heroProduct.image
                  }
                  alt={heroProducts[heroIndex].title || "Featured Product"}
                  fill
                  className="object-cover transition-opacity duration-700"
                  key={heroIndex}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-white font-bold text-lg mb-1 line-clamp-2 drop-shadow-lg">
                    {heroProducts[heroIndex].title}
                  </h3>
                  <p className="text-white/80 text-sm mb-3 line-clamp-2 drop-shadow">
                    {heroProducts[heroIndex].description ||
                      "Discover this amazing product at a great price."}
                  </p>
                  <div className="flex items-center gap-2 md:gap-3 flex-nowrap">
                    <Link
                      href={`/product/${heroProducts[heroIndex].slug || heroProducts[heroIndex]._id}`}
                      className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-semibold py-1.5 px-3 md:py-2 md:px-5 rounded text-xs md:text-sm transition-all duration-200 whitespace-nowrap"
                    >
                      Shop Now
                    </Link>
                    <Link
                      href="/about"
                      className="text-white/70 hover:text-white text-[10px] md:text-xs underline underline-offset-2 transition-colors duration-200 whitespace-nowrap"
                    >
                      discover more on myhipa.com
                    </Link>
                  </div>
                </div>

                {/* Left Chevron */}
                <button
                  onClick={() =>
                    setHeroIndex(
                      (prev) =>
                        (prev - 1 + heroProducts.length) % heroProducts.length,
                    )
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                {/* Right Chevron */}
                <button
                  onClick={() =>
                    setHeroIndex((prev) => (prev + 1) % heroProducts.length)
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                {/* Indicator Dots */}
                <div className="absolute top-3 right-3 flex gap-1.5">
                  {heroProducts.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setHeroIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        i === heroIndex ? "bg-white w-5" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <Image
                src={heroProduct.image}
                alt="Featured Product"
                fill
                className="object-cover"
              />
            )}
          </div>
        </div>
      </div>

      {/* Search Panel */}
      <div className="px-4 py-6 bg-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Search Products
            </h2>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Featured Sellers
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {sampleSellers.map((seller) => (
              <div
                key={seller.id}
                className="flex-shrink-0 w-80 bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {seller.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      📍 {seller.distance}
                    </p>
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
              <div className="flex items-center gap-1">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  Shops Near You
                </h2>
              </div>
              {userLocation && (
                <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-xs font-medium text-blue-700">
                    {userLocation.latitude.toFixed(3)}°,{" "}
                    {userLocation.longitude.toFixed(3)}°
                  </span>
                </div>
              )}
              {locationError && (
                <p className="text-xs text-red-600">{locationError}</p>
              )}
            </div>

            {nearbyShops.length > 0 ? (
              <div>
                {/* Desktop: show all; Mobile: show 2 unless expanded */}
                <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {nearbyShops.map((shop) => (
                    <div
                      key={shop.id}
                      className="group relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-3 hover:shadow-lg transition-all duration-200 border border-slate-200 hover:border-blue-300 hover:-translate-y-1"
                    >
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-md">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="mb-2">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                          {shop.name}
                        </h3>
                        <div className="flex items-center gap-1 mt-1">
                          <svg
                            className="w-3 h-3 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                          </svg>
                          <span className="text-xs text-gray-500">
                            {shop.distance_km} km
                          </span>
                        </div>
                      </div>
                      <button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Visit
                      </button>
                    </div>
                  ))}
                </div>

                {/* Mobile: show limited items */}
                <div className="md:hidden">
                  <div className="grid grid-cols-2 gap-3">
                    {nearbyShops
                      .slice(0, shopsExpanded ? nearbyShops.length : 2)
                      .map((shop) => (
                        <div
                          key={shop.id}
                          className="group relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-3 hover:shadow-lg transition-all duration-200 border border-slate-200"
                        >
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-md">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="mb-2">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">
                              {shop.name}
                            </h3>
                            <div className="flex items-center gap-1 mt-1">
                              <svg
                                className="w-3 h-3 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                />
                              </svg>
                              <span className="text-xs text-gray-500">
                                {shop.distance_km} km
                              </span>
                            </div>
                          </div>
                          <button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            Visit
                          </button>
                        </div>
                      ))}
                  </div>
                  {/* Expand/Collapse Button */}
                  {nearbyShops.length > 2 && (
                    <div className="mt-3 flex justify-center">
                      <button
                        onClick={() => setShopsExpanded(!shopsExpanded)}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-200"
                      >
                        {shopsExpanded ? (
                          <>
                            <span>Show less</span>
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 15l7-7 7 7"
                              />
                            </svg>
                          </>
                        ) : (
                          <>
                            <span>+{nearbyShops.length - 2} more</span>
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="inline-flex items-center gap-1 text-gray-500">
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="text-sm">Locating nearby shops...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shop by Category - Gallery Design */}
      <div className="px-4 py-6 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header Section */}
          <div className="text-left mb-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-[#222222] mb-2 tracking-tight">
              Shop by <span className="text-[#222222]">Category</span>
            </h2>
            <p className="text-sm text-[#222222]/60">
              Discover curated collections tailored to your needs.
            </p>
          </div>

          {/* Categories Gallery Grid */}
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
            {categories.slice(0, 10).map((category, index) => {
              const isLarge = index === 0 || index === 5;
              const isWide = index === 2 || index === 7;
              return (
                <Link
                  key={category.id || index}
                  href={`/search?category=${category.slug}`}
                  className={`group relative bg-gray-100 overflow-hidden border border-gray-200/50 hover:border-gray-300 transition-all duration-300 hover:shadow-md ${
                    isLarge ? "row-span-2" : ""
                  } ${isWide ? "col-span-2" : ""}`}
                >
                  <div
                    className={`relative overflow-hidden ${
                      isLarge ? "h-[380px]" : "h-[185px]"
                    }`}
                  >
                    <Image
                      src={
                        category.image ||
                        category.featuredImage ||
                        `https://via.placeholder.com/400x300/e5e5e5/999999?text=${category.name}`
                      }
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500 grayscale-[30%] group-hover:grayscale-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

                    {/* Category Name */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-semibold text-white text-sm line-clamp-2 drop-shadow-lg">
                        {category.name}
                      </h3>
                      {category.productCount !== undefined && (
                        <p className="text-white/70 text-xs mt-0.5">
                          {category.productCount} items
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* View All Button */}
          <div className="text-center mt-8">
            <Link
              href="/categories"
              className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900 text-sm font-medium transition-colors duration-200"
            >
              View All Categories
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Deals Section */}
      <div className="px-4 py-6 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header Section */}
          <div className="text-left mb-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-[#222222] mb-2 tracking-tight">
              Today's <span className="text-[#222222]">Deals</span>
            </h2>
            <p className="text-sm text-[#222222]/60">
              Don't miss out on these amazing offers.
            </p>
          </div>

          {/* Deals Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1">
            {deals.slice(0, 6).map((deal, index) => (
              <Link
                key={deal._id}
                href={`/product/${deal.slug}`}
                className="group relative bg-gray-100 overflow-hidden border border-gray-200/50 hover:border-gray-300 transition-all duration-300 hover:shadow-md"
              >
                <div className="relative h-[190px] overflow-hidden">
                  <Image
                    src={
                      deal.media?.[0]?.url ||
                      "https://via.placeholder.com/400x300/e5e5e5/999999?text=Deal"
                    }
                    alt={deal.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

                  {/* Discount Badge */}
                  {deal.pricing?.compareAt && (
                    <div className="absolute top-2 left-2 h-5 px-2 bg-black/60 backdrop-blur-sm rounded-none flex items-center">
                      <span className="text-white text-[10px] font-semibold leading-none">
                        {Math.round(
                          (1 - deal.pricing.base / deal.pricing.compareAt) *
                            100,
                        )}
                        % OFF
                      </span>
                    </div>
                  )}

                  {/* Deal Info */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="font-semibold text-white text-sm line-clamp-2 drop-shadow-lg">
                      {deal.title}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      {deal.pricing?.base && (
                        <p className="text-white/70 text-xs">
                          {deal.pricing.base.toLocaleString()} RWF
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 ml-auto">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = `/product/${deal.slug}`;
                          }}
                          className="flex items-center justify-center transition-colors duration-200"
                        >
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = `/messages?product=${deal._id}&seller=${deal.seller?._id || deal.sellerId || ""}&ref=${encodeURIComponent(deal.title || "")}`;
                          }}
                          className="flex items-center justify-center transition-colors duration-200"
                        >
                          <svg
                            className="w-4 h-4 text-white rotate-[87deg]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center mt-6">
            <Link
              href="/deals"
              className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900 text-sm font-medium transition-colors duration-200"
            >
              View All Deals
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Best Sellers Section */}
      <div className="px-4 py-6 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header Section */}
          <div className="text-left mb-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-[#222222] mb-2 tracking-tight">
              Best <span className="text-[#222222]">Sellers</span>
            </h2>
            <p className="text-sm text-[#222222]/60">
              Discover what everyone's buying.
            </p>
          </div>

          {/* Best Sellers Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1">
            {bestSellers.slice(0, 6).map((product, index) => (
              <Link
                key={product._id}
                href={`/product/${product.slug}`}
                className="group relative bg-gray-100 overflow-hidden border border-gray-200/50 hover:border-gray-300 transition-all duration-300 hover:shadow-md"
              >
                <div className="relative h-[190px] overflow-hidden">
                  <Image
                    src={
                      product.media?.[0]?.url ||
                      "https://via.placeholder.com/400x300/e5e5e5/999999?text=Product"
                    }
                    alt={product.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

                  {/* Rank Badge */}
                  <div className="absolute top-2 left-2 h-5 px-2 bg-black/60 backdrop-blur-sm rounded-none flex items-center">
                    <span className="text-white text-[10px] font-semibold leading-none">
                      #{index + 1}
                    </span>
                  </div>

                  {/* Product Info */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="font-semibold text-white text-sm line-clamp-2 drop-shadow-lg">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      {product.pricing?.base && (
                        <p className="text-white/70 text-xs">
                          {product.pricing.base.toLocaleString()} RWF
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 ml-auto">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = `/product/${product.slug}`;
                          }}
                          className="flex items-center justify-center transition-colors duration-200"
                        >
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = `/messages?product=${product._id}&seller=${product.seller?._id || product.sellerId || ""}&ref=${encodeURIComponent(product.title || "")}`;
                          }}
                          className="flex items-center justify-center transition-colors duration-200"
                        >
                          <svg
                            className="w-4 h-4 text-white rotate-[87deg]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center mt-6">
            <Link
              href="/best-sellers"
              className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900 text-sm font-medium transition-colors duration-200"
            >
              View All Best Sellers
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* New Arrivals Section */}
      <div className="px-4 py-6 bg-gradient-to-br from-[#f5f5dc] via-[#1a1a1a] to-[#f5f5dc] relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#d4af37]/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#f5f5dc]/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header Section */}
          <div className="text-left mb-8">
            <div className="inline-flex items-center gap-1 bg-[#1a1a1a]/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4 border border-[#1a1a1a]/20">
              <svg
                className="w-5 h-5 text-[#d4af37]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium text-[#1a1a1a]/90">
                Fresh Finds
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold text-[#1a1a1a] mb-2 tracking-tight">
              New{" "}
              <span className="bg-gradient-to-r from-[#d4af37] via-[#f5f5dc] to-[#d4af37] bg-clip-text text-transparent">
                Arrivals
              </span>
            </h2>
            <p className="text-sm text-[#1a1a1a]/70">
              Be the first to discover the latest products. Fresh stock just
              landed!
            </p>
          </div>

          {/* New Arrivals Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1">
            {newArrivals.slice(0, 6).map((product, index) => (
              <Link
                key={product._id}
                href={`/product/${product.slug}`}
                className="group relative bg-[#1a1a1a]/90 backdrop-blur-sm rounded-[2px] overflow-hidden border border-[#f5f5dc]/50 hover:border-[#d4af37] transition-all duration-500 hover:shadow-xl hover:shadow-[#d4af37]/20 hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Card Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#f5f5dc]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Image Section */}
                <div className="relative h-[190px] overflow-hidden">
                  <Image
                    src={
                      product.media?.[0]?.url ||
                      "https://via.placeholder.com/400x300/1a1a1a/f5f5dc?text=New"
                    }
                    alt={product.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/60 via-[#1a1a1a]/30 to-transparent"></div>

                  {/* New Badge */}
                  <div className="absolute top-3 left-3 h-5 px-2 bg-gradient-to-br from-[#d4af37] to-[#b8960c] rounded-none flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                    <span className="text-[10px] font-bold text-white leading-none">
                      NEW
                    </span>
                  </div>

                  {/* Product Info */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="font-bold text-white text-base mb-1 drop-shadow-lg group-hover:text-[#d4af37] transition-colors duration-300 line-clamp-2">
                      {product.title}
                    </h3>
                  </div>

                  {/* Hover Arrow */}
                  <div className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </div>
                </div>

                {/* Stats Section */}
                <div className="p-3 bg-gradient-to-b from-[#f5f5dc]/50 to-[#f5f5dc]/80">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 bg-[#1a1a1a]/20 rounded flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-[#1a1a1a]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-[#1a1a1a]/70">Price</p>
                        <p className="text-xs font-bold text-[#1a1a1a]">
                          RWF {product.pricing?.base?.toLocaleString() || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 bg-[#d4af37]/20 rounded flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-[#d4af37]"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-[#1a1a1a]/70">Rating</p>
                        <p className="text-xs font-bold text-[#d4af37]">
                          {product.stats?.avgRating?.toFixed(1) || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Stats */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#1a1a1a]/20">
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-3 h-3 text-[#1a1a1a]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-xs text-[#1a1a1a]/70">
                        {product.createdAt
                          ? new Date(product.createdAt).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )
                          : "Recent"}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#d4af37] to-[#b8960c] text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md shadow-[#d4af37]/30 group-hover:shadow-[#d4af37]/50 transition-shadow duration-300">
                      View
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center mt-8">
            <Link
              href="/new-arrivals"
              className="group inline-flex items-center gap-1 bg-[#1a1a1a]/90 backdrop-blur-sm border border-[#f5f5dc] text-[#f5f5dc] px-6 py-3 rounded-xl hover:bg-[#1a1a1a] hover:border-[#d4af37] transition-all duration-300 font-semibold hover:shadow-lg hover:shadow-[#d4af37]/20"
            >
              <span>View All New Arrivals</span>
              <div className="w-6 h-6 bg-[#d4af37]/20 rounded-full flex items-center justify-center group-hover:bg-[#d4af37]/30 transition-colors">
                <svg
                  className="w-3 h-3 text-[#d4af37]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Products Gallery */}
      <div className="px-4 py-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header Section */}
          <div className="text-left mb-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-[#222222] mb-2 tracking-tight">
              Recent{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-400 bg-clip-text text-transparent">
                Products
              </span>
            </h2>
            <p className="text-sm text-[#222222]/70">
              Browse our latest arrivals and add to cart.
            </p>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
            {galleryProducts.slice(0, 25).map((product, index) => {
              const isLarge = index % 7 === 0;
              const isWide = index % 5 === 2;
              return (
                <Link
                  key={product._id || index}
                  href={`/product/${product.slug || product._id}`}
                  className={`group relative bg-white overflow-hidden border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg ${
                    isLarge ? "row-span-2" : ""
                  } ${isWide ? "col-span-2" : ""}`}
                >
                  <div
                    className={`relative overflow-hidden ${
                      isLarge ? "h-[380px]" : "h-[190px]"
                    }`}
                  >
                    <Image
                      src={
                        product.media?.[0]?.url ||
                        "https://via.placeholder.com/400x300/1a1a1a/f5f5dc?text=Product"
                      }
                      alt={product.title || "Product"}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Price Badge */}
                    {product.pricing?.base && (
                      <div className="absolute top-2 left-2 h-5 px-2 bg-black/60 backdrop-blur-sm rounded-none flex items-center">
                        <span className="text-white text-[10px] font-semibold leading-none">
                          {product.pricing.base.toLocaleString()} RWF
                        </span>
                      </div>
                    )}

                    {/* Add to Cart Button */}
                    <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `/product/${product.slug || product._id}`;
                        }}
                        className="w-full bg-white/90 hover:bg-white text-gray-900 text-[10px] font-semibold py-1.5 px-3 rounded-none shadow-md transition-colors duration-200"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-2">
                    <h3 className="text-xs font-medium text-gray-900 line-clamp-2 leading-tight">
                      {product.title || "Product"}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {galleryTotalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-8">
              {Array.from(
                { length: Math.min(galleryTotalPages, 5) },
                (_, i) => i + 1,
              ).map((page) => (
                <button
                  key={page}
                  onClick={() => setGalleryPage(page)}
                  className={`w-9 h-9 flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                    galleryPage === page
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
              {galleryTotalPages > 5 && (
                <>
                  <span className="text-gray-400 px-1">...</span>
                  <button
                    onClick={() => setGalleryPage(galleryTotalPages)}
                    className="w-9 h-9 flex items-center justify-center text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all duration-200"
                  >
                    {galleryTotalPages}
                  </button>
                </>
              )}
              {galleryPage < galleryTotalPages && (
                <button
                  onClick={() => setGalleryPage((prev) => prev + 1)}
                  className="flex items-center gap-1 h-9 px-4 text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all duration-200"
                >
                  Next
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
