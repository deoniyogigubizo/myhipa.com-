'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { formatRWF } from '@/lib/utils/currency';
import Footer from '@/components/layout/Footer';

// ============================================
// COMPONENTS
// ============================================

function CartItemCard({ item, onUpdateQuantity, onRemove }: { 
  item: any; 
  onUpdateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  onRemove: (productId: string, variantId?: string) => void;
}) {
  return (
    <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-200">
      <div className="w-24 h-24 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        <Image
          src={item.image || '/placeholder.png'}
          alt={item.title}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <Link
          href={`/product/${item.slug}`}
          className="font-medium text-gray-900 hover:text-teal-600 line-clamp-2"
        >
          {item.title}
        </Link>
        <Link
          href={`/store/seller/${item.sellerId}`}
          className="text-sm text-gray-500 hover:text-teal-600"
        >
          {item.sellerName}
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => onUpdateQuantity(item.productId, item.quantity - 1, item.variantId)}
              className="px-3 py-1 hover:bg-gray-100"
            >
              -
            </button>
            <span className="px-3 text-sm">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.productId, item.quantity + 1, item.variantId)}
              className="px-3 py-1 hover:bg-gray-100"
            >
              +
            </button>
          </div>
          <div className="text-right">
            <div className="font-bold text-gray-900">
              {formatRWF(item.price * item.quantity)}
            </div>
          </div>
        </div>
      </div>
      <button 
        onClick={() => onRemove(item.productId, item.variantId)}
        className="text-gray-400 hover:text-red-500 self-start"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

function SellerGroup({ sellerName, items, onUpdateQuantity, onRemove }: { 
  sellerName: string; 
  items: any[];
  onUpdateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  onRemove: (productId: string, variantId?: string) => void;
}) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const firstItem = items[0];

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Link href={`/store/${firstItem?.sellerId}`} className="font-semibold text-gray-900 hover:text-teal-600">
          {sellerName}
        </Link>
        <span className="text-xs text-gray-400">• {items.length} item(s)</span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <CartItemCard 
            key={`${item.productId}-${item.variantId || 'default'}`} 
            item={item} 
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemove}
          />
        ))}
      </div>
      <div className="flex justify-end mt-3 pt-3 border-t border-gray-100">
        <span className="text-sm text-gray-500">Subtotal: </span>
        <span className="font-semibold ml-2">{formatRWF(subtotal)}</span>
      </div>
    </div>
  );
}

function PromoCodeInput() {
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Promo Code</h3>
      {applied ? (
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-700 font-medium">SAVE10 applied! -10% off</span>
          <button onClick={() => setApplied(false)} className="ml-auto text-sm text-green-600 hover:underline">
            Remove
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter promo code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={() => setApplied(true)}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

function EscrowInfo() {
  return (
    <div className="bg-teal-50 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <svg className="w-6 h-6 text-teal-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <div>
          <h4 className="font-semibold text-teal-900">Secure Escrow Protection</h4>
          <p className="text-sm text-teal-700 mt-1">
            Your payment is held securely until you confirm delivery. 
            Funds are released to the seller only after you're satisfied with your order.
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-teal-600">
            <span>✓ Buyer Protection</span>
            <span>✓ Easy Disputes</span>
            <span>✓ Secure Payments</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function CartPage() {
  const { items, updateQuantity, removeItem, getSubtotal, getTotalItems } = useCartStore();
  const [isClient, setIsClient] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  
  // Fix hydration mismatch by only rendering after client-side mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Group items by seller
  const groupedBySeller = items.reduce((acc, item) => {
    const sellerName = item.sellerName || 'Unknown Seller';
    if (!acc[sellerName]) {
      acc[sellerName] = [];
    }
    acc[sellerName].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  // Calculate totals
  const subtotal = getSubtotal();
  const totalItems = getTotalItems();
  const shipping = subtotal > 100000 ? 0 : 15000;
  const discount = promoDiscount > 0 ? subtotal * (promoDiscount / 100) : 0;
  const total = subtotal + shipping - discount;

  const handleUpdateQuantity = (productId: string, quantity: number, variantId?: string) => {
    updateQuantity(productId, quantity, variantId);
  };

  const handleRemove = (productId: string, variantId?: string) => {
    removeItem(productId, variantId);
  };

  const handleApplyPromo = (discountPercent: number) => {
    setPromoDiscount(discountPercent);
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">
            Shopping Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </h1>

          {totalItems === 0 ? (
            // Empty cart state
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🛒</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">
                Looks like you haven't added anything to your cart yet.
              </p>
              <Link 
                href="/search" 
                className="inline-block px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                {Object.entries(groupedBySeller).map(([sellerName, sellerItems]) => (
                  <SellerGroup 
                    key={sellerName} 
                    sellerName={sellerName} 
                    items={sellerItems}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemove}
                  />
                ))}

                {/* Continue Shopping */}
                <div className="mt-6">
                  <Link href="/search" className="text-teal-600 hover:text-teal-700 font-medium">
                    ← Continue Shopping
                  </Link>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <PromoCodeInput />

                  <div className="bg-white rounded-xl border border-gray-200 p-6 mt-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">{formatRWF(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium">
                          {shipping === 0 ? 'Free' : formatRWF(shipping)}
                        </span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount</span>
                          <span>-{formatRWF(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-3 border-t border-gray-200">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold text-xl">{formatRWF(total)}</span>
                      </div>
                    </div>

                    <EscrowInfo />

                    <Link
                      href="/checkout"
                      className="block w-full py-4 mt-4 bg-teal-600 text-white text-center font-semibold rounded-xl hover:bg-teal-700 transition-colors"
                    >
                      Proceed to Checkout
                    </Link>

                    <p className="text-center text-sm text-gray-500 mt-3">
                      Don't have an account?{' '}
                      <Link href="/signup" className="text-teal-600 hover:underline">
                        Sign up
                      </Link>
                      {' '}or checkout as guest
                    </p>
                  </div>

                  {/* Accepted Payments */}
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-400 mb-2">Accepted Payment Methods</p>
                    <div className="flex items-center justify-center gap-2">
                      <div className="px-2 py-1 bg-white rounded border text-xs font-medium">Visa</div>
                      <div className="px-2 py-1 bg-white rounded border text-xs font-medium">Mastercard</div>
                      <div className="px-2 py-1 bg-white rounded border text-xs font-medium">M-Pesa</div>
                      <div className="px-2 py-1 bg-white rounded border text-xs font-medium">Bank Transfer</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
