"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);

  useEffect(() => {
    fetchDisputes();
  }, [page]);

  const fetchDisputes = async () => {
    try {
      setIsLoading(true);
      const token = useAuthStore.getState().token;
      const res = await fetch(`/api/admin/disputes?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDisputes(data.data.disputes);
        setTotal(data.data.pagination.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (id: string, resolution: string) => {
    const token = useAuthStore.getState().token;
    await fetch(`/api/admin/disputes/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ resolution }),
    });
    setSelectedDispute(null);
    fetchDisputes();
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
        <h1 className="text-2xl font-bold text-gray-900">Dispute Management</h1>
        <p className="text-gray-500 mt-1">{total} active disputes</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Transaction
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Reason
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Raised
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
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
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : disputes.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No active disputes
                  </td>
                </tr>
              ) : (
                disputes.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">
                      {d.id?.slice(-8)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {formatCurrency(d.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {d.dispute?.reason?.replace(/_/g, " ") || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {d.dispute?.raisedAt
                        ? formatDate(d.dispute.raisedAt)
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${d.dispute?.resolution ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {d.dispute?.resolution?.replace(/_/g, " ") || "Open"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!d.dispute?.resolution && (
                        <button
                          onClick={() => setSelectedDispute(d)}
                          className="text-xs text-purple-600 hover:underline"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {disputes.length} of {total}
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
              disabled={disputes.length < 20}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedDispute && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedDispute(null)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Resolve Dispute</h3>
            <p className="text-sm text-gray-600 mb-4">
              Amount: {formatCurrency(selectedDispute.amount)}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Reason: {selectedDispute.dispute?.reason?.replace(/_/g, " ")}
            </p>
            <div className="space-y-2">
              <button
                onClick={() =>
                  handleResolve(selectedDispute.id, "refund_buyer")
                }
                className="w-full py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Refund Buyer (Full)
              </button>
              <button
                onClick={() =>
                  handleResolve(selectedDispute.id, "release_seller")
                }
                className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
              >
                Release to Seller
              </button>
              <button
                onClick={() => handleResolve(selectedDispute.id, "partial")}
                className="w-full py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700"
              >
                Partial Refund
              </button>
              <button
                onClick={() => setSelectedDispute(null)}
                className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
