import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface UIState {
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  toasts: Toast[];
  isLoading: boolean;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleSearch: () => void;
  setSearchOpen: (open: boolean) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

let toastId = 0;

export const useUIStore = create<UIState>((set, get) => ({
  isMobileMenuOpen: false,
  isSearchOpen: false,
  toasts: [],
  isLoading: false,

  toggleMobileMenu: () => set({ isMobileMenuOpen: !get().isMobileMenuOpen }),
  
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

  toggleSearch: () => set({ isSearchOpen: !get().isSearchOpen }),
  
  setSearchOpen: (open) => set({ isSearchOpen: open }),

  addToast: (toast) => {
    const id = `toast-${++toastId}`;
    const newToast = { ...toast, id };
    set({ toasts: [...get().toasts, newToast] });

    // Auto-remove after duration
    const duration = toast.duration || 3000;
    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
