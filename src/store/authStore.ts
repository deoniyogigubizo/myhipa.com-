import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  role?: "buyer" | "seller" | "both" | "admin" | "super_admin";
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean; // Track when zustand has rehydrated from localStorage
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => {
        if (typeof window !== "undefined") {
          if (token) {
            localStorage.setItem("token", token);
          } else {
            localStorage.removeItem("token");
          }
        }
        set({ token });
      },
      login: (user, token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("token", token);
        }
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
        }
        set({ user: null, token: null, isAuthenticated: false });
      },
      setLoading: (isLoading) => set({ isLoading }),
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Set hydrated to true after rehydration completes
        if (state) {
          state.setHydrated(true);
        }
      },
    },
  ),
);
