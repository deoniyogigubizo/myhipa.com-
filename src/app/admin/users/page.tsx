"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

interface User {
  id: string;
  email: string;
  name?: string;
  phone: string;
  role: string;
  profile: {
    displayName: string;
    avatar?: string;
    location?: { city: string; country: string };
  };
  reputation: { score: number; level: string };
  wallet: { balance: number; currency: string };
  auth: {
    emailVerified: boolean;
    twoFactorEnabled: boolean;
    lastLogin?: string;
  };
  kycStatus: string;
  createdAt: string;
  deletedAt?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, search]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const token = useAuthStore.getState().token;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users);
        setTotal(data.data.pagination.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspend = async (userId: string, suspend: boolean) => {
    const token = useAuthStore.getState().token;
    await fetch(`/api/admin/users/${userId}/suspend`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        suspended: suspend,
        reason: suspend ? "Suspended by super admin" : "",
      }),
    });
    fetchUsers();
  };

  const handleImpersonate = async (userId: string) => {
    const token = useAuthStore.getState().token;
    const res = await fetch(`/api/admin/users/${userId}/impersonate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      alert(
        `Impersonation token generated. Token expires in ${data.data.expiresIn}.`,
      );
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">{total} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search by name, email, phone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="">All Roles</option>
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
          <option value="both">Both</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Wallet
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Joined
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
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                          {(u.profile?.displayName || u.name)?.charAt(0) ||
                            u.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {u.profile?.displayName ||
                              u.name ||
                              u.email.split("@")[0]}
                          </p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          u.role === "super_admin"
                            ? "bg-purple-100 text-purple-700"
                            : u.role === "admin"
                              ? "bg-red-100 text-red-700"
                              : u.role === "seller" || u.role === "both"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${u.deletedAt ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
                      >
                        {u.deletedAt ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {u.wallet?.balance?.toLocaleString()} {u.wallet?.currency}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setShowModal(true);
                          }}
                          className="text-xs text-purple-600 hover:underline"
                        >
                          View
                        </button>
                        {u.role !== "super_admin" && (
                          <>
                            <button
                              onClick={() => handleImpersonate(u.id)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Impersonate
                            </button>
                            <button
                              onClick={() => handleSuspend(u.id, !u.deletedAt)}
                              className={`text-xs ${u.deletedAt ? "text-green-600" : "text-red-600"} hover:underline`}
                            >
                              {u.deletedAt ? "Reactivate" : "Suspend"}
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
        {/* Pagination */}
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {users.length} of {total}
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
              disabled={users.length < 20}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {showModal && selectedUser && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">User Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                X
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Name:</span>{" "}
                <span className="text-sm font-medium">
                  {selectedUser.profile?.displayName ||
                    selectedUser.name ||
                    selectedUser.email.split("@")[0]}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email:</span>{" "}
                <span className="text-sm font-medium">
                  {selectedUser.email}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Phone:</span>{" "}
                <span className="text-sm font-medium">
                  {selectedUser.phone || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Role:</span>{" "}
                <span className="text-sm font-medium">{selectedUser.role}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">KYC:</span>{" "}
                <span className="text-sm font-medium">
                  {selectedUser.kycStatus}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Wallet:</span>{" "}
                <span className="text-sm font-medium">
                  {selectedUser.wallet?.balance?.toLocaleString()}{" "}
                  {selectedUser.wallet?.currency}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Reputation:</span>{" "}
                <span className="text-sm font-medium">
                  {selectedUser.reputation?.score} (
                  {selectedUser.reputation?.level})
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email Verified:</span>{" "}
                <span className="text-sm font-medium">
                  {selectedUser.auth?.emailVerified ? "Yes" : "No"}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">2FA:</span>{" "}
                <span className="text-sm font-medium">
                  {selectedUser.auth?.twoFactorEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Joined:</span>{" "}
                <span className="text-sm font-medium">
                  {formatDate(selectedUser.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
