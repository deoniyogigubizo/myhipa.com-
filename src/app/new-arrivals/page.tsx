"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useCartStore } from "@/store/cartStore";

interface Product {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  pricing: {
    base: number;
    compareAt?: number;
  };
  media: Array<{ url: string; alt?: string }>;
  category: {
    primary: string;
    secondary?: string;
    tertiary?: string;
  };
  inventory: {
    totalStock: number;
    reserved: number;
  };
  stats: {
    avgRating: number;
    reviewCount: number;
    totalSold: number;
  };
  condition: "new" | "used" | "refurbished";
  tags?: string[];
  createdAt: string;
  seller: {
    _id: string;
    storeName: string;
    storeSlug: string;
    tier: string;
    stats: {
      totalSales: number;
      avgRating: number;
    };
  };
}

export default function NewArrivalsPage() {
  const { addItem } = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    hasMore: true,
  });

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        skip: "0",
        ...(selectedCategory && { category: selectedCategory }),
      });

      const response = await fetch(`/api/products/new-arrivals?${params}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
        setPagination((prev) => ({
          ...prev,
          total: data.total,
          hasMore: data.pagination.hasMore,
        }));
      } else {
        setError(data.error || "Failed to load products");
      }
    } catch (err) {
      setError("Failed to connect to database");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        skip: products.length.toString(),
        ...(selectedCategory && { category: selectedCategory }),
      });

      const response = await fetch(`/api/products/new-arrivals?${params}`);
      const data = await response.json();

      if (data.success) {
        setProducts((prev) => [...prev, ...data.data]);
        setPagination((prev) => ({
          ...prev,
          hasMore: data.pagination.hasMore,
        }));
      }
    } catch (err) {
      console.error("Failed to load more products", err);
    }
  };

  const categories = [
    { id: "", name: "All Categories" },
    { id: "electronics", name: "Electronics" },
    { id: "fashion", name: "Fashion" },
    { id: "home", name: "Home & Living" },
    { id: "food", name: "Food & Grocery" },
    { id: "beauty", name: "Beauty & Health" },
    { id: "sports", name: "Sports" },
  ];

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case "new":
        return { bg: "#87ceeb", text: "#1a1a1a", label: "New" };
      case "used":
        return { bg: "#faebd7", text: "#2d2d2d", label: "Used" };
      case "refurbished":
        return { bg: "#f5f5dc", text: "#1a1a1a", label: "Refurbished" };
      default:
        return { bg: "#e5e5e5", text: "#2d2d2d", label: condition };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#f5f5dc" }}
    >
      <Navbar />

      {/* Hero Section - Black background */}
      <div
        className="relative py-16 px-4"
        style={{ backgroundColor: "#1a1a1a" }}
      >
        <div className="max-w-7xl mx-auto">
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: "#f5f5dc" }}
          >
            ✨ New Arrivals
          </h1>
          <p
            className="text-lg md:text-xl max-w-2xl"
            style={{ color: "#87ceeb" }}
          >
            Be the first to discover the latest products added to Hipa. Fresh
            inventory from verified sellers across Africa.
          </p>
        </div>

        {/* Skyblue accent line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ backgroundColor: "#87ceeb" }}
        />
      </div>

      {/* Category Filter - Beige background */}
      <div className="py-6 px-4" style={{ backgroundColor: "#faebd7" }}>
        <div className="max-w-7xl mx-auto flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat.id ? "text-white" : "text-gray-700"
              }`}
              style={{
                backgroundColor:
                  selectedCategory === cat.id ? "#1a1a1a" : "#fffdd0",
                border:
                  selectedCategory === cat.id ? "none" : "1px solid #87ceeb",
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="px-4 py-4" style={{ backgroundColor: "#fffdd0" }}>
        <div className="max-w-7xl mx-auto">
          <p style={{ color: "#2d2d2d" }}>
            <span style={{ color: "#87ceeb", fontWeight: "bold" }}>
              {pagination.total}
            </span>{" "}
            new products available
          </p>
        </div>
      </div>

      {/* Main Content - Products Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg overflow-hidden animate-pulse"
              >
                <div className="h-48" style={{ backgroundColor: "#2d2d2d" }} />
                <div className="p-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-xl" style={{ color: "#1a1a1a" }}>
              {error}
            </p>
            <button
              onClick={fetchProducts}
              className="mt-4 px-6 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: "#1a1a1a" }}
            >
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div
            className="text-center py-16 bg-white rounded-xl"
            style={{ border: "2px solid #87ceeb" }}
          >
            <p className="text-xl" style={{ color: "#1a1a1a" }}>
              No new products yet
            </p>
            <p className="mt-2" style={{ color: "#5bbce4" }}>
              Check back soon for new arrivals
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => {
              const condition = getConditionBadge(product.condition);
              return (
                <Link
                  key={product._id}
                  href={`/product/${product.slug}`}
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
                  style={{ border: "1px solid #e5e5e5" }}
                >
                  {/* Product Image */}
                  <div
                    className="h-48 relative"
                    style={{ backgroundColor: "#2d2d2d" }}
                  >
                    {product.media && product.media[0] ? (
                      <img
                        src={product.media[0].url}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl">📦</span>
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                      <span
                        className="px-1.5 py-0.5 rounded-none text-[10px] font-medium"
                        style={{
                          backgroundColor: condition.bg,
                          color: condition.text,
                        }}
                      >
                        {condition.label}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-none text-white"
                        style={{ backgroundColor: "#1a1a1a" }}
                      >
                        {formatDate(product.createdAt)}
                      </span>
                    </div>

                    {/* Discount Badge */}
                    {product.pricing?.compareAt &&
                      product.pricing.base < product.pricing.compareAt && (
                        <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-none text-[10px] font-bold text-white bg-red-500">
                          {Math.round(
                            (1 -
                              product.pricing.base /
                                product.pricing.compareAt) *
                              100,
                          )}
                          % OFF
                        </div>
                      )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3">
                    {/* Category */}
                    <p className="text-xs mb-1" style={{ color: "#87ceeb" }}>
                      {product.category.primary}
                    </p>

                    {/* Title */}
                    <h3
                      className="font-semibold text-sm mb-1 line-clamp-2"
                      style={{ color: "#1a1a1a" }}
                    >
                      {product.title}
                    </h3>

                    {/* Seller */}
                    <Link
                      href={`/store/${product.seller?.storeSlug}`}
                      className="text-xs block mb-2 hover:underline"
                      style={{ color: "#5bbce4" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      by {product.seller?.storeName || "Unknown Seller"}
                    </Link>

                    {/* Pricing */}
                    <div className="flex items-baseline gap-2 mb-2">
                      <span
                        className="font-bold text-lg"
                        style={{ color: "#1a1a1a" }}
                      >
                        ${product.pricing?.base?.toFixed(2) || "0.00"}
                      </span>
                      {product.pricing?.compareAt &&
                        product.pricing.base < product.pricing.compareAt && (
                          <span
                            className="text-xs line-through"
                            style={{ color: "#9ca3af" }}
                          >
                            ${product.pricing.compareAt.toFixed(2)}
                          </span>
                        )}
                    </div>

                    {/* Stats */}
                    <div
                      className="flex items-center gap-3 text-xs"
                      style={{ color: "#2d2d2d" }}
                    >
                      {product.stats?.avgRating && (
                        <span className="flex items-center gap-1">
                          ⭐ {product.stats.avgRating.toFixed(1)}
                        </span>
                      )}
                      <span>{product.stats?.totalSold || 0} sold</span>
                      {product.inventory?.totalStock && (
                        <span
                          className={
                            product.inventory.totalStock < 10
                              ? "text-red-500"
                              : ""
                          }
                        >
                          {product.inventory.totalStock} left
                        </span>
                      )}
                    </div>
                    {/* Add to Cart Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addItem({
                          productId: product._id,
                          slug: product.slug,
                          title: product.title,
                          image: product.media?.[0]?.url || "",
                          price: product.pricing?.base || 0,
                          quantity: 1,
                          sellerId: product.seller?._id || "",
                          sellerName:
                            product.seller?.storeName || "Unknown Seller",
                        });
                      }}
                      className="w-full mt-3 py-2 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: "#0d9488", color: "white" }}
                    >
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
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Add to Cart
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {pagination.hasMore && !loading && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              className="px-8 py-3 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: "#1a1a1a", color: "white" }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#2d2d2d")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#1a1a1a")
              }
            >
              Load More Products
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
