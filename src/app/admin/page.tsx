"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

interface DashboardData {
  kpis: {
    totalGMV: number;
    todayGMV: number;
    monthGMV: number;
    gmvChange: string;
    totalCommission: number;
    monthCommission: number;
    totalOrders: number;
    ordersToday: number;
    ordersThisMonth: number;
    pendingOrders: number;
    disputedOrders: number;
    totalUsers: number;
    totalBuyers: number;
    totalSellers: number;
    newUsersToday: number;
    newUsersThisMonth: number;
    avgOrderValue: number;
    escrowHeld: number;
    pendingSellerApprovals: number;
  };
  sellerTiers: Array<{ _id: string; count: number }>;
  revenueChart: Array<{ date: string; revenue: number; orders: number }>;
  topSellers: Array<{
    id: string;
    storeName: string;
    totalRevenue: number;
    orderCount: number;
    tier: string;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entity: any;
    actor: any;
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [gmvPeriod, setGmvPeriod] = useState<"today" | "month" | "total">(
    "month",
  );

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const token = useAuthStore.getState().token;
      const res = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load dashboard");
      const result = await res.json();
      setData(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("rw-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffMs / 86400000);
    return `${diffDays}d ago`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending_payment: "bg-yellow-100 text-yellow-700",
      payment_held: "bg-blue-100 text-blue-700",
      seller_processing: "bg-indigo-100 text-indigo-700",
      in_delivery: "bg-purple-100 text-purple-700",
      dispute_window: "bg-orange-100 text-orange-700",
      completed: "bg-green-100 text-green-700",
      disputed: "bg-red-100 text-red-700",
      cancelled: "bg-gray-100 text-gray-700",
      refunded: "bg-pink-100 text-pink-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading super admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 mb-4">
          {error || "Failed to load dashboard"}
        </p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Super Admin Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {user?.displayName || "Super Admin"}. Here is your
          platform overview.
        </p>
      </div>

      {/* Alerts */}
      {data.kpis.pendingSellerApprovals > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-sm text-yellow-800">
              <strong>{data.kpis.pendingSellerApprovals}</strong> sellers
              pending approval
            </span>
          </div>
          <Link
            href="/admin/sellers?kycStatus=pending"
            className="text-sm font-medium text-yellow-800 hover:text-yellow-900"
          >
            Review Now
          </Link>
        </div>
      )}

      {data.kpis.disputedOrders > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm text-red-800">
              <strong>{data.kpis.disputedOrders}</strong> orders in dispute
            </span>
          </div>
          <Link
            href="/admin/disputes"
            className="text-sm font-medium text-red-800 hover:text-red-900"
          >
            Resolve
          </Link>
        </div>
      )}

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* GMV Card */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex gap-1">
              {(["today", "month", "total"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setGmvPeriod(period)}
                  className={`px-2 py-1 text-xs rounded ${gmvPeriod === period ? "bg-purple-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
                >
                  {period === "total"
                    ? "All"
                    : period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(
              gmvPeriod === "today"
                ? data.kpis.todayGMV
                : gmvPeriod === "month"
                  ? data.kpis.monthGMV
                  : data.kpis.totalGMV,
            )}
          </div>
          <div className="text-sm text-gray-500">GMV / Revenue</div>
          <div
            className={`text-xs mt-2 ${data.kpis.gmvChange.startsWith("+") ? "text-green-600" : "text-red-600"}`}
          >
            {data.kpis.gmvChange} vs last month
          </div>
        </div>

        {/* Commission Card */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(data.kpis.monthCommission)}
          </div>
          <div className="text-sm text-gray-500">Commission (This Month)</div>
          <div className="text-xs text-gray-400 mt-2">
            Total: {formatCurrency(data.kpis.totalCommission)}
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            {data.kpis.pendingOrders > 0 && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                {data.kpis.pendingOrders} pending
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(data.kpis.totalOrders)}
          </div>
          <div className="text-sm text-gray-500">Total Orders</div>
          <div className="text-xs text-gray-400 mt-2">
            {data.kpis.ordersToday} today &middot; {data.kpis.ordersThisMonth}{" "}
            this month
          </div>
        </div>

        {/* Users Card */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(data.kpis.totalUsers)}
          </div>
          <div className="text-sm text-gray-500">Total Users</div>
          <div className="text-xs text-gray-400 mt-2">
            {data.kpis.totalSellers} sellers &middot; {data.kpis.totalBuyers}{" "}
            buyers
          </div>
        </div>
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Avg Order Value</div>
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(data.kpis.avgOrderValue)}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Escrow Held</div>
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(data.kpis.escrowHeld)}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Disputed Orders</div>
          <div
            className={`text-xl font-bold ${data.kpis.disputedOrders > 0 ? "text-red-600" : "text-gray-900"}`}
          >
            {data.kpis.disputedOrders}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">New Users (Month)</div>
          <div className="text-xl font-bold text-gray-900">
            +{data.kpis.newUsersThisMonth}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              Revenue Trend (30 Days)
            </h3>
            <Link
              href="/admin/analytics"
              className="text-sm text-purple-600 hover:underline"
            >
              View Analytics
            </Link>
          </div>
          <div className="h-48 flex items-end gap-1">
            {data.revenueChart.map((day, index) => {
              const maxRevenue = Math.max(
                ...data.revenueChart.map((d) => d.revenue),
              );
              const height =
                maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-1 group relative"
                >
                  <div
                    className="w-full rounded-t bg-purple-500 hover:bg-purple-600 transition-colors cursor-pointer"
                    style={{ height: `${Math.max(height, 3)}%` }}
                    title={`${day.date}: ${formatCurrency(day.revenue)} (${day.orders} orders)`}
                  ></div>
                  {index % 5 === 0 && (
                    <span className="text-[10px] text-gray-400">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/admin/sellers?kycStatus=pending"
              className="flex flex-col items-center gap-2 p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <svg
                className="w-5 h-5 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-xs font-medium text-yellow-700">
                Approve Sellers
              </span>
            </Link>
            <Link
              href="/admin/disputes"
              className="flex flex-col items-center gap-2 p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="text-xs font-medium text-red-700">
                Resolve Disputes
              </span>
            </Link>
            <Link
              href="/admin/finance"
              className="flex flex-col items-center gap-2 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-xs font-medium text-green-700">
                Run Payouts
              </span>
            </Link>
            <Link
              href="/admin/users"
              className="flex flex-col items-center gap-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-xs font-medium text-blue-700">
                Manage Users
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Orders</h3>
            <Link
              href="/admin/orders"
              className="text-sm text-purple-600 hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="divide-y">
            {data.recentOrders.slice(0, 6).map((order) => (
              <div
                key={order.id}
                className="px-4 py-3 flex items-center justify-between hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    #{order.orderNumber}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getRelativeTime(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatCurrency(order.total)}
                  </p>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(order.status)}`}
                  >
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Sellers */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Top Sellers</h3>
            <Link
              href="/admin/sellers"
              className="text-sm text-purple-600 hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="divide-y">
            {data.topSellers.map((seller, index) => (
              <div
                key={seller.id}
                className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50"
              >
                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {seller.storeName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {seller.orderCount} orders
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {formatCurrency(seller.totalRevenue)}
                  </p>
                  <span className="text-xs text-gray-500">{seller.tier}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
            <Link
              href="/admin/audit-logs"
              className="text-sm text-purple-600 hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="divide-y max-h-80 overflow-y-auto">
            {data.recentActivity.slice(0, 8).map((activity) => (
              <div key={activity.id} className="px-4 py-3 hover:bg-gray-50">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">
                    {activity.action?.replace(/_/g, " ")}
                  </span>
                  {" on "}
                  <span className="text-gray-600">
                    {activity.entity?.type || "entity"}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  by {activity.actor?.role || "system"} &middot;{" "}
                  {getRelativeTime(activity.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
