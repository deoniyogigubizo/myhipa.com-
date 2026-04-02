'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

interface SellerSettings {
  store: {
    name: string;
    slug: string;
    logo?: string;
    banner?: string;
    bio?: string;
    categories: string[];
    location: {
      city: string;
      country: string;
    };
  };
  phone?: string | null;
  policies: {
    shipping: string;
    returns: string;
    autoReply?: string;
  };
  businessHours: Record<string, string | null>;
  kycStatus: string;
  payoutMethods: Array<{
    type: string;
    provider?: string;
    number?: string;
    bankName?: string;
    accountNumber?: string;
    isPrimary: boolean;
  }>;
}

export default function SellerSettings() {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<SellerSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [storeName, setStoreName] = useState('');
  const [storeBio, setStoreBio] = useState('');
  const [shippingPolicy, setShippingPolicy] = useState('');
  const [returnsPolicy, setReturnsPolicy] = useState('');
  const [autoReply, setAutoReply] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const token = useAuthStore.getState().token;
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await fetch('/api/seller/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setSettings(data);
      setStoreName(data.store.name);
      setStoreBio(data.store.bio || '');
      setShippingPolicy(data.policies.shipping || '');
      setReturnsPolicy(data.policies.returns || '');
      setAutoReply(data.policies.autoReply || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveSuccess(false);
      const token = useAuthStore.getState().token;
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await fetch('/api/seller/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          store: {
            name: storeName,
            bio: storeBio
          },
          policies: {
            shipping: shippingPolicy,
            returns: returnsPolicy,
            autoReply
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
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
            onClick={fetchSettings}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
              <p className="text-sm text-gray-500">Manage your store profile and preferences</p>
            </div>
            <Link href="/seller/dashboard" className="text-sm text-teal-600 hover:underline">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <nav className="space-y-1">
                {[
                  { id: 'profile', label: 'Store Profile', icon: '🏪' },
                  { id: 'policies', label: 'Policies', icon: '📋' },
                  { id: 'kyc', label: 'KYC & Verification', icon: '✅' },
                  { id: 'notifications', label: 'Notifications', icon: '🔔' },
                  { id: 'payouts', label: 'Payouts', icon: '💰' },
                  { id: 'danger', label: 'Danger Zone', icon: '⚠️' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-teal-100 text-teal-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {saveSuccess && (
              <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
                Settings saved successfully!
              </div>
            )}

            {/* Store Profile */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Store Profile</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Name
                    </label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store URL
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">myhipa.com/store/</span>
                      <input
                        type="text"
                        value={settings.store.slug}
                        disabled
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Bio
                    </label>
                    <textarea
                      value={storeBio}
                      onChange={(e) => setStoreBio(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Tell customers about your store..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categories
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {settings.store.categories.map((cat) => (
                        <span key={cat} className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="text-gray-900">
                      {settings.phone || 'Not provided'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <div className="text-gray-900">
                      {settings.store.location.city}, {settings.store.location.country}
                    </div>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Policies */}
            {activeTab === 'policies' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Store Policies</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shipping Policy
                    </label>
                    <textarea
                      value={shippingPolicy}
                      onChange={(e) => setShippingPolicy(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Describe your shipping policy..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Return Policy
                    </label>
                    <textarea
                      value={returnsPolicy}
                      onChange={(e) => setReturnsPolicy(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Describe your return policy..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auto-Reply Message
                    </label>
                    <textarea
                      value={autoReply}
                      onChange={(e) => setAutoReply(e.target.value)}
                      rows={3}
                      maxLength={200}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Message sent to buyers when you're offline..."
                    />
                    <p className="text-sm text-gray-500 mt-1">{autoReply.length}/200 characters</p>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* KYC */}
            {activeTab === 'kyc' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">KYC & Verification</h2>
                
                <div className="space-y-6">
                  <div className={`p-4 rounded-lg ${
                    settings.kycStatus === 'verified' ? 'bg-green-50 border border-green-200' :
                    settings.kycStatus === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {settings.kycStatus === 'verified' ? '✅' :
                         settings.kycStatus === 'pending' ? '⏳' : '❌'}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {settings.kycStatus === 'verified' ? 'Verified Seller' :
                           settings.kycStatus === 'pending' ? 'Verification Pending' :
                           'Not Verified'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {settings.kycStatus === 'verified' 
                            ? 'Your account is fully verified'
                            : settings.kycStatus === 'pending'
                            ? 'Your documents are being reviewed'
                            : 'Upload documents to get verified'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Benefits of Verification</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        Unlock payouts over 50,000 RWF
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        Get the verified badge on your store
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        Access B2B features
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        Appear higher in search results
                      </li>
                    </ul>
                  </div>

                  {settings.kycStatus !== 'verified' && (
                    <button className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                      Upload Documents
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Payouts */}
            {activeTab === 'payouts' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Payout Methods</h2>
                
                <div className="space-y-4">
                  {settings.payoutMethods.map((method, index) => (
                    <div 
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        method.isPrimary ? 'border-teal-500 bg-teal-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-lg">
                            {method.type === 'mobile_money' ? '📱' : '🏦'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {method.type === 'mobile_money' 
                              ? `${method.provider} Mobile Money`
                              : method.bankName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {method.type === 'mobile_money' 
                              ? method.number
                              : `Account: ${method.accountNumber}`}
                          </div>
                        </div>
                      </div>
                      {method.isPrimary && (
                        <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}

                  <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-teal-500 hover:text-teal-600">
                    + Add Payout Method
                  </button>
                </div>
              </div>
            )}

            {/* Danger Zone */}
            {activeTab === 'danger' && (
              <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
                <h2 className="text-xl font-bold text-red-600 mb-6">Danger Zone</h2>
                
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h3 className="font-medium text-red-900 mb-2">Pause Store</h3>
                    <p className="text-sm text-red-700 mb-3">
                      Temporarily hide all listings from search and mark your store as closed.
                    </p>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                      Pause Store
                    </button>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg">
                    <h3 className="font-medium text-red-900 mb-2">Delete Account</h3>
                    <p className="text-sm text-red-700 mb-3">
                      Permanently delete your account and all data. This action cannot be undone.
                    </p>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                      Delete Account
                    </button>
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
