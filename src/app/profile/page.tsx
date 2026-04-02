'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

const ORDERS = [
  { id: 'ORD-001', status: 'delivered', total: 1250000, items: 2, date: '2024-01-15', seller: 'Kigali Tech Hub' },
  { id: 'ORD-002', status: 'shipped', total: 185000, items: 1, date: '2024-01-18', seller: 'Audio World' },
  { id: 'ORD-003', status: 'processing', total: 95000, items: 1, date: '2024-01-19', seller: 'Sports Zone' },
];

const SAVED_SELLERS = [
  { name: 'Kigali Tech Hub', rating: 4.8, products: 45 },
  { name: 'Nairobi Electronics', rating: 4.7, products: 32 },
  { name: 'Lagos Fashion', rating: 4.9, products: 78 },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('orders');
  const { user, isAuthenticated, isHydrated } = useAuthStore();

  // Redirect to login if not authenticated (only after hydration is complete)
  useEffect(() => {
    if (isHydrated && !isAuthenticated && !user) {
      window.location.href = '/login';
    }
  }, [isHydrated, isAuthenticated, user]);

  // Show loading while checking auth
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">My Account</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center text-2xl font-bold text-teal-600">
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{user?.displayName || 'User'}</div>
                  <div className="text-sm text-gray-500">{user?.email || 'user@example.com'}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Wallet Balance</span><span className="font-semibold">45,000 RWF</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Points</span><span className="font-semibold text-amber-600">★ 1,250</span></div>
              </div>
            </div>

            {/* Dashboard Links */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Dashboards</h3>
              <div className="space-y-2">
                <Link href="/seller/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-teal-50 hover:text-teal-600 transition-colors">
                  <span>🏪</span>
                  <span className="text-sm font-medium">Seller Dashboard</span>
                </Link>
                <Link href="/transactions" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-teal-50 hover:text-teal-600 transition-colors">
                  <span>📊</span>
                  <span className="text-sm font-medium">My Transactions</span>
                </Link>
              </div>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'orders', label: 'My Orders', icon: '📦' },
                { id: 'wishlist', label: 'Wishlist', icon: '❤️' },
                { id: 'sellers', label: 'Saved Sellers', icon: '⭐' },
                { id: 'wallet', label: 'Wallet', icon: '💰' },
                { id: 'settings', label: 'Settings', icon: '⚙️' },
                { id: 'security', label: 'Security', icon: '🔒' },
              ].map((item) => (
                <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${activeTab === item.id ? 'bg-teal-50 text-teal-600' : 'hover:bg-gray-50'}`}>
                  <span>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="lg:col-span-3">
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">My Orders</h2>
                <div className="space-y-4">
                  {ORDERS.map((order) => (
                    <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">{order.id}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>{order.status}</span>
                          </div>
                          <p className="text-sm text-gray-500">{order.date} • {order.items} items</p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">{order.total.toLocaleString()} RWF</div>
                          <p className="text-sm text-gray-500">Seller: {order.seller}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Track Order</button>
                        <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">View Details</button>
                        <button className="px-3 py-1 text-sm text-teal-600 hover:underline">Leave Review</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">My Wishlist</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <span className="text-4xl mb-4 block">❤️</span>
                  <p className="text-gray-500">Your wishlist is empty</p>
                  <Link href="/search" className="inline-block mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Start Shopping</Link>
                </div>
              </div>
            )}

            {activeTab === 'sellers' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Saved Sellers</h2>
                <div className="space-y-4">
                  {SAVED_SELLERS.map((seller) => (
                    <div key={seller.name} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{seller.name}</div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>⭐ {seller.rating}</span>
                          <span>•</span>
                          <span>{seller.products} products</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/store/${seller.name.toLowerCase().replace(' ', '-')}`} className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Visit Store</Link>
                        <button className="px-3 py-1 text-sm text-red-500 hover:underline">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'wallet' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">My Wallet</h2>
                <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-xl p-6 text-white mb-6">
                  <div className="text-sm text-teal-100 mb-1">Available Balance</div>
                  <div className="text-3xl font-bold mb-4">45,000 RWF</div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white text-teal-600 rounded-lg font-medium">Top Up</button>
                    <button className="px-4 py-2 border border-white/30 rounded-lg font-medium">Withdraw</button>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Linked Payment Methods</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>💳 •••• 4242</span>
                      <span className="text-xs text-gray-500">Default</span>
                    </div>
                    <button className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-teal-500 hover:text-teal-600">+ Add Payment Method</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label><input type="text" defaultValue="John Doe" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" defaultValue="john@example.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" defaultValue="+250 788 123 456" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Location</label><input type="text" defaultValue="Kigali, Rwanda" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                  <button className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700">Save Changes</button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">Password</div>
                        <div className="text-sm text-gray-500">Last changed 30 days ago</div>
                      </div>
                      <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Change</button>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">Two-Factor Authentication</div>
                        <div className="text-sm text-gray-500">Not enabled</div>
                      </div>
                      <button className="px-3 py-1 text-sm bg-teal-100 text-teal-700 rounded-lg">Enable</button>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">KYC Verification</div>
                        <div className="text-sm text-gray-500">Verified ✓</div>
                      </div>
                      <span className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full">Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
