"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  hipaFee: number;
  sellerPayout: number;
  currency: string;
  escrow: { status: string; heldAt?: string; releasedAt?: string };
  dispute: any;
  createdAt: string;
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [escrowFilter, setEscrowFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchTransactions();
  }, [page, escrowFilter]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const token = useAuthStore.getState().token;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (escrowFilter) params.set("escrowStatus", escrowFilter);
      const res = await fetch(`/api/admin/transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data.transactions);
        setTotal(data.data.pagination.total);
      }
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
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-500 mt-1">{total} total transactions</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-4">
        <select
          value={escrowFilter}
          onChange={(e) => {
            setEscrowFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="">All Escrow Status</option>
          <option value="held">Held</option>
          <option value="released">Released</option>
          <option value="refunded">Refunded</option>
          <option value="partial">Partial</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Transaction ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Platform Fee
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Seller Payout
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Escrow
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">
                      {t.id?.slice(-8)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 font-medium">
                      {formatCurrency(t.hipaFee)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatCurrency(t.sellerPayout)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          t.escrow?.status === "held"
                            ? "bg-blue-100 text-blue-700"
                            : t.escrow?.status === "released"
                              ? "bg-green-100 text-green-700"
                              : t.escrow?.status === "refunded"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {t.escrow?.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(t.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {transactions.length} of {total}
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
              disabled={transactions.length < 20}
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
