"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

interface Seller {
  id: string;
  userId: string;
  store: { name: string; slug: string; logo?: string; location?: any };
  tier: string;
  feeRate: number;
  kycStatus: string;
  stats: any;
  wallet: { available: number; pending: number; held: number };
  suspendedAt?: string;
  createdAt: string;
  user: { email: string; profile: any; phone: string } | null;
}

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [kycFilter, setKycFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchSellers();
  }, [page, tierFilter, kycFilter, search]);

  const fetchSellers = async () => {
    try {
      setIsLoading(true);
      const token = useAuthStore.getState().token;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (tierFilter) params.set("tier", tierFilter);
      if (kycFilter) params.set("kycStatus", kycFilter);
      const res = await fetch(`/api/admin/sellers?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSellers(data.data.sellers);
        setTotal(data.data.pagination.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string, approved: boolean) => {
    const token = useAuthStore.getState().token;
    await fetch(`/api/admin/sellers/${id}/approve`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ approved }),
    });
    fetchSellers();
  };

  const handleTierChange = async (id: string, tier: string) => {
    const token = useAuthStore.getState().token;
    await fetch(`/api/admin/sellers/${id}/tier`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tier }),
    });
    fetchSellers();
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("rw-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    }).format(n);
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Seller Management</h1>
        <p className="text-gray-500 mt-1">{total} total sellers</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search by store name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
        />
        <select
          value={tierFilter}
          onChange={(e) => {
            setTierFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="">All Tiers</option>
          <option value="standard">Standard</option>
          <option value="silver">Silver</option>
          <option value="gold">Gold</option>
          <option value="pro">Pro</option>
        </select>
        <select
          value={kycFilter}
          onChange={(e) => {
            setKycFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="">All KYC Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Store
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Owner
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tier
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  KYC
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Commission
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Revenue
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Wallet
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : sellers.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No sellers found
                  </td>
                </tr>
              ) : (
                sellers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">
                        {s.store?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {s.store?.location?.city}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {s.user?.email || "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={s.tier}
                        onChange={(e) => handleTierChange(s.id, e.target.value)}
                        className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${
                          s.tier === "gold"
                            ? "bg-yellow-100 text-yellow-700"
                            : s.tier === "silver"
                              ? "bg-gray-100 text-gray-700"
                              : s.tier === "pro"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-gray-50 text-gray-600"
                        }`}
                      >
                        <option value="standard">Standard</option>
                        <option value="silver">Silver</option>
                        <option value="gold">Gold</option>
                        <option value="pro">Pro</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          s.kycStatus === "verified"
                            ? "bg-green-100 text-green-700"
                            : s.kycStatus === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : s.kycStatus === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {s.kycStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{s.feeRate}%</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {formatCurrency(s.stats?.totalRevenue || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatCurrency(s.wallet?.available || 0)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {s.kycStatus === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(s.id, true)}
                              className="text-xs text-green-600 hover:underline"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApprove(s.id, false)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {sellers.length} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded">
              {page}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={sellers.length < 20}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
