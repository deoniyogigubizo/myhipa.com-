"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

type UserRole = "buyer" | "seller";
type PageStep = "role-select" | "login" | "super-admin";

export default function LoginPage() {
  const router = useRouter();
  const { login, setLoading } = useAuthStore();

  const [step, setStep] = useState<PageStep>("role-select");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep("login");
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role: selectedRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Verify the user's role matches the selected role
      if (
        selectedRole === "seller" &&
        data.user.role !== "seller" &&
        data.user.role !== "both"
      ) {
        throw new Error(
          "This account is not registered as a seller. Please login as a buyer.",
        );
      }

      if (selectedRole === "buyer" && data.user.role === "seller") {
        throw new Error(
          "This account is registered as a seller. Please login as a seller.",
        );
      }

      login(data.user, data.token);

      // Redirect based on role
      if (selectedRole === "seller") {
        router.push("/seller/dashboard");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const handleSuperAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
          role: "super_admin",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (data.user.role !== "super_admin") {
        throw new Error(
          "Access denied. This account does not have super admin privileges.",
        );
      }

      login(data.user, data.token);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center">
          <svg
            width="48"
            height="48"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="40" height="40" rx="8" fill="#1a1a1a" />
            <path
              d="M12 28C12 28 14 18 20 18C26 18 28 28 28 28"
              stroke="#f5f5dc"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 14C10 14 11 10 15 10C17 10 18 12 18 12"
              stroke="#f5f5dc"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="15" cy="26" r="2" fill="#f5f5dc" />
            <circle cx="25" cy="26" r="2" fill="#f5f5dc" />
            <path
              d="M20 18V12"
              stroke="#f5f5dc"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {step === "super-admin" ? "Super Admin Access" : "Welcome to Hipa"}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === "role-select"
            ? "Choose how you want to login"
            : step === "login"
              ? `Login as a ${selectedRole}`
              : "Enter your super admin credentials to access the admin panel"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {step === "super-admin" ? (
            <form className="space-y-6" onSubmit={handleSuperAdminLogin}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-purple-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <p className="text-xs text-purple-700">
                  This area is restricted to the platform owner (CEO). All
                  access is logged and audited.
                </p>
              </div>

              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Super Admin Email
                </label>
                <div className="mt-1">
                  <input
                    id="admin-email"
                    name="admin-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder="admin@myhipa.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="admin-password"
                    name="admin-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Access Super Admin Panel"
                  )}
                </button>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep("role-select");
                    setError("");
                    setAdminEmail("");
                    setAdminPassword("");
                  }}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Back to regular login
                </button>
              </div>
            </form>
          ) : step === "role-select" ? (
            <div className="space-y-4">
              {/* Buyer Option */}
              <button
                onClick={() => handleRoleSelect("buyer")}
                className="w-full flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-hipa-primary hover:bg-hipa-primary/5 transition-all"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Login as Buyer
                </h3>
                <p className="mt-2 text-sm text-gray-500 text-center">
                  Browse and purchase products from sellers across Rwanda
                </p>
                <div className="mt-3 flex items-center text-xs text-gray-400">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Can buy products only
                </div>
              </button>

              {/* Seller Option */}
              <button
                onClick={() => handleRoleSelect("seller")}
                className="w-full flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-hipa-primary hover:bg-hipa-primary/5 transition-all"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Login as Seller
                </h3>
                <p className="mt-2 text-sm text-gray-500 text-center">
                  Manage your store, list products, and sell to customers
                </p>
                <div className="mt-3 flex items-center text-xs text-gray-400">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Can buy and sell products
                </div>
              </button>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link
                    href="/signup"
                    className="font-medium text-hipa-primary hover:text-hipa-primary/80"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleLogin}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-hipa-primary focus:border-hipa-primary sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-hipa-primary focus:border-hipa-primary sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-hipa-primary focus:ring-hipa-primary border-gray-300 rounded"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a
                    href="#"
                    className="font-medium text-hipa-primary hover:text-hipa-primary/80"
                  >
                    Forgot your password?
                  </a>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-hipa-primary hover:bg-hipa-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-hipa-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    `Login as ${selectedRole === "seller" ? "Seller" : "Buyer"}`
                  )}
                </button>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep("role-select");
                    setSelectedRole(null);
                    setError("");
                  }}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-hipa-primary"
                >
                  Back to role selection
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link
                    href="/signup"
                    className="font-medium text-hipa-primary hover:text-hipa-primary/80"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
          )}

          {/* Super Admin Link - shown on all non-super-admin steps */}
          {step !== "super-admin" && (
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <button
                onClick={() => {
                  setStep("super-admin");
                  setError("");
                }}
                className="text-xs text-gray-400 hover:text-purple-600 transition-colors"
              >
                I am the super admin of myhipa.com
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
