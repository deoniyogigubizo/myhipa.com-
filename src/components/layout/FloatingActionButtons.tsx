"use client";

import { ShoppingCart, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";

export default function FloatingActionButtons() {
  const cartItems = useCartStore((state) => state.items);

  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-3">
      <Link
        href="/cart"
        className="relative w-12 h-12 rounded-full bg-[#f5f5dc] flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
        style={{ backgroundColor: "var(--color-beige)" }}
      >
        <ShoppingCart
          className="w-6 h-6 text-[#1a1a1a]"
          style={{ color: "var(--color-black)" }}
        />
        {cartItems.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
            {cartItems.length}
          </span>
        )}
      </Link>

      <Link
        href="/messages"
        className="w-12 h-12 rounded-full bg-[#f5f5dc] flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
        style={{ backgroundColor: "var(--color-beige)" }}
      >
        <MessageCircle
          className="w-6 h-6 text-[#1a1a1a]"
          style={{ color: "var(--color-black)", transform: "rotate(75deg)" }}
        />
      </Link>
    </div>
  );
}
