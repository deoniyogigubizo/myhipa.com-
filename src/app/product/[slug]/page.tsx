"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/layout/Footer";
import { useAuthStore } from "@/store/authStore";

// ============================================
// MOCK DATA
// ============================================

const PRODUCT = {
  id: "1",
  title: "Samsung Galaxy S24 Ultra - 256GB - Titanium Black",
  description:
    "The Samsung Galaxy S24 Ultra is the ultimate smartphone experience. Featuring a stunning 6.8-inch Dynamic AMOLED display, powerful Snapdragon 8 Gen 3 processor, and an advanced camera system with 200MP main sensor. Built with titanium frame and S Pen support.",
  price: 1250000,
  compareAtPrice: 1450000,
  images: [
    "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800",
    "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800",
    "https://images.unsplash.com/photo-1580910051074-3eb694886e8e?w=800",
    "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800",
  ],
  rating: 4.7,
  reviewCount: 234,
  stock: 5,
  sku: "SM-S928BZKE",
  category: "Electronics",
  tags: ["smartphone", "samsung", "galaxy", "5g", "android"],
  seller: {
    id: "1",
    name: "Kigali Tech Hub",
    slug: "kigali-tech-hub",
    logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100",
    rating: 4.8,
    reviewCount: 1250,
    sales: 4500,
    verified: true,
    responseRate: 98,
    location: "Kigali, Rwanda",
    joinedDate: "2022",
  },
  specifications: {
    Display: '6.8" Dynamic AMOLED 2X, 120Hz',
    Processor: "Snapdragon 8 Gen 3",
    RAM: "12GB",
    Storage: "256GB",
    "Main Camera": "200MP + 50MP + 12MP + 10MP",
    "Front Camera": "12MP",
    Battery: "5000mAh",
    Charging: "45W wired, 15W wireless",
    OS: "Android 14, One UI 6.1",
    "Water Resistance": "IP68",
    Weight: "232g",
  },
  shipping: {
    method: "Express Delivery",
    fee: 15000,
    estimatedDays: "2-3 business days",
    freeAbove: 100000,
    locations: ["Kigali", "Nairobi", "Lagos", "Accra"],
  },
  returns: {
    days: 14,
    condition: "Original packaging and accessories",
    fee: "10% restocking fee",
  },
};

const REVIEWS = [
  {
    id: "1",
    author: { name: "John D.", avatar: "https://i.pravatar.cc/40?img=1" },
    rating: 5,
    date: "2024-01-15",
    title: "Best phone I have ever owned!",
    content:
      "The camera quality is absolutely stunning. Battery life is great too. Fast delivery from the seller.",
    images: [
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200",
    ],
    helpful: 45,
    sellerResponse: "Thank you for your purchase! We appreciate your feedback.",
  },
  {
    id: "2",
    author: { name: "Sarah M.", avatar: "https://i.pravatar.cc/40?img=2" },
    rating: 4,
    date: "2024-01-10",
    title: "Great phone, slightly pricey",
    content:
      "Phone works perfectly. The S Pen is a nice addition. Only downside is the price, but you get what you pay for.",
    images: [],
    helpful: 23,
    sellerResponse: null,
  },
  {
    id: "3",
    author: { name: "Michael K.", avatar: "https://i.pravatar.cc/40?img=3" },
    rating: 5,
    date: "2024-01-05",
    title: "Amazing camera!",
    content:
      "The 200MP camera is no joke. Photos are incredibly detailed even in low light. Highly recommend!",
    images: [
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200",
    ],
    helpful: 67,
    sellerResponse: "Thanks for the review Michael!",
  },
];

const QUESTIONS = [
  {
    id: "1",
    question: "Does this come with a warranty?",
    answer: "Yes! All our products come with a 1-year manufacturer warranty.",
    author: "Buyer123",
    date: "2024-01-12",
    helpful: 12,
  },
  {
    id: "2",
    question: "Is the S Pen included?",
    answer: "Yes, the S Pen is built into the phone and included.",
    author: "Kigali Tech Hub",
    date: "2024-01-10",
    seller: true,
    helpful: 8,
  },
];

