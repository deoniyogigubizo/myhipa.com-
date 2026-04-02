"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuthStore();

  useEffect(() => {
    // Wait for zustand to hydrate from localStorage
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Redirect based on user role
    if (user?.role === "super_admin") {
      router.push("/admin");
    } else if (user?.role === "seller" || user?.role === "both") {
      router.push("/seller/dashboard");
    } else {
      // For buyers, redirect to profile or a buyer dashboard
      router.push("/profile");
    }
  }, [isAuthenticated, isHydrated, user, router]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
