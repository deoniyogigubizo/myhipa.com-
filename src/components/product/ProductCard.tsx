"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatRWF, calculateDiscount } from "@/lib/utils/currency";
import { useCartStore } from "@/store/cartStore";

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  compareAtPrice?: number | undefined;
  image: string;
  rating?: number;
  reviewCount?: number;
  sellerName?: string | undefined;
  sellerSlug?: string | undefined;
  isVerified?: boolean;
  stock?: number;
  slug: string;
  isFeatured?: boolean; // Add featured prop for black background
}

export default function ProductCard({
  id,
  title,
  price,
  compareAtPrice,
  image,
  rating = 0,
  reviewCount = 0,
  sellerName,
  sellerSlug,
  isVerified,
  stock = 0,
  slug,
  isFeatured = false,
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const discount = compareAtPrice
    ? calculateDiscount(compareAtPrice, price)
    : 0;
  const isLowStock = stock > 0 && stock <= 5;

  // Dynamic classes based on featured status
  const cardBgClass = isFeatured ? "bg-black" : "bg-beige-100";
  const contentBgClass = isFeatured ? "bg-black" : "bg-beige-50";
  const textPrimaryClass = isFeatured ? "text-white" : "text-gray-900";
  const textSecondaryClass = isFeatured ? "text-gray-400" : "text-gray-500";
  const buttonBgClass = "bg-antique-white";
  const buttonHoverBgClass = "hover:bg-green-600/90";
  const borderClass = isFeatured ? "border-gray-800" : "border-beige-200";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: id,
      slug,
      title,
      image,
      price,
      quantity: 1,
      sellerId: "",
      sellerName: sellerName || "",
    });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  return (
    <Link
      href={`/product/${slug}`}
      className={`group relative block ${cardBgClass} rounded-xl border ${borderClass} overflow-hidden transition-all duration-300 hover:shadow-lg`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div
        className={`relative aspect-[4/3] ${isFeatured ? "bg-gray-900" : "bg-beige-200"} overflow-hidden`}
      >
        <Image
          src={image || "/placeholder.jpg"}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-none">
            -{discount}%
          </div>
        )}

        {/* Low Stock Badge */}
        {isLowStock && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-none">
            Only {stock} left
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className={`absolute top-2 right-2 p-2 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100 ${isFeatured ? "bg-gray-800 hover:bg-gray-700" : "bg-white/90 hover:bg-white"}`}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <svg
            className={`w-4 h-4 ${isWishlisted ? "text-red-500 fill-current" : isFeatured ? "text-gray-300" : "text-gray-600"}`}
            fill={isWishlisted ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>

        {/* Quick Add Button - Antique White with Green opacity */}
        <button
          onClick={handleAddToCart}
          className={`absolute bottom-2 left-2 right-2 ${buttonBgClass} text-gray-900 py-1.5 px-3 rounded-lg font-medium text-xs transition-all duration-300 ${
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          } ${buttonHoverBgClass} hover:text-white border-2 border-transparent hover:border-green-700`}
        >
          Add to Cart
        </button>
      </div>

      {/* Content */}
      <div className={`p-3 ${contentBgClass}`}>
        {/* Seller Info */}
        {sellerName && (
          <div className="flex items-center gap-1 mb-1">
            <Link
              href={`/store/${sellerSlug}`}
              className={`text-xs ${textSecondaryClass} hover:text-green-500 truncate`}
              onClick={(e) => e.stopPropagation()}
            >
              {sellerName}
            </Link>
            {isVerified && (
              <svg
                className="w-3 h-3 text-green-500"
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
        )}

        {/* Product Title */}
        <h3
          className={`text-sm font-medium ${textPrimaryClass} line-clamp-2 min-h-[2.5rem] group-hover:text-green-500`}
        >
          {title}
        </h3>

        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-3 h-3 ${star <= rating ? "text-yellow-400" : isFeatured ? "text-gray-600" : "text-gray-300"}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className={`text-xs ${textSecondaryClass}`}>
              ({reviewCount})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-base font-bold ${textPrimaryClass}`}>
            {formatRWF(price)}
          </span>
          {compareAtPrice && (
            <span className={`text-sm ${textSecondaryClass} line-through`}>
              {formatRWF(compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