const RELATED_PRODUCTS = [
  {
    id: "2",
    title: "iPhone 15 Pro Max - 256GB",
    price: 1350000,
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400",
    slug: "iphone-15-pro-max",
    rating: 4.9,
  },
  {
    id: "3",
    title: "Samsung Galaxy Z Fold 5",
    price: 1650000,
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400",
    slug: "galaxy-z-fold-5",
    rating: 4.7,
  },
  {
    id: "4",
    title: "Google Pixel 8 Pro",
    price: 950000,
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400",
    slug: "pixel-8-pro",
    rating: 4.6,
  },
  {
    id: "5",
    title: "OnePlus 12",
    price: 880000,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
    slug: "oneplus-12",
    rating: 4.8,
  },
];

const BULK_PRICING = [
  { quantity: "5-9", discount: "3%" },
  { quantity: "10-24", discount: "5%" },
  { quantity: "25-49", discount: "8%" },
  { quantity: "50+", discount: "12%" },
];

// ============================================
// COMPONENTS
// ============================================

function ImageGallery({
  images,
  title,
  product,
}: {
  images: string[];
  title: string;
  product: any;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div
        className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-zoom-in"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <Image
          src={images[selectedIndex] as string}
          alt={title}
          fill
          className={`object-cover transition-transform duration-300 ${isZoomed ? "scale-150" : ""}`}
          style={
            isZoomed
              ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` }
              : undefined
          }
        />

        {/* Discount Badge */}
        {product.compareAtPrice && (
          <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full font-bold text-sm">
            -{Math.round((1 - product.price / product.compareAtPrice) * 100)}%
          </div>
        )}

        {/* Stock Warning */}
        {product.stock <= 5 && (
          <div className="absolute bottom-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            🔥 Only {product.stock} left!
          </div>
        )}
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedIndex(index)}
            className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
              selectedIndex === index ? "border-teal-600" : "border-transparent"
            }`}
          >
            <Image
              src={image}
              alt={`${title} ${index + 1}`}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* 360 View Button */}
      <button className="flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        View 360°
      </button>
    </div>
  );
}

