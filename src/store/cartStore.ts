import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ICartItem } from '@/types';

// Helper function to log activity
const logActivity = async (action: string, metadata: any) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    await fetch('/api/activity/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action, metadata })
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

interface CartState {
  items: ICartItem[];
  isOpen: boolean;
  addItem: (item: ICartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (i) => i.productId === item.productId && i.variantId === item.variantId
        );

        if (existingIndex > -1) {
          const newItems = [...items];
          if (newItems[existingIndex]) {
            newItems[existingIndex].quantity += item.quantity;
          }
          set({ items: newItems });
        } else {
          set({ items: [...items, item] });
        }
        
        // Log cart activity
        logActivity('cart_added', {
          productId: item.productId,
          productName: item.title,
          quantity: item.quantity,
          price: item.price
        });
      },

      removeItem: (productId, variantId) => {
        const removedItem = get().items.find(
          (i) => i.productId === productId && i.variantId === variantId
        );
        
        const items = get().items.filter(
          (i) => !(i.productId === productId && i.variantId === variantId)
        );
        set({ items });
        
        // Log cart activity
        if (removedItem) {
          logActivity('cart_removed', {
            productId: removedItem.productId,
            productName: removedItem.title,
            quantity: removedItem.quantity,
            price: removedItem.price
          });
        }
      },

      updateQuantity: (productId, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }

        const items = get().items.map((item) => {
          if (item.productId === productId && item.variantId === variantId) {
            return { ...item, quantity };
          }
          return item;
        });
        set({ items });
      },

      clearCart: () => set({ items: [] }),

      toggleCart: () => set({ isOpen: !get().isOpen }),

      setCartOpen: (open) => set({ isOpen: open }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'myhipa-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
