"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

interface Product {
  id: string;
  title: string;
  slug: string;
  category: any;
  pricing: { base: number; currency: string };
  inventory: { totalStock: number };
  status: string;
  condition: string;
  stats: { views: number; purchased: number; avgRating: number };
  createdAt: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, [page, statusFilter, search]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const token = useAuthStore.getState().token;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setProducts(data.data.products);
        setTotal(data.data.pagination.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    const token = useAuthStore.getState().token;
    await fetch(`/api/admin/products/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    fetchProducts();
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("rw-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    }).format(n);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
        <p className="text-gray-500 mt-1">{total} total products</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search products..."
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
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Views
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sales
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
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                        {p.title}
                      </p>
                      <p className="text-xs text-gray-500">{p.condition}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {p.category?.primary || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {formatCurrency(p.pricing?.base || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={
                          p.inventory?.totalStock === 0 ? "text-red-600" : ""
                        }
                      >
                        {p.inventory?.totalStock || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={p.status}
                        onChange={(e) =>
                          handleStatusChange(p.id, e.target.value)
                        }
                        className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${
                          p.status === "active"
                            ? "bg-green-100 text-green-700"
                            : p.status === "draft"
                              ? "bg-gray-100 text-gray-700"
                              : p.status === "paused"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="paused">Paused</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm">{p.stats?.views || 0}</td>
                    <td className="px-4 py-3 text-sm">
                      {p.stats?.purchased || 0}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() =>
                          handleStatusChange(
                            p.id,
                            p.status === "active" ? "paused" : "active",
                          )
                        }
                        className={`text-xs ${p.status === "active" ? "text-yellow-600" : "text-green-600"} hover:underline`}
                      >
                        {p.status === "active" ? "Pause" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {products.length} of {total}
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
              disabled={products.length < 20}
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
