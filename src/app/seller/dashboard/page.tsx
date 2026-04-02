'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

interface DashboardData {
  seller: {
    id: string;
    storeName: string;
    storeSlug: string;
    tier: string;
    kycStatus: string;
    onboardingStep: string;
  };
  kpis: {
    revenue: {
      today: number;
      week: number;
      month: number;
      total: number;
      change: string | number;
    };
    orders: {
      pending: number;
      processing: number;
      shipped: number;
      delivered: number;
      completed: number;
      disputed: number;
      cancelled: number;
      total: number;
    };
    escrow: {
      balance: number;
      releasingToday: number;
    };
    wallet: {
      available: number;
      pending: number;
      held: number;
    };
    rating: {
      average: number;
      count: number;
    };
    messages: {
      unread: number;
    };
  };
  alerts: Array<{
    type: string;
    icon: string;
    message: string;
    link: string;
  }>;
  recentActivity: Array<{
    type: string;
    icon: string;
    description: string;
    amount?: number;
    timestamp: string;
    link: string;
  }>;
  revenueChart: Array<{
    date: string;
    revenue: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    buyer: string;
    buyerAvatar?: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    stock: number;
    lowStockThreshold: number;
  }>;
  outOfStockProducts: Array<{
    id: string;
    name: string;
  }>;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: {
    primary: string;
    secondary?: string;
    tertiary?: string;
    path: string[];
  };
  media: Array<{
    url: string;
    type: string;
    alt?: string;
  }>;
  pricing: {
    base: number;
    compareAt?: number;
    currency: string;
    bulkPricing: Array<{
      minQty: number;
      price: number;
    }>;
  };
  variants: Array<{
    name: string;
    options: string[];
    stock: number;
    price?: number;
  }>;
  inventory: {
    totalStock: number;
    lowStockThreshold: number;
    trackInventory: boolean;
    allowBackorder: boolean;
  };
  shipping: {
    weight: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    requiresShipping: boolean;
    digitalDownload: boolean;
  };
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    customSlug?: string;
  };
  tags: string[];
  condition: string;
  status: string;
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

interface SuggestedSeller {
  id: string;
  storeName: string;
  storeSlug: string;
  avatar?: string;
  tier: string;
  productCount: number;
  rating: number;
}

const NAV_ITEMS = [
  { 
    id: 'overview', 
    label: 'Overview', 
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path d="M3 13h1v7c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-7h1a1 1 0 00.7-1.7l-9-9a1 1 0 00-1.4 0l-9 9A1 1 0 003 13zm7 7v-5h4v5h-4zm2-15.6l7 7V20h-3v-5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v5H5v-8.6l7-7z" fill="currentColor"/>
      </svg>
    ), 
    href: '/seller/dashboard' 
  },
  { 
    id: 'orders', 
    label: 'Orders', 
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path d="M9 5H7c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-2M9 5c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2M9 5c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2m-6 9l2 2 4-4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ), 
    href: '/seller/orders' 
  },
  { 
    id: 'products', 
    label: 'Products', 
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ), 
    href: '/seller/products' 
  },
  { 
    id: 'messages', 
    label: 'Messages', 
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ), 
    href: '/seller/messages' 
  },
  { 
    id: 'analytics', 
    label: 'Analytics', 
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ), 
    href: '/seller/analytics' 
  },
  { 
    id: 'finance', 
    label: 'Finance', 
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ), 
    href: '/seller/finance' 
  },
  { 
    id: 'ads', 
    label: 'Ads', 
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ), 
    href: '/seller/ads' 
  },
  { 
    id: 'community', 
    label: 'Community', 
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ), 
    href: '/seller/community' 
  },
  { 
    id: 'settings', 
    label: 'Settings', 
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ), 
    href: '/seller/settings' 
  },
];

