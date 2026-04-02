"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

interface SearchResult {
  users?: any[];
  sellers?: any[];
  products?: any[];
  orders?: any[];
}

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/admin",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 13h1v7c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-7h1a1 1 0 00.7-1.7l-9-9a1 1 0 00-1.4 0l-9 9A1 1 0 003 13z"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "users",
    label: "Users",
    href: "/admin/users",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "sellers",
    label: "Sellers",
    href: "/admin/sellers",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "products",
    label: "Products",
    href: "/admin/products",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "orders",
    label: "Orders",
    href: "/admin/orders",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M9 5H7c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-2M9 5c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2M9 5c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2m-6 9l2 2 4-4"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "transactions",
    label: "Transactions",
    href: "/admin/transactions",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "disputes",
    label: "Disputes",
    href: "/admin/disputes",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "finance",
    label: "Finance",
    href: "/admin/finance",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/admin/analytics",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "roles",
    label: "Roles",
    href: "/admin/roles",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "audit-logs",
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "marketing",
    label: "Marketing",
    href: "/admin/marketing",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    href: "/admin/settings",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Verify super_admin access
  useEffect(() => {
    if (user && user.role !== "super_admin") {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearch(false);
        setSearchResults(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults(null);
      return;
    }

    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(
        `/api/admin/search?q=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.data);
        setShowSearch(true);
      }
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hide browser extension injected elements (Alibaba, etc.) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        div[id^="ali"],
        div[id^="alibaba"],
        div[class*="alibaba"],
        div[class*="ali-express"],
        div[class*="alibaba-addon"],
        iframe[src*="alibaba"],
        iframe[src*="aliexpress"],
        div[data-ext="alibaba"],
        div[class*="search-bar-extension"],
        div[class*="extension-toolbar"],
        #chrome-extension-search,
        div[style*="z-index: 2147483647"],
        div[style*="z-index: 999999"] {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
      `,
        }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
        (function() {
          function removeInjected() {
            document.querySelectorAll('div[style*="z-index: 2147483647"], div[style*="z-index: 999999"], div[id^="ali"], div[class*="alibaba"], div[class*="ali-express"]').forEach(function(el) { el.remove(); });
          }
          removeInjected();
          var observer = new MutationObserver(removeInjected);
          observer.observe(document.body, { childList: true, subtree: true });
        })();
      `,
        }}
      />
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <Link href="/admin" className="flex items-center gap-2">
              <span className="text-lg font-bold text-white">myHipa</span>
              <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-semibold rounded">
                SUPER ADMIN
              </span>
            </Link>
          </div>

          {/* Global Search */}
          <div className="flex-1 max-w-xl mx-4 relative" ref={searchRef}>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                name="admin-global-search"
                autoComplete="off"
                placeholder="Search users, sellers, products, orders..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSearch(true)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
            </div>
            {showSearch && searchResults && (
              <div className="absolute top-full mt-1 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
                {searchResults.users && searchResults.users.length > 0 && (
                  <div className="p-3 border-b">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                      Users
                    </h4>
                    {searchResults.users.map((u: any) => (
                      <Link
                        key={u.id}
                        href={`/admin/users`}
                        onClick={() => setShowSearch(false)}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
                      >
                        <span className="text-sm text-gray-900">
                          {u.profile?.displayName || u.email}
                        </span>
                        <span className="text-xs text-gray-500">{u.role}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {searchResults.sellers && searchResults.sellers.length > 0 && (
                  <div className="p-3 border-b">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                      Sellers
                    </h4>
                    {searchResults.sellers.map((s: any) => (
                      <Link
                        key={s.id}
                        href={`/admin/sellers`}
                        onClick={() => setShowSearch(false)}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
                      >
                        <span className="text-sm text-gray-900">
                          {s.store?.name}
                        </span>
                        <span className="text-xs text-gray-500">{s.tier}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {searchResults.products &&
                  searchResults.products.length > 0 && (
                    <div className="p-3 border-b">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        Products
                      </h4>
                      {searchResults.products.map((p: any) => (
                        <Link
                          key={p.id}
                          href={`/admin/products`}
                          onClick={() => setShowSearch(false)}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
                        >
                          <span className="text-sm text-gray-900 truncate">
                            {p.title}
                          </span>
                          <span className="text-xs text-gray-500">
                            {p.status}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                {searchResults.orders && searchResults.orders.length > 0 && (
                  <div className="p-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                      Orders
                    </h4>
                    {searchResults.orders.map((o: any) => (
                      <Link
                        key={o.id}
                        href={`/admin/orders`}
                        onClick={() => setShowSearch(false)}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
                      >
                        <span className="text-sm font-medium text-gray-900">
                          #{o.orderNumber}
                        </span>
                        <span className="text-xs text-gray-500">
                          {o.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
                {!searchResults.users?.length &&
                  !searchResults.sellers?.length &&
                  !searchResults.products?.length &&
                  !searchResults.orders?.length && (
                    <div className="p-4 text-sm text-gray-500 text-center">
                      No results found
                    </div>
                  )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Stats Pills */}
            <div className="hidden lg:flex items-center gap-2">
              <span className="px-3 py-1 bg-gray-800 text-green-400 text-xs font-medium rounded-full">
                Platform Online
              </span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfile(false);
                }}
                className="relative p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-gray-900">
                      Notifications
                    </h3>
                  </div>
                  <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                    <div className="flex items-start gap-3 p-2 bg-red-50 rounded">
                      <span className="text-red-500">!</span>
                      <div>
                        <p className="text-sm text-gray-900">
                          3 pending seller approvals
                        </p>
                        <p className="text-xs text-gray-500">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-2 bg-yellow-50 rounded">
                      <span className="text-yellow-500">!</span>
                      <div>
                        <p className="text-sm text-gray-900">
                          New dispute raised
                        </p>
                        <p className="text-xs text-gray-500">15 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                      <span className="text-blue-500">i</span>
                      <div>
                        <p className="text-sm text-gray-900">
                          System backup completed
                        </p>
                        <p className="text-xs text-gray-500">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfile(!showProfile);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 p-1.5 hover:bg-gray-800 rounded"
              >
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {user?.displayName?.charAt(0) || "S"}
                  </span>
                </div>
              </button>
              {showProfile && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-3 border-b">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.displayName || "Super Admin"}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      View Profile
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Settings
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-14 left-0 bottom-0 z-40 bg-gray-900 border-r border-gray-700 transition-all duration-300 ${
          sidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        <nav className="p-3 overflow-y-auto h-full">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-purple-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>

          {!sidebarCollapsed && (
            <div className="mt-6 p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-400">System Status</span>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>API</span>
                  <span className="text-green-400">Operational</span>
                </div>
                <div className="flex justify-between">
                  <span>DB</span>
                  <span className="text-green-400">Connected</span>
                </div>
                <div className="flex justify-between">
                  <span>Cache</span>
                  <span className="text-green-400">Active</span>
                </div>
              </div>
            </div>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={`pt-14 transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
