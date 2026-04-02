'use client';

import { useState } from 'react';
import Link from 'next/link';

const TRANSACTIONS = [
  { id: 'TXN-001', type: 'purchase', amount: 1250000, status: 'held', product: 'Samsung S24 Ultra', seller: 'Kigali Tech Hub', date: '2024-01-18', escrowRelease: '2024-01-21' },
  { id: 'TXN-002', type: 'sale', amount: 980000, status: 'released', product: 'MacBook Air M2', buyer: 'Sarah M.', date: '2024-01-15', escrowRelease: '2024-01-18' },
  { id: 'TXN-003', type: 'refund', amount: -185000, status: 'completed', product: 'Sony Headphones', buyer: 'John K.', date: '2024-01-10' },
  { id: 'TXN-004', type: 'purchase', amount: 85000, status: 'released', product: 'Phone Case', seller: 'Accessory Shop', date: '2024-01-08' },
];

const ESCROW_STEPS = [
  { status: 'Order Placed', description: 'Buyer completes payment', completed: true },
  { status: 'Payment Held', description: 'Funds secured in escrow', completed: true },
  { status: 'Seller Ships', description: 'Seller delivers the product', completed: true },
  { status: 'Buyer Confirms', description: 'Buyer confirms receipt', current: true },
  { status: 'Funds Released', description: 'Seller receives payment', pending: true },
];

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Transactions & Escrow</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex gap-4 mb-6 border-b border-gray-200">
              {['all', 'purchases', 'sales', 'disputes'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-3 font-medium capitalize ${activeTab === tab ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500'}`}>{tab}</button>
              ))}
            </div>

            <div className="space-y-4">
              {TRANSACTIONS.map((txn) => (
                <div key={txn.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{txn.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          txn.status === 'held' ? 'bg-yellow-100 text-yellow-700' :
                          txn.status === 'released' ? 'bg-green-100 text-green-700' :
                          txn.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                        }`}>{txn.status}</span>
                      </div>
                      <p className="text-gray-600">{txn.product}</p>
                      <p className="text-sm text-gray-500">{txn.date}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${txn.amount < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {txn.amount > 0 ? '+' : ''}{txn.amount.toLocaleString()} RWF
                      </div>
                      <p className="text-sm text-gray-500">{txn.type === 'purchase' ? `From: ${txn.seller}` : `To: ${txn.buyer || txn.seller}`}</p>
                    </div>
                  </div>
                  {txn.status === 'held' && (
                    <div className="mt-4 p-3 bg-teal-50 rounded-lg">
                      <p className="text-sm text-teal-700">📅 Escrow release date: {txn.escrowRelease}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">How Escrow Works</h3>
              <div className="space-y-4">
                {ESCROW_STEPS.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${step.completed ? 'bg-green-500' : step.current ? 'bg-teal-500' : 'bg-gray-200'}`}>
                      {step.completed ? '✓' : step.current ? '●' : index + 1}
                    </div>
                    <div>
                      <div className={`font-medium ${step.current ? 'text-teal-600' : step.completed ? 'text-gray-900' : 'text-gray-400'}`}>{step.status}</div>
                      <div className="text-xs text-gray-500">{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Need Help?</h3>
              <div className="space-y-3">
                <button className="w-full py-2 px-4 border border-gray-300 rounded-lg text-left text-sm hover:bg-gray-50">📋 Report a Dispute</button>
                <button className="w-full py-2 px-4 border border-gray-300 rounded-lg text-left text-sm hover:bg-gray-50">💬 Contact Support</button>
                <button className="w-full py-2 px-4 border border-gray-300 rounded-lg text-left text-sm hover:bg-gray-50">📖 Escrow Guide</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
