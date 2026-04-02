'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { formatRWF } from '@/lib/utils/currency';


export default function Navbar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [isFading, setIsFading] = useState(true);

  const productSuggestions = [
    'electric car',
    'mobile telephone',
    'air pods',
    'laptop computer',
    'smart watch',
    'wireless headphones',
    'gaming console',
    'digital camera',
    'smart home devices',
    'fitness tracker',
    'tablet device',
    'bluetooth speaker'
  ];

  const { items, getTotalItems, getSubtotal, removeItem } = useCartStore();
  const { isAuthenticated, user, logout } = useAuthStore();


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  // Fade animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(false);
      setTimeout(() => {
        setCurrentPlaceholder((prev) => (prev + 1) % productSuggestions.length);
        setIsFading(true);
      }, 300); // Brief fade transition
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [productSuggestions.length]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black shadow-lg">
      {/* Top Row - Black Background (60%) */}
      <div className="bg-black">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-6">
            {/* Left: Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-3">
                <div className="relative">
                  <Image
                    src="/hipa-logo.svg"
                    alt="hipa.com"
                    width={40}
                    height={40}
                    className="drop-shadow-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-amber-500/20 rounded-lg"></div>
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent drop-shadow-sm">
                    hipa
                  </span>
                  <span className="font-semibold text-xs text-gray-300 -mt-1 tracking-wider">
                    .com
                  </span>
                </div>
              </Link>
            </div>

            {/* Center: Search Bar */}
            <div className="flex-1 max-w-md mx-auto">
              <form onSubmit={handleSearch} className="hidden md:block">
                <div className="flex">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={productSuggestions[currentPlaceholder]}
                      className={`w-full px-4 py-2 pl-10 pr-4 rounded-l-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-opacity duration-300 ${
                        isFading ? 'opacity-100' : 'opacity-70'
                      }`}
                    />
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-700 text-white rounded-r-lg hover:bg-amber-800 font-medium transition-colors whitespace-nowrap"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Utility Icons and CTA */}
            <div className="flex items-center gap-6">
              {/* Deliver to */}
              <div className="hidden lg:flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-300">Deliver to</span>
                <span className="font-medium">Kigali</span>
              </div>

              {/* Language Selector */}
              <div className="relative">
                <button
                  onMouseEnter={() => setShowLanguageDropdown(true)}
                  onMouseLeave={() => setShowLanguageDropdown(false)}
                  className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  <span>EN</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Language Dropdown */}
                {showLanguageDropdown && (
                  <div className="absolute top-full right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                      <span className="font-medium">🇺🇸</span> English
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                      <span className="font-medium">🇫🇷</span> Français
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                      <span className="font-medium">🇷🇼</span> Kinyarwanda
                    </button>
                  </div>
                )}
              </div>

              {/* Cart Subtotal Pill */}
              {isAuthenticated ? (
                <div
                  className="relative"
                  onMouseEnter={() => setShowCartDropdown(true)}
                  onMouseLeave={() => setShowCartDropdown(false)}
                >
                  <Link href="/cart" className="flex items-center bg-gray-800/80 border border-gray-700/50 rounded-full px-4 py-2 backdrop-blur-sm hover:bg-gray-700/80 transition-colors">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-sm font-medium text-white">
                        {formatRWF(getSubtotal())}
                      </span>
                      {getTotalItems() > 0 && (
                        <span className="w-5 h-5 bg-amber-600 text-black text-xs font-bold rounded-full flex items-center justify-center">
                          {getTotalItems()}
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Cart Dropdown */}
                  {showCartDropdown && items.length > 0 && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                      <div className="p-3 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Cart ({getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'})</h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {items.slice(0, 3).map((item) => (
                          <div key={`${item.productId}-${item.variantId || 'default'}`} className="p-3 border-b border-gray-100 flex items-center gap-3 hover:bg-gray-50">
                            <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              {item.image ? (
                                <Image src={item.image} alt={item.title} fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">📦</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                              <p className="text-xs text-gray-500">{formatRWF(item.price)} × {item.quantity}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeItem(item.productId, item.variantId);
                              }}
                              className="text-gray-400 hover:text-red-500 p-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      {items.length > 3 && (
                        <div className="p-2 text-center text-sm text-gray-500 bg-gray-50">
                          +{items.length - 3} more items
                        </div>
                      )}
                      <div className="p-3 border-t border-gray-200 bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-900">Subtotal</span>
                          <span className="font-bold text-gray-900">{formatRWF(getSubtotal())}</span>
                        </div>
                        <Link
                          href="/cart"
                          className="block w-full py-2 bg-amber-600 text-white text-center rounded-lg font-medium hover:bg-amber-700"
                        >
                          View Cart
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Currency Selector for non-authenticated users */
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowCurrencyDropdown(true)}
                    onMouseLeave={() => setShowCurrencyDropdown(false)}
                    className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>RWF</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Currency Dropdown */}
                  {showCurrencyDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                      <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">🇷🇼 RWF</button>
                      <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">🇺🇸 USD</button>
                      <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">🇪🇺 EUR</button>
                    </div>
                  )}
                </div>
              )}

              {/* Account */}
              {isAuthenticated ? (
                <div
                  className="relative"
                  onMouseEnter={() => setShowProfileDropdown(true)}
                  onMouseLeave={() => setShowProfileDropdown(false)}
                >
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="hidden lg:inline text-sm">
                      {user?.displayName || 'Account'}
                    </span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Link>

                  {/* Profile Dropdown */}
                  {showProfileDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                      <div className="py-2">
                        <Link
                          href="/profile"
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="black" stroke="black" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="font-medium">Profile</span>
                        </Link>
                        <Link
                          href={user?.role === 'seller' || user?.role === 'both' ? '/seller/dashboard' : '/dashboard'}
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="black" stroke="black" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                          <span className="font-medium">Dashboard</span>
                        </Link>
                        <Link
                          href={user?.role === 'seller' || user?.role === 'both' ? '/seller/settings' : '/settings'}
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="black" stroke="black" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-medium">Settings</span>
                        </Link>
                        <button
                          onClick={() => {
                            // Toggle theme logic here
                            document.documentElement.classList.toggle('dark');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="black" stroke="black" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                          </svg>
                          <span className="font-medium">Theme Toggle</span>
                        </button>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button
                          onClick={async () => {
                            // Call logout API to clear cookie
                            await fetch('/api/auth/logout', { method: 'POST' });
                            // Clear local state
                            logout();
                            router.push('/login');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="black" stroke="black" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span className="font-medium">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="hidden lg:inline text-sm">Sign In</span>
                </Link>
              )}

              {/* Create Account CTA */}
              {!isAuthenticated && (
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors text-sm"
                >
                  Create Account
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-gray-300 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <form onSubmit={handleSearch} className="mt-4 md:hidden">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, sellers..."
                className="w-full px-4 py-3 pl-12 pr-4 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom Row - Beige Background (30%) */}
      <div className="bg-amber-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <nav className="flex items-center justify-between">
            {/* Left: Categories Dropdown */}
            <div className="flex items-center gap-6">
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors font-medium text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  All Categories
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Categories Dropdown Menu */}
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <Link href="/search?category=electronics" className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-600">
                      📱 Electronics
                    </Link>
                    <Link href="/search?category=fashion" className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-600">
                      👕 Fashion & Apparel
                    </Link>
                    <Link href="/search?category=home" className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-600">
                      🏠 Home & Kitchen
                    </Link>
                    <Link href="/search?category=beauty" className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-600">
                      💄 Beauty & Health
                    </Link>
                    <Link href="/search?category=sports" className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-600">
                      ⚽ Sports & Outdoors
                    </Link>
                    <Link href="/search?category=books" className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-600">
                      📚 Books & Education
                    </Link>
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <Link href="/search" className="block px-4 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50">
                        View All Categories →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-6">
                <Link href="/search" className="text-gray-700 hover:text-amber-600 font-medium text-sm transition-colors">
                  Find Products
                </Link>
                <Link href="/sellers" className="text-gray-700 hover:text-amber-600 font-medium text-sm transition-colors">
                  Find Sellers
                </Link>
                <Link href="/corporate" className="text-gray-700 hover:text-amber-600 font-medium text-sm transition-colors">
                  Corporate
                </Link>
                <Link href="/community" className="text-gray-700 hover:text-amber-600 font-medium text-sm transition-colors">
                  Community
                </Link>
                <Link href="/help" className="text-gray-700 hover:text-amber-600 font-medium text-sm transition-colors">
                  Help
                </Link>
              </div>
            </div>

            {/* Right: Additional Links */}
            <div className="hidden lg:flex items-center gap-6">
              <Link href="/sell" className="text-gray-700 hover:text-amber-600 font-medium text-sm transition-colors">
                Start Selling
              </Link>
              <Link href="/trade-assurance" className="text-gray-700 hover:text-amber-600 font-medium text-sm transition-colors">
                Trade Assurance
              </Link>
              <Link href="/logistics" className="text-gray-700 hover:text-amber-600 font-medium text-sm transition-colors">
                Logistics
              </Link>
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-black border-t border-gray-800">
          <nav className="px-4 py-4 space-y-3">
            <Link
              href="/search"
              className="block px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Find Products
            </Link>
            <Link
              href="/sellers"
              className="block px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Find Sellers
            </Link>
            <Link
              href="/corporate"
              className="block px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Corporate
            </Link>
            <Link
              href="/community"
              className="block px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Community
            </Link>
            <Link
              href="/help"
              className="block px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Help
            </Link>
            <div className="border-t border-gray-700 pt-3 mt-3">
              <Link
                href="/sell"
                className="block px-4 py-2 text-amber-400 hover:bg-white/10 rounded-lg transition-colors font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Start Selling
              </Link>
              <Link
                href="/trade-assurance"
                className="block px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Trade Assurance
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
