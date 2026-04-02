'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function MobileNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  const quickLinks = [
    { label: 'Stores', href: '/stores' },
    { label: 'New', href: '/new-arrivals' },
    { label: 'Deals', href: '/search?q=deals' },
    { label: 'Community', href: '/community' },
    { label: 'Sell', href: '/seller/dashboard' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 bg-[#1a1a1a] z-50 flex justify-center">
      <div className="w-[90%] max-w-[90%]">
        <div className="flex items-center gap-2 py-2">
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-[#87ceeb]">
            <span className="text-xl">☰</span>
          </button>
          <Link href="/" className="text-lg font-bold text-[#f5f5dc]">Hipa</Link>
          <Link href="/search" className="flex-1 mx-2 bg-[#2d2d2d] rounded-full px-3 py-2 flex items-center gap-2">
            <span className="text-[#87ceeb]">🔍</span>
            <span className="text-sm text-gray-400">Search...</span>
          </Link>
          <Link href="/cart" className="p-2 relative">
            <span className="text-xl">🛒</span>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#16a34a] text-white text-[10px] rounded-full flex items-center justify-center">2</span>
          </Link>
        </div>

        {menuOpen && (
          <div className="absolute top-full left-0 right-0 bg-[#1a1a1a] border-t border-[#2d2d2d]">
            <div className="grid grid-cols-3 gap-2 p-3">
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="p-3 bg-[#2d2d2d] rounded-lg text-center">
                  <span className="text-xs text-[#f5f5dc]">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between py-1.5 bg-[#2d2d2d]">
          <Link href="/stores" className="text-xs text-[#87ceeb]">📍 Kigali</Link>
          <Link href="/seller/dashboard" className="text-xs text-[#22c55e]">Start Selling →</Link>
        </div>
      </div>
    </header>
  );
}
