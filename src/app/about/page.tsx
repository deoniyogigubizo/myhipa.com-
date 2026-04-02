"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          About myhipa.com
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Welcome to myhipa.com — your digital coven of creators. We bring
          together a community of makers, artisans, and sellers to offer you
          hidden treasures and everyday essentials.
        </p>
        <p className="text-lg text-gray-600 mb-6">
          Our mission is to support local businesses and provide a platform
          where you can discover unique products curated just for you.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
