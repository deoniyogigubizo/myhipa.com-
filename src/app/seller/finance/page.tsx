'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  reference?: string;
  status: string;
  createdAt: string;
}

interface FinanceData {
  wallet: {
    available: number;
    pending: number;
    held: number;
    currency: string;
    totalWithdrawn: number;
  };
  escrow: {
    balance: number;
    releasingToday: number;
  };
  transactions: Transaction[];
  payoutMethods: Array<{
    type: string;
    provider?: string;
    number?: string;
    bankName?: string;
    accountNumber?: string;
    isPrimary: boolean;
  }>;
  feeRate: number;
  tier: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function SellerFinance() {
  const { user } = useAuthStore();
  const [data, setData] = useState<FinanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedPayoutMethod, setSelectedPayoutMethod] = useState(0);

  useEffect(() => {
    fetchFinanceData();
  }, [activeTab, currentPage]);

  const fetchFinanceData = async () => {
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
        params.append('type', activeTab);
      }

      const response = await fetch(`/api/seller/finance?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch finance data');
      }

      const financeData = await response.json();
      setData(financeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load finance data');
    } finally {
      setIsLoading(false);
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

  const getTransactionIcon = (type: string) => {
    const icons: Record<string, string> = {
      escrow_release: '💰',
      withdrawal: '📤',
      fee: '💳',
      refund: '↩️',
      dispute: '⚠️'
    };
    return icons[type] || '💰';
  };

  const getTransactionColor = (type: string) => {
    const colors: Record<string, string> = {
      escrow_release: 'text-green-600',
      withdrawal: 'text-blue-600',
      fee: 'text-red-600',
      refund: 'text-yellow-600',
      dispute: 'text-orange-600'
    };
    return colors[type] || 'text-gray-600';
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading finance data...</p>
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
            onClick={fetchFinanceData}
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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Finance & Wallet</h1>
              <p className="text-sm text-gray-500">Manage your earnings and payouts</p>
            </div>
            <Link href="/seller/dashboard" className="text-sm text-teal-600 hover:underline">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Available Balance */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <span className="text-xs text-gray-500 uppercase">Available</span>
            </div>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(data.wallet.available)}
            </div>
            <p className="text-sm text-gray-500 mt-2">Ready to withdraw</p>
          </div>

          {/* Pending Balance */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
              <span className="text-xs text-gray-500 uppercase">Pending</span>
            </div>
            <div className="text-3xl font-bold text-yellow-600">
              {formatCurrency(data.wallet.pending)}
            </div>
            <p className="text-sm text-gray-500 mt-2">In escrow</p>
          </div>

          {/* Held Balance */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔒</span>
              </div>
              <span className="text-xs text-gray-500 uppercase">Held</span>
            </div>
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(data.wallet.held)}
            </div>
            <p className="text-sm text-gray-500 mt-2">Frozen in dispute</p>
          </div>
        </div>

        {/* Withdraw Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={data.wallet.available <= 0}
            className="w-full md:w-auto px-8 py-4 bg-teal-600 text-white rounded-xl text-lg font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Withdraw Funds
          </button>
        </div>

        {/* Escrow Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Escrow Balance</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.escrow.balance)}
              </div>
              <p className="text-sm text-gray-500">Total in escrow</p>
            </div>
            {data.escrow.releasingToday > 0 && (
              <div className="text-right">
                <div className="text-lg font-semibold text-green-600">
                  {formatCurrency(data.escrow.releasingToday)}
                </div>
                <p className="text-sm text-gray-500">Releasing today</p>
              </div>
            )}
          </div>
        </div>

        {/* Payout Methods */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Payout Methods</h3>
            <button className="text-sm text-teal-600 hover:underline">Add New</button>
          </div>
          {data.payoutMethods.length === 0 ? (
            <p className="text-gray-500 text-sm">No payout methods added yet</p>
          ) : (
            <div className="space-y-3">
              {data.payoutMethods.map((method, index) => (
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
            </div>
          )}
        </div>

        {/* Fee Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Fee Information</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Current Fee Rate</div>
              <div className="text-2xl font-bold text-gray-900">
                {(data.feeRate * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Seller Tier</div>
              <div className="text-lg font-semibold text-gray-900 capitalize">
                {data.tier}
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Transaction History</h3>
              <div className="flex items-center gap-2">
                {['all', 'escrow_release', 'withdrawal', 'fee'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      activeTab === tab
                        ? 'bg-teal-100 text-teal-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab === 'all' ? 'All' : tab.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {data.transactions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
              <p className="text-gray-500">Your transaction history will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.transactions.map((tx) => (
                <div key={tx.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">{getTransactionIcon(tx.type)}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{tx.description}</div>
                        <div className="text-sm text-gray-500">{getRelativeTime(tx.createdAt)}</div>
                      </div>
                    </div>
                    <div className={`text-lg font-semibold ${getTransactionColor(tx.type)}`}>
                      {tx.type === 'fee' || tx.type === 'withdrawal' ? '-' : '+'}
                      {formatCurrency(tx.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {data.pagination.pages > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing page {data.pagination.page} of {data.pagination.pages}
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
                  onClick={() => setCurrentPage(p => Math.min(data.pagination.pages, p + 1))}
                  disabled={currentPage === data.pagination.pages}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Withdraw Funds</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (RWF)
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                max={data.wallet.available}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Enter amount"
              />
              <p className="text-sm text-gray-500 mt-1">
                Available: {formatCurrency(data.wallet.available)}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payout Method
              </label>
              {data.payoutMethods.map((method, index) => (
                <label 
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer mb-2 ${
                    selectedPayoutMethod === index 
                      ? 'border-teal-500 bg-teal-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="payoutMethod"
                    checked={selectedPayoutMethod === index}
                    onChange={() => setSelectedPayoutMethod(index)}
                    className="text-teal-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {method.type === 'mobile_money' 
                        ? `${method.provider} - ${method.number}`
                        : `${method.bankName} - ${method.accountNumber}`}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle withdrawal
                  setShowWithdrawModal(false);
                  setWithdrawAmount('');
                }}
                disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > data.wallet.available}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