function SellerCard({
  seller,
  productId,
  onChatSeller,
  isStartingChat,
}: {
  seller: any;
  productId?: string;
  onChatSeller: () => void;
  isStartingChat: boolean;
}) {
  if (!seller) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-center text-gray-500">
          <p>Seller information not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 relative rounded-full overflow-hidden bg-gray-100">
          {seller.logo ? (
            <Image
              src={seller.logo}
              alt={seller.name || "Seller"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
              {seller.name?.charAt(0) || "S"}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/store/${seller.slug || "#"}`}
              className="font-semibold text-gray-900 hover:text-teal-600"
            >
              {seller.name || "Unknown Seller"}
            </Link>
            {seller.verified && (
              <svg
                className="w-4 h-4 text-teal-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4 text-amber-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {seller.rating || seller.stats?.avgRating || 0}
            </span>
            <span>
              ({seller.reviewCount || seller.stats?.reviewCount || 0} reviews)
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>
              {typeof seller.location === "string"
                ? seller.location
                : [seller.location?.city, seller.location?.country]
                    .filter(Boolean)
                    .join(", ") || "Location not specified"}
            </span>
            <span>•</span>
            <span>Joined {seller.joinedDate || "N/A"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="font-semibold text-gray-900">
            {(seller.sales || seller.stats?.totalOrders || 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Sales</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-gray-900">
            {seller.responseRate || 0}%
          </div>
          <div className="text-xs text-gray-500">Response</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-gray-900">1yr</div>
          <div className="text-xs text-gray-500">On Hipa</div>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Link
          href={`/store/${seller.slug || "#"}`}
          className="flex-1 py-2 text-center border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Visit Store
        </Link>
        <button
          onClick={onChatSeller}
          disabled={isStartingChat}
          className="flex-1 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isStartingChat ? "Starting..." : "Chat Seller"}
        </button>
      </div>
    </div>
  );
}

function ProductTabs({ product }: { product: any }) {
  const [activeTab, setActiveTab] = useState("description");

  const tabs = [
    { id: "description", label: "Description" },
    { id: "specifications", label: "Specifications" },
    { id: "shipping", label: "Shipping" },
    { id: "returns", label: "Returns" },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-teal-600 border-b-2 border-teal-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === "description" && (
          <div className="prose max-w-none">
            <p className="text-gray-600 leading-relaxed">
              {product.description || "No description available"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(product.tags || []).map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {activeTab === "specifications" && (
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(product.specifications || {}).map(
              ([key, value]) => (
                <div key={key} className="flex border-b border-gray-100 py-2">
                  <span className="font-medium text-gray-700 w-32">{key}</span>
                  <span className="text-gray-600">{String(value)}</span>
                </div>
              ),
            )}
          </div>
        )}

        {activeTab === "shipping" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-hipa-primary mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              <div>
                <div className="font-medium text-gray-900">
                  {product.shipping?.method || "Standard Shipping"}
                </div>
                <div className="text-sm text-gray-500">
                  {product.shipping?.estimatedDays || "N/A"} •{" "}
                  {(product.shipping?.locations || []).join(", ") ||
                    "All locations"}
                </div>
              </div>
            </div>
            <div className="p-3 bg-hipa-primary/10 rounded-lg">
              <span className="text-hipa-primary">
                Free shipping on orders above{" "}
                {(product.shipping?.freeAbove || 0).toLocaleString()} RWF
              </span>
            </div>
          </div>
        )}

        {activeTab === "returns" && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Easy returns within {product.returns?.days || 14} days of
              delivery.
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Item must be in original condition</li>
              <li>Original packaging required</li>
            </ul>
            <div className="p-3 bg-amber-50 rounded-lg">
              <span className="text-amber-700">
                {product.returns?.fee || "No restocking fee"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: any }) {
  return (
    <div className="border-b border-gray-200 pb-6 last:border-0">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 relative rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
          {review.author?.avatar || review.reviewerAvatar ? (
            <Image
              src={review.author?.avatar || review.reviewerAvatar}
              alt={review.author?.name || review.reviewerName || "Reviewer"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">
              {(review.author?.name || review.reviewerName || "A").charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">
              {review.author?.name || review.reviewerName || "Anonymous"}
            </span>
            <span className="text-xs text-gray-400">
              {review.date || review.createdAt || "N/A"}
            </span>
          </div>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-4 h-4 ${star <= (review.rating || 0) ? "text-amber-400" : "text-gray-300"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <h4 className="font-medium text-gray-900 mb-2">
            {review.title || "No title"}
          </h4>
          <p className="text-gray-600 text-sm mb-3">
            {review.content || review.comment || "No comment"}
          </p>

          {review.images?.length > 0 && (
            <div className="flex gap-2 mb-3">
              {review.images.map((img: string, i: number) => (
                <div
                  key={i}
                  className="w-16 h-16 relative rounded-lg overflow-hidden"
                >
                  <Image
                    src={img}
                    alt="Review image"
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {review.sellerResponse && (
            <div className="p-3 bg-gray-50 rounded-lg mb-3">
              <span className="text-xs font-medium text-teal-600">
                Seller Response:
              </span>
              <p className="text-sm text-gray-600 mt-1">
                {review.sellerResponse}
              </p>
            </div>
          )}

          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-teal-600">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
              />
            </svg>
            Helpful ({review.helpful || 0})
          </button>
        </div>
      </div>
    </div>
  );
}

function QuestionCard({ question }: { question: any }) {
  return (
    <div className="border-b border-gray-200 pb-4 last:border-0">
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">
              {question.question || "No question"}
            </span>
            {question.seller && (
              <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full">
                Seller
              </span>
            )}
          </div>
          <p className="text-gray-600 text-sm mb-2">
            {question.answer || "No answer yet"}
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>{question.author || question.userName || "Anonymous"}</span>
            <span>{question.date || question.createdAt || "N/A"}</span>
            <button className="hover:text-teal-600">
              {question.helpful || 0} found helpful
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BulkPricing() {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <h4 className="font-medium text-gray-900 mb-3">Bulk Pricing (B2B)</h4>
      <div className="space-y-2">
        {BULK_PRICING.map((tier, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-gray-600">{tier.quantity} units</span>
            <span className="font-medium text-teal-600">
              {tier.discount} off
            </span>
          </div>
        ))}
      </div>
      <button className="w-full mt-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">
        Request Quote
      </button>
    </div>
  );
}

function PriceHistoryChart() {
  const data = [
    { month: "Aug", price: 1450000 },
    { month: "Sep", price: 1420000 },
    { month: "Oct", price: 1350000 },
    { month: "Nov", price: 1380000 },
    { month: "Dec", price: 1299000 },
    { month: "Jan", price: 1250000 },
  ];

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <h4 className="font-medium text-gray-900 mb-3">Price History</h4>
      <div className="h-32 flex items-end gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-teal-200 rounded-t"
              style={{
                height: `${((d.price - 1200000) / 300000) * 100}%`,
                minHeight: "4px",
              }}
            />
            <span className="text-xs text-gray-400">{d.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function ProductPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  // State for real data from API
  const [productData, setProductData] = useState<any>(null);
  const [reviewsData, setReviewsData] = useState<any[]>([]);
  const [questionsData, setQuestionsData] = useState<any[]>([]);
  const [relatedProductsData, setRelatedProductsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch product data from API
  useEffect(() => {
    async function fetchProductData() {
      if (!slug) return;

      try {
        const response = await fetch(`/api/products/${slug}`);
        const result = await response.json();

        if (result.success && result.data) {
          setProductData(result.data.product);
          setReviewsData(result.data.reviews || []);
          setQuestionsData(result.data.questions || []);
          setRelatedProductsData(result.data.relatedProducts || []);

          // Log product view activity
          try {
            const token = localStorage.getItem("token");
            if (token) {
              await fetch("/api/activity/log", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  action: "product_viewed",
                  metadata: {
                    productId: result.data.product._id,
                    productName: result.data.product.title,
                    productSlug: slug,
                  },
                }),
              });
            }
          } catch (logError) {
            console.error("Failed to log product view:", logError);
          }
        } else {
          setError("Product not found");
        }
      } catch (err) {
        console.error("Failed to fetch product:", err);
        // Use mock data as fallback
      } finally {
        setLoading(false);
      }
    }

    fetchProductData();
  }, [slug]);

  // Helper function to get product data (real or mock)
  const getProduct = () => {
    if (productData) {
      return {
        id: productData._id || productData.id || "",
        title: productData.title || "",
        description: productData.description || "",
        images: productData.media?.map((m: any) => m.url) || [],
        price: productData.pricing?.base || 0,
        compareAtPrice: productData.pricing?.compareAt,
        rating: productData.stats?.avgRating || 0,
        reviewCount: productData.stats?.reviewCount || 0,
        stock: productData.inventory?.totalStock || 0,
        category: productData.category?.primary || "",
        seller: productData.seller || null,
        sku: productData.sku || "",
        tags: productData.tags || [],
        specifications: productData.specifications || {},
        shipping: productData.shipping || {},
        returns: productData.returns || {},
      };
    }
    return PRODUCT;
  };

  const product = getProduct();
  const reviews = reviewsData.length > 0 ? reviewsData : REVIEWS;
  const questions = questionsData.length > 0 ? questionsData : QUESTIONS;
  const relatedProducts =
    relatedProductsData.length > 0 ? relatedProductsData : RELATED_PRODUCTS;

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="aspect-square bg-gray-200 rounded-xl"></div>
                <div className="space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-12 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  async function handleChatSeller() {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const sellerId =
      product.seller?.userId || product.seller?._id || product.seller?.id;
    if (!sellerId) {
      alert("Seller information not available");
      return;
    }

    try {
      setIsStartingChat(true);

      // Get token from auth store
      const token = useAuthStore.getState().token;
      if (!token) {
        router.push("/login");
        return;
      }

      // Create or get existing conversation
      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: sellerId,
          productId: product.id,
          initialProductMessage: {
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.images?.[0] || "",
            slug: slug,
            content: `Hi, I'm interested in this product: ${product.title}`,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Navigate to messages page with conversation open
        router.push(`/messages?conversation=${data.conversationId}`);
      } else {
        alert(data.error || "Failed to start conversation");
      }
    } catch (err) {
      console.error("Error starting conversation:", err);
      alert("Failed to start conversation. Please try again.");
    } finally {
      setIsStartingChat(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/" className="hover:text-teal-600">
                Home
              </Link>
              <span>/</span>
              <Link href="/search" className="hover:text-teal-600">
                {product.category}
              </Link>
              <span>/</span>
              <span className="text-gray-900">{product.title}</span>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Left Column - Image Gallery */}
            <div>
              <ImageGallery
                images={product.images}
                title={product.title}
                product={product}
              />
            </div>

            {/* Right Column - Product Info */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {product.title}
              </h1>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${star <= Math.floor(product.rating) ? "text-amber-400" : "text-gray-300"}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 ml-1">
                    {product.rating}
                  </span>
                </div>
                <span className="text-gray-300">|</span>
                <Link
                  href="#reviews"
                  className="text-sm text-teal-600 hover:underline"
                >
                  {product.reviewCount} reviews
                </Link>
                <span className="text-gray-300">|</span>
                <span className="text-sm text-gray-500">
                  {product.stock} in stock
                </span>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-gray-900">
                    {product.price.toLocaleString()} RWF
                  </span>
                  {product.compareAtPrice && (
                    <span className="text-lg text-gray-400 line-through">
                      {product.compareAtPrice.toLocaleString()} RWF
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">SKU: {product.sku}</p>
              </div>

              {/* Escrow Badge */}
              <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-lg mb-6">
                <svg
                  className="w-5 h-5 text-teal-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <span className="text-sm text-teal-700">
                  Protected by Hipa Escrow - Pay safely
                </span>
              </div>

              {/* Quantity & Actions */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">Quantity:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-16 text-center border-none focus:outline-none"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    className={`flex-1 py-4 rounded-xl font-semibold transition-all ${
                      addedToCart
                        ? "bg-green-500 text-white"
                        : "bg-teal-600 text-white hover:bg-teal-700"
                    }`}
                  >
                    {addedToCart ? "✓ Added to Cart" : "Add to Cart"}
                  </button>
                  <button
                    onClick={handleChatSeller}
                    disabled={isStartingChat}
                    className="flex-1 py-4 bg-amber-500 text-gray-900 font-semibold rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isStartingChat ? "Starting..." : "Buy Now"}
                  </button>
                </div>
              </div>

              {/* Bulk Pricing & Price History */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <BulkPricing />
                <PriceHistoryChart />
              </div>

              {/* AR Try On */}
              <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-teal-500 hover:text-teal-600 transition-colors flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Try in your space (AR)
              </button>

              {/* Share */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <span className="text-sm text-gray-500">Share:</span>
                <div className="flex gap-2">
                  <button className="p-2 text-gray-400 hover:text-teal-600">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                    </svg>
                  </button>
                  <button className="p-2 text-gray-400 hover:text-teal-600">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </button>
                  <button className="p-2 text-gray-400 hover:text-teal-600">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </button>
                  <button className="p-2 text-gray-400 hover:text-teal-600">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Seller Card */}
              <div className="mt-6">
                <SellerCard
                  seller={product.seller}
                  productId={product.id}
                  onChatSeller={handleChatSeller}
                  isStartingChat={isStartingChat}
                />
              </div>
            </div>
          </div>

          {/* Product Tabs */}
          <div className="mb-8">
            <ProductTabs product={product} />
          </div>

          {/* Reviews Section */}
          <div id="reviews" className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Customer Reviews
              </h2>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Write a Review
              </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {reviews.map((review) => (
                  <ReviewCard key={review._id || review.id} review={review} />
                ))}
              </div>

              <div>
                <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Rate this product
                  </h3>
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((stars) => (
                      <button
                        key={stars}
                        className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg"
                      >
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-4 h-4 ${star <= stars ? "text-amber-400" : "text-gray-300"}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {stars} stars
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Q&A Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Questions & Answers
              </h2>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Ask a Question
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {questions.map((question) => (
                <QuestionCard
                  key={question._id || question.id}
                  question={question}
                />
              ))}
            </div>
          </div>

          {/* Related Products */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Related Products
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {relatedProducts.map((relatedProduct: any) => (
                <Link
                  key={relatedProduct._id || relatedProduct.id}
                  href={`/product/${relatedProduct.slug}`}
                  className="group"
                >
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all">
                    <div className="relative aspect-square bg-gray-100">
                      <Image
                        src={
                          relatedProduct.media?.[0]?.url ||
                          relatedProduct.image ||
                          "https://placehold.co/400x400/1a1a1a/white?text=No+Image"
                        }
                        alt={relatedProduct.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm text-gray-900 line-clamp-2 group-hover:text-teal-600">
                        {relatedProduct.title}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <svg
                          className="w-3 h-3 text-amber-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs text-gray-500">
                          {relatedProduct.stats?.avgRating ||
                            relatedProduct.rating ||
                            0}
                        </span>
                      </div>
                      <p className="font-bold text-gray-900 mt-1">
                        {(
                          relatedProduct.pricing?.base ||
                          relatedProduct.price ||
                          0
                        ).toLocaleString()}{" "}
                        RWF
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
