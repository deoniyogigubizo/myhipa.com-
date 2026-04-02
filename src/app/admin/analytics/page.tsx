"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState("30d");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const token = useAuthStore.getState().token;
      const res = await fetch(`/api/admin/analytics?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) setData(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("rw-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    }).format(n);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  if (!data) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Analytics & Reports
          </h1>
          <p className="text-gray-500 mt-1">Platform performance insights</p>
        </div>
        <div className="flex gap-2">
          {["7d", "30d", "90d", "1y"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-sm rounded ${period === p ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {data.funnel.activeProducts}
            </p>
            <p className="text-sm text-gray-600">Active Products</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {data.funnel.totalOrders}
            </p>
            <p className="text-sm text-gray-600">Total Orders</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {data.funnel.completedOrders}
            </p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">
              {data.funnel.conversionRate}%
            </p>
            <p className="text-sm text-gray-600">Conversion Rate</p>
          </div>
        </div>
      </div>

      {/* Daily Revenue */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Daily Revenue</h3>
        <div className="h-48 flex items-end gap-1">
          {data.dailyRevenue.map((day: any) => {
            const maxRev = Math.max(
              ...data.dailyRevenue.map((d: any) => d.revenue),
            );
            const height = maxRev > 0 ? (day.revenue / maxRev) * 100 : 0;
            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div
                  className="w-full rounded-t bg-purple-500 hover:bg-purple-600 transition-colors"
                  style={{ height: `${Math.max(height, 3)}%` }}
                  title={`${day.date}: ${formatCurrency(day.revenue)}`}
                ></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">
              Top Products by Views
            </h3>
          </div>
          <div className="divide-y">
            {data.topProducts.slice(0, 8).map((p: any, i: number) => (
              <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                <span className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {p.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {p.views} views &middot; {p.purchased} sales
                  </p>
                </div>
                <p className="text-sm font-medium">{formatCurrency(p.price)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">
              Category Distribution
            </h3>
          </div>
          <div className="divide-y">
            {data.categoryBreakdown.map((c: any) => (
              <div
                key={c.category}
                className="px-4 py-3 flex items-center justify-between"
              >
                <span className="text-sm text-gray-900">
                  {c.category || "Uncategorized"}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-gray-100 rounded-full">
                    <div
                      className="h-2 bg-purple-500 rounded-full"
                      style={{
                        width: `${Math.min(100, (c.productCount / (data.categoryBreakdown[0]?.productCount || 1)) * 100)}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {c.productCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
