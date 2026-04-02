"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: Record<string, boolean>;
  userCount: number;
}

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch("/api/admin/roles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setRoles(data.data.roles);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

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
          Roles & Permissions
        </h1>
        <p className="text-gray-500 mt-1">
          Manage platform roles and access control
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{role.name}</h3>
                <p className="text-sm text-gray-500">{role.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {role.isSystem && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                    System
                  </span>
                )}
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                  {Object.values(role.permissions).filter(Boolean).length}{" "}
                  permissions
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(role.permissions)
                .filter(([, v]) => v)
                .map(([key]) => (
                  <span
                    key={key}
                    className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded"
                  >
                    {key
                      .replace(/^can/, "")
                      .replace(/([A-Z])/g, " $1")
                      .trim()}
                  </span>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
