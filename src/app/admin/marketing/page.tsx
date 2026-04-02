"use client";

import { useState } from "react";

export default function AdminMarketingPage() {
  const [activeTab, setActiveTab] = useState("banners");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Marketing & Promotions
        </h1>
        <p className="text-gray-500 mt-1">
          Manage banners, campaigns, coupons, and promotions
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b">
          <nav className="flex">
            {["banners", "coupons", "campaigns", "notifications"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
          <button className="absolute right-6 top-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
            Create New
          </button>
        </div>

        <div className="p-6">
          {activeTab === "banners" && (
            <div className="text-center py-12 text-gray-500">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm">Platform banners management</p>
              <p className="text-xs text-gray-400 mt-1">
                Create and manage homepage banners, promotional banners, and
                flash sale banners
              </p>
            </div>
          )}
          {activeTab === "coupons" && (
            <div className="text-center py-12 text-gray-500">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                />
              </svg>
              <p className="text-sm">Coupon management</p>
              <p className="text-xs text-gray-400 mt-1">
                Create percentage or fixed-amount coupons with usage limits and
                expiry dates
              </p>
            </div>
          )}
          {activeTab === "campaigns" && (
            <div className="text-center py-12 text-gray-500">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
              <p className="text-sm">Marketing campaigns</p>
              <p className="text-xs text-gray-400 mt-1">
                Launch email campaigns, push notifications, and SMS marketing
              </p>
            </div>
          )}
          {activeTab === "notifications" && (
            <div className="text-center py-12 text-gray-500">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <p className="text-sm">Push notification templates</p>
              <p className="text-xs text-gray-400 mt-1">
                Manage notification templates for order updates, promotions, and
                system alerts
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