export default function SellerDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [revenuePeriod, setRevenuePeriod] = useState<'today' | 'week' | 'month'>('month');
  const [suggestedSellers, setSuggestedSellers] = useState<SuggestedSeller[]>([]);
  const [followedSellers, setFollowedSellers] = useState<Set<string>>(new Set());
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchSuggestedSellers();
    fetchProducts();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const token = useAuthStore.getState().token;
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await fetch('/api/seller/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuggestedSellers = async () => {
    try {
      const token = useAuthStore.getState().token;
      if (!token) return;
      
      const response = await fetch('/api/sellers/top?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const sellers = await response.json();
        setSuggestedSellers(sellers.sellers || []);
      }
    } catch (err) {
      console.error('Failed to fetch suggested sellers:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const token = useAuthStore.getState().token;
      if (!token) return;
      
      const response = await fetch('/api/seller/products?limit=8&status=active', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleFollowToggle = async (sellerId: string) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    const isCurrentlyFollowed = followedSellers.has(sellerId);
    
    try {
      const response = await fetch(`/api/sellers/${sellerId}/follow`, {
        method: isCurrentlyFollowed ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setFollowedSellers(prev => {
          const newSet = new Set(prev);
          if (isCurrentlyFollowed) {
            newSet.delete(sellerId);
          } else {
            newSet.add(sellerId);
          }
          return newSet;
        });
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
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

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return then.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      shipped: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
      completed: 'bg-green-100 text-green-700',
      disputed: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {getTimeOfDay()}, {user?.displayName || 'Seller'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-500 text-sm">{data.seller.storeName}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  data.seller.tier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                  data.seller.tier === 'silver' ? 'bg-gray-100 text-gray-600' :
                  data.seller.tier === 'pro' ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {data.seller.tier === 'gold' ? 'Gold Seller' :
                   data.seller.tier === 'silver' ? 'Silver Seller' :
                   data.seller.tier === 'pro' ? 'Pro Seller' :
                   'Standard'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/seller/notifications" className="relative p-2 hover:bg-gray-100 rounded">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {data.kpis.messages.unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {data.kpis.messages.unread}
                  </span>
                )}
              </Link>
              <Link href="/seller/settings" className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <span className="text-sm font-medium text-gray-600">{user?.displayName?.charAt(0) || 'S'}</span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
          <nav className="p-4">
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === item.id
                        ? 'bg-teal-50 text-teal-700 border-l-4 border-teal-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                    {item.id === 'orders' && data.kpis.orders.pending > 0 && (
                      <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {data.kpis.orders.pending}
                      </span>
                    )}
                    {item.id === 'messages' && data.kpis.messages.unread > 0 && (
                      <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {data.kpis.messages.unread}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Suggested Sellers */}
          <div className="p-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Suggested Sellers</h3>
            <div className="space-y-3">
              {suggestedSellers.length === 0 ? (
                <p className="text-xs text-gray-500">No suggestions available</p>
              ) : (
                suggestedSellers.map((seller) => (
                  <div key={seller.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      {seller.avatar ? (
                        <img src={seller.avatar} alt={seller.storeName} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <span className="text-sm font-medium text-gray-600">
                          {seller.storeName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/store/${seller.storeSlug}`}
                        className="text-sm font-medium text-gray-900 hover:text-teal-600 truncate block"
                      >
                        {seller.storeName}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{seller.productCount} products</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          {seller.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleFollowToggle(seller.id)}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                        followedSellers.has(seller.id)
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {followedSellers.has(seller.id) ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Alerts Strip */}
          {data.alerts.length > 0 && (
            <div className="mb-6">
              <div className="flex gap-3 flex-wrap">
                {data.alerts.map((alert, index) => (
                  <Link
                    key={index}
                    href={alert.link}
                    className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium ${
                      alert.type === 'error' ? 'bg-red-50 text-red-700 hover:bg-red-100' :
                      alert.type === 'warning' ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' :
                      'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    <span>{alert.icon}</span>
                    <span>{alert.message}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Revenue Card */}
            <div className="bg-white rounded-lg p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex gap-1">
                  {(['today', 'week', 'month'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setRevenuePeriod(period)}
                      className={`px-2 py-1 text-xs rounded ${
                        revenuePeriod === period
                          ? 'bg-teal-600 text-white'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.kpis.revenue[revenuePeriod])}
              </div>
              <div className="text-sm text-gray-500 mt-1">Revenue</div>
              {data.kpis.revenue.change && (
                <div className={`text-xs mt-2 ${
                  typeof data.kpis.revenue.change === 'string' && data.kpis.revenue.change.startsWith('+')
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {typeof data.kpis.revenue.change === 'string' 
                    ? data.kpis.revenue.change 
                    : `${data.kpis.revenue.change > 0 ? '+' : ''}${data.kpis.revenue.change}%`} vs last month
                </div>
              )}
            </div>

            {/* Orders Card */}
            <div className="bg-white rounded-lg p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                {data.kpis.orders.pending > 0 && (
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {data.kpis.orders.pending} pending
              </div>
              <div className="text-sm text-gray-500 mt-1">Orders</div>
              <div className="text-xs text-gray-400 mt-2">
                {data.kpis.orders.processing} processing · {data.kpis.orders.shipped} shipped · {data.kpis.orders.delivered} delivered
              </div>
            </div>

            {/* Escrow Card */}
            <div className="bg-white rounded-lg p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.kpis.escrow.balance)}
              </div>
              <div className="text-sm text-gray-500 mt-1">In Escrow</div>
              {data.kpis.escrow.releasingToday > 0 && (
                <div className="text-xs text-green-600 mt-2">
                  {formatCurrency(data.kpis.escrow.releasingToday)} releasing today
                </div>
              )}
            </div>

            {/* Rating Card */}
            <div className="bg-white rounded-lg p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {data.kpis.rating.average.toFixed(1)} ★
              </div>
              <div className="text-sm text-gray-500 mt-1">Rating</div>
              <div className="text-xs text-gray-400 mt-2">
                {data.kpis.rating.count} reviews
              </div>
            </div>
          </div>

          {/* Your Products Grid */}
          <div className="mt-6 bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Your Products</h3>
              <Link href="/seller/products" className="text-sm text-teal-600 hover:underline">
                View All
              </Link>
            </div>
            {productsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-gray-500 mb-3">No products yet</p>
                <Link 
                  href="/seller/products/new"
                  className="inline-block px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                >
                  Add Your First Product
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/seller/products/${product.id}/edit`}
                    className="group block bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square bg-gray-100 relative">
                      {product.media && product.media.length > 0 ? (
                        <img 
                          src={product.media[0].url} 
                          alt={product.media[0].alt || product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          product.status === 'active' ? 'bg-green-100 text-green-700' :
                          product.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {product.status}
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-teal-600 transition-colors">
                        {product.title}
                      </h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(product.pricing.base)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {product.inventory.totalStock} in stock
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Activity & Orders */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Activity */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-900">Recent Activity</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {data.recentActivity.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No recent activity
                    </div>
                  ) : (
                    data.recentActivity.map((activity, index) => (
                      <Link
                        key={index}
                        href={activity.link}
                        className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-lg text-gray-600">{activity.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">{activity.description}</p>
                          <p className="text-xs text-gray-500">{getRelativeTime(activity.timestamp)}</p>
                        </div>
                        {activity.amount && (
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(activity.amount)}
                          </div>
                        )}
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Recent Orders</h2>
                  <Link href="/seller/orders" className="text-sm text-teal-600 hover:underline">
                    View All
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.recentOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            No orders yet
                          </td>
                        </tr>
                      ) : (
                        data.recentOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              #{order.orderNumber}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{order.buyer}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {order.items[0]?.name}
                              {order.items.length > 1 && ` +${order.items.length - 1} more`}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">
                              {formatCurrency(order.totalAmount)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column - Quick Actions & Stats */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/seller/products/new"
                    className="flex flex-col items-center gap-2 p-4 bg-teal-50 rounded hover:bg-teal-100 transition-colors"
                  >
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm font-medium text-teal-700">Add Product</span>
                  </Link>
                  <Link
                    href="/seller/orders"
                    className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                  >
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="text-sm font-medium text-blue-700">View Orders</span>
                  </Link>
                  <Link
                    href="/seller/finance"
                    className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded hover:bg-green-100 transition-colors"
                  >
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-green-700">Withdraw</span>
                  </Link>
                  <Link
                    href="/seller/ads"
                    className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded hover:bg-purple-100 transition-colors"
                  >
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                    <span className="text-sm font-medium text-purple-700">Marketing</span>
                  </Link>
                </div>
              </div>

              {/* Wallet Summary */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Wallet</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Available</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(data.kpis.wallet.available)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Pending</span>
                    <span className="text-sm font-medium text-yellow-600">
                      {formatCurrency(data.kpis.wallet.pending)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Held</span>
                    <span className="text-sm font-medium text-red-600">
                      {formatCurrency(data.kpis.wallet.held)}
                    </span>
                  </div>
                </div>
                <Link
                  href="/seller/finance"
                  className="mt-4 w-full py-2 bg-teal-600 text-white rounded text-sm font-medium hover:bg-teal-700 transition-colors block text-center"
                >
                  Withdraw Funds
                </Link>
              </div>

              {/* Top Products */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Top Products</h3>
                {data.topProducts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No sales data yet</p>
                ) : (
                  <div className="space-y-3">
                    {data.topProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{product.name}</div>
                          <div className="text-xs text-gray-500">{product.sales} sales</div>
                        </div>
                        <div className="text-sm font-semibold">{formatCurrency(product.revenue)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Low Stock Alert */}
              {(data.lowStockProducts.length > 0 || data.outOfStockProducts.length > 0) && (
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Stock Alerts</h3>
                  <div className="space-y-2">
                    {data.outOfStockProducts.map((product) => (
                      <div key={product.id} className="flex items-center gap-2 p-2 bg-red-50 rounded">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        <span className="text-sm text-red-700 truncate">{product.name}</span>
                        <span className="text-xs text-red-500 ml-auto">Out of stock</span>
                      </div>
                    ))}
                    {data.lowStockProducts.map((product) => (
                      <div key={product.id} className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                        <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-sm text-yellow-700 truncate">{product.name}</span>
                        <span className="text-xs text-yellow-500 ml-auto">{product.stock} left</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="mt-6 bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Revenue Trend (7 Days)</h3>
              <Link href="/seller/analytics" className="text-sm text-teal-600 hover:underline">
                View Analytics
              </Link>
            </div>
            <div className="h-48 flex items-end gap-2">
              {data.revenueChart.map((day, index) => {
                const maxRevenue = Math.max(...data.revenueChart.map(d => d.revenue));
                const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                const isToday = index === data.revenueChart.length - 1;
                
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className={`w-full rounded-t transition-all ${
                        isToday ? 'bg-teal-600' : 'bg-teal-200'
                      }`}
                      style={{ height: `${Math.max(height, 5)}%` }}
                    ></div>
                    <span className="text-xs text-gray-400">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
