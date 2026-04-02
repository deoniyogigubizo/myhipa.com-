'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'buyer' | 'seller' | 'admin';
  isVerified: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role?: 'buyer' | 'seller') => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock user data
        const user: User = {
          id: '1',
          email,
          name: email.split('@')[0],
          role: 'buyer',
          isVerified: false,
        };
        
        set({ user, isAuthenticated: true, isLoading: false });
      },

      register: async (email, password, name, role = 'buyer') => {
        set({ isLoading: true });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const user: User = {
          id: Math.random().toString(36).substring(7),
          email,
          name,
          role,
          isVerified: false,
        };
        
        set({ user, isAuthenticated: true, isLoading: false });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      updateProfile: (data) => {
        const user = get().user;
        if (user) {
          set({ user: { ...user, ...data } });
        }
      },
    }),
    {
      name: 'myhipa-auth',
    }
  )
);

export function useAuth() {
  return useAuthStore();
}
