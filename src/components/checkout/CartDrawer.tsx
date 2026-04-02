'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { formatRWF } from '@/lib/utils/currency';

export default function CartDrawer() {
  const { items, isOpen, setCartOpen, removeItem, updateQuantity, getSubtotal } = useCartStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setCartOpen(false)}
      />

      {/* Cart Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Shopping Cart ({items.length})</h2>
          <button
            onClick={() => setCartOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <button
                onClick={() => setCartOpen(false)}
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={`${item.productId}-${item.variantId || 'default'}`} className="flex gap-3">
                <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={item.image || '/placeholder.jpg'}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/product/${item.productId}`}
                    className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-teal-600"
                    onClick={() => setCartOpen(false)}
                  >
                    {item.title}
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">{item.sellerName}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                        className="px-2 py-1 hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="px-2 text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                        className="px-2 py-1 hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-semibold">{formatRWF(item.price * item.quantity)}</span>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.productId, item.variantId)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            <div className="flex justify-between text-lg font-semibold">
              <span>Subtotal</span>
              <span>{formatRWF(getSubtotal())}</span>
            </div>
            <p className="text-xs text-gray-500">Shipping and taxes calculated at checkout</p>
            <Link
              href="/checkout"
              onClick={() => setCartOpen(false)}
              className="block w-full py-3 bg-teal-600 text-white text-center rounded-lg font-medium hover:bg-teal-700 transition-colors"
            >
              Proceed to Checkout
            </Link>
            <button
              onClick={() => setCartOpen(false)}
              className="block w-full py-2 text-center text-gray-600 hover:text-gray-900"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
