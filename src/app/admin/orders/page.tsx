"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

interface Order {
  id: string;
  orderNumber: string;
  pricing: { total: number; currency: string; hipaFee: number };
  status: string;
  items: any[];
  createdAt: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, search]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const token = useAuthStore.getState().token;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data.orders);
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
      hour: "2-digit",
      minute: "2-digit",
    });

  const statusColors: Record<string, string> = {
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-500 mt-1">{total} total orders</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search by order number..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="">All Status</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="payment_held">Payment Held</option>
          <option value="seller_processing">Processing</option>
          <option value="in_delivery">In Delivery</option>
          <option value="dispute_window">Dispute Window</option>
          <option value="completed">Completed</option>
          <option value="disputed">Disputed</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Items
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Commission
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
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
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">
                        #{o.orderNumber}
                      </p>
                      <p className="text-xs text-gray-500">{o.id}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {o.items?.length || 0} item(s)
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {formatCurrency(o.pricing?.total || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600">
                      {formatCurrency(o.pricing?.hipaFee || 0)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[o.status] || "bg-gray-100 text-gray-700"}`}
                      >
                        {o.status?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(o.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {orders.length} of {total}
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
              disabled={orders.length < 20}
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
