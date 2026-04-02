'use client';

import { useState } from 'react';

const CAMPAIGNS = [
  { id: '1', name: 'Samsung S24 Promo', status: 'active', budget: 150000, spent: 89500, impressions: 45000, clicks: 1200, ctr: 2.7, roas: 3.2 },
  { id: '2', name: 'MacBook Spring Sale', status: 'paused', budget: 200000, spent: 45000, impressions: 22000, clicks: 580, ctr: 2.6, roas: 0 },
  { id: '3', name: 'New Arrivals', status: 'active', budget: 100000, spent: 67800, impressions: 34000, clicks: 890, ctr: 2.6, roas: 2.1 },
];

const AD_TYPES = [
  { id: 'banner', name: 'Banner Ads', icon: '🖼️', description: 'Display ads on homepage and category pages' },
  { id: 'sponsored', name: 'Sponsored Listings', icon: '⭐', description: 'Appear at top of search results' },
  { id: 'boost', name: 'Post Boost', icon: '🚀', description: 'Boost your community posts visibility' },
];

export default function AdvertisingPage() {
  const [activeTab, setActiveTab] = useState('campaigns');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Hipa Ads</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-4 border-b border-gray-200">
                {['campaigns', 'create', 'analytics'].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-3 font-medium capitalize ${activeTab === tab ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500'}`}>{tab}</button>
                ))}
              </div>
              <button className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700">+ New Campaign</button>
            </div>

            {activeTab === 'campaigns' && (
              <div className="space-y-4">
                {CAMPAIGNS.map((campaign) => (
                  <div key={campaign.id} className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${campaign.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{campaign.status}</span>
                        </div>
                        <p className="text-sm text-gray-500">Budget: {campaign.budget.toLocaleString()} RWF</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{campaign.roas}x</div>
                        <div className="text-xs text-gray-500">ROAS</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div><div className="text-sm text-gray-500">Spent</div><div className="font-semibold">{campaign.spent.toLocaleString()} RWF</div></div>
                      <div><div className="text-sm text-gray-500">Impressions</div><div className="font-semibold">{campaign.impressions.toLocaleString()}</div></div>
                      <div><div className="text-sm text-gray-500">Clicks</div><div className="font-semibold">{campaign.clicks.toLocaleString()}</div></div>
                      <div><div className="text-sm text-gray-500">CTR</div><div className="font-semibold">{campaign.ctr}%</div></div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                      <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Edit</button>
                      <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">{campaign.status === 'active' ? 'Pause' : 'Resume'}</button>
                      <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">View Details</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'create' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Create New Campaign</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Objective</label>
                    <div className="grid md:grid-cols-3 gap-4">
                      {AD_TYPES.map((type) => (
                        <label key={type.id} className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-teal-500">
                          <span className="text-3xl">{type.icon}</span>
                          <span className="font-medium">{type.name}</span>
                          <span className="text-xs text-gray-500 text-center">{type.description}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label><input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Daily Budget (RWF)</label><input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                    <div className="grid grid-cols-2 gap-4">
                      <select className="px-4 py-2 border border-gray-300 rounded-lg"><option>Category</option><option>Electronics</option><option>Fashion</option></select>
                      <select className="px-4 py-2 border border-gray-300 rounded-lg"><option>Location</option><option>Rwanda</option><option>Kenya</option></select>
                    </div>
                  </div>
                  <button className="w-full py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700">Launch Campaign</button>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Ad Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-500">Total Spent</span><span className="font-semibold">202,300 RWF</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Total Impressions</span><span className="font-semibold">101,000</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Total Clicks</span><span className="font-semibold">2,670</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Avg CTR</span><span className="font-semibold">2.6%</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Avg ROAS</span><span className="font-semibold">2.8x</span></div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-xl p-4 text-white">
              <h3 className="font-semibold mb-2">Need Help?</h3>
              <p className="text-sm text-teal-100 mb-4">Our advertising team can help you optimize your campaigns for better results.</p>
              <button className="w-full py-2 bg-white text-teal-600 rounded-lg font-medium">Contact Support</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
