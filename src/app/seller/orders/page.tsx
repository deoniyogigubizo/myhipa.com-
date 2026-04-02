'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface Order {
  id: string;
  orderNumber: string;
  buyer: {
    id: string;
    name: string;
    avatar?: string;
    location: {
      city: string;
      country: string;
    };
  };
  items: Array<{
    id: string;
    name: string;
    image?: string;
    quantity: number;
    price: number;
    variant?: string;
  }>;
  totalAmount: number;
  shippingFee: number;
  platformFee: number;
  sellerPayout: number;
  status: string;
  paymentStatus: string;
  shippingAddress?: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    country: string;
    notes?: string;
  };
  trackingNumber?: string;
  courierName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
}

interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function SellerOrders() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const tabs = [
    { id: 'all', label: 'All', count: 0 },
    { id: 'pending', label: 'New', count: 0 },
    { id: 'processing', label: 'Processing', count: 0 },
    { id: 'shipped', label: 'Shipped', count: 0 },
    { id: 'delivered', label: 'Delivered', count: 0 },
    { id: 'completed', label: 'Completed', count: 0 },
    { id: 'disputed', label: 'Disputed', count: 0 },
    { id: 'cancelled', label: 'Cancelled', count: 0 }
  ];

  useEffect(() => {
    fetchOrders();
  }, [activeTab, currentPage, searchQuery]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const token = useAuthStore.getState().token;
      if (!token) {
        throw new Error('No authentication token found');
      }
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

      if (activeTab !== 'all') {
        params.append('status', activeTab);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/seller/orders?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data: OrdersResponse = await response.json();
      setOrders(data.orders);
      setTotalPages(data.pagination.pages);
      setTotalOrders(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  async function handleMessageBuyer(buyerId: string, orderId: string) {
    if (isStartingChat) return;

    try {
      setIsStartingChat(true);

      // Create or get existing conversation
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: buyerId,
          orderId: orderId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Navigate to messages page with conversation open
        router.push(`/messages?conversation=${data.conversationId}`);
      } else {
        alert(data.error || 'Failed to start conversation');
      }
    } catch (err) {
      console.error('Error starting conversation:', err);
      alert('Failed to start conversation. Please try again.');
    } finally {
      setIsStartingChat(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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

  const getSLAWarning = (order: Order) => {
    if (order.status !== 'processing') return null;
    
    const now = new Date();
    const createdAt = new Date(order.createdAt);
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceCreation > 48) {
      return { text: 'Overdue', color: 'text-red-600' };
    }
    if (hoursSinceCreation > 24) {
      return { text: 'Ship within 24h', color: 'text-yellow-600' };
    }
    return null;
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
              <p className="text-sm text-gray-500">{totalOrders} total orders</p>
            </div>
            <Link href="/seller/dashboard" className="text-sm text-teal-600 hover:underline">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="overflow-x-auto">
            <nav className="flex items-center gap-1 p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-teal-100 text-teal-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by order number, buyer name, or product..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {error ? (
            <div className="p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={fetchOrders}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Retry
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📦</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-500">
                {activeTab === 'all' 
                  ? "You haven't received any orders yet"
                  : `No ${activeTab} orders`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {orders.map((order) => {
                const slaWarning = getSLAWarning(order);
                
                return (
                  <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                        {order.items[0]?.image ? (
                          <img 
                            src={order.items[0].image} 
                            alt={order.items[0].name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-2xl">📦</span>
                          </div>
                        )}
                      </div>

                      {/* Order Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <Link 
                                href={`/seller/orders/${order.id}`}
                                className="font-medium text-gray-900 hover:text-teal-600"
                              >
                                #{order.orderNumber}
                              </Link>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                              {slaWarning && (
                                <span className={`text-xs font-medium ${slaWarning.color}`}>
                                  ⚠️ {slaWarning.text}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {order.buyer.name} · {order.buyer.location.city}, {order.buyer.location.country}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">
                              {formatCurrency(order.totalAmount)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {getRelativeTime(order.createdAt)}
                            </div>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded">
                              <span className="text-sm text-gray-700">{item.name}</span>
                              <span className="text-xs text-gray-500">×{item.quantity}</span>
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="mt-3 flex items-center gap-2">
                          <Link
                            href={`/seller/orders/${order.id}`}
                            className="px-3 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700"
                          >
                            View Details
                          </Link>
                          {order.status === 'processing' && (
                            <button className="px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
                              Mark Shipped
                            </button>
                          )}
                          <button 
                            onClick={() => handleMessageBuyer(order.buyer.id, order.id)}
                            className="px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
                          >
                            Message Buyer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
