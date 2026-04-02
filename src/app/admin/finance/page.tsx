"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export default function AdminFinancePage() {
  const [data, setData] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFinance();
    fetchPayouts();
  }, []);

  const fetchFinance = async () => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch("/api/admin/finance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) setData(result.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayouts = async () => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch("/api/admin/finance/payouts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) setPayouts(result.data.payouts);
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Finance & Commissions
        </h1>
        <p className="text-gray-500 mt-1">
          Revenue, commissions, payouts, and escrow overview
        </p>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total GMV</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(data?.totalRevenue?.totalGMV || 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Commission</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(data?.totalRevenue?.totalFees || 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">This Month GMV</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(data?.monthRevenue?.totalGMV || 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">This Month Commission</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(data?.monthRevenue?.totalFees || 0)}
          </p>
        </div>
      </div>

      {/* Escrow & Payout KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Escrow Held</p>
          <p className="text-xl font-bold text-blue-600">
            {formatCurrency(
              data?.escrowStats?.find((s: any) => s._id === "held")?.total || 0,
            )}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Pending Payouts</p>
          <p className="text-xl font-bold text-yellow-600">
            {formatCurrency(data?.pendingPayouts?.totalPending || 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Available for Payout</p>
          <p className="text-xl font-bold text-green-600">
            {formatCurrency(data?.pendingPayouts?.totalAvailable || 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Payouts</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(data?.totalRevenue?.totalPayouts || 0)}
          </p>
        </div>
      </div>

      {/* Monthly Revenue Trend */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Monthly Revenue Trend
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                  Month
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                  GMV
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                  Commission
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                  Transactions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.monthlyTrend?.map((m: any) => (
                <tr key={m.month}>
                  <td className="px-4 py-2 text-sm font-medium">{m.month}</td>
                  <td className="px-4 py-2 text-sm text-right">
                    {formatCurrency(m.gmv)}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-green-600">
                    {formatCurrency(m.fees)}
                  </td>
                  <td className="px-4 py-2 text-sm text-right">
                    {m.transactions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Payouts */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900">
            Sellers with Pending Payouts
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                  Store
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                  Pending
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                  Available
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payouts.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No pending payouts
                  </td>
                </tr>
              ) : (
                payouts.map((p: any) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2 text-sm font-medium">
                      {p.storeName}
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-yellow-600">
                      {formatCurrency(p.pending)}
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-green-600">
                      {formatCurrency(p.available)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button className="text-xs text-purple-600 hover:underline">
                        Process Payout
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
