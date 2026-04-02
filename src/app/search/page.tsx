"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/layout/Footer";
import { useCartStore } from "@/store/cartStore";

// ============================================
// TYPES
// ============================================

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
  };
  inventory: {
    totalStock: number;
  };
  stats: {
    avgRating: number;
    reviewCount: number;
    totalSold: number;
  };
  condition: string;
  tags?: string[];
  createdAt: string;
  seller: {
    _id: string;
    storeName: string;
    storeSlug: string;
    location?: string | { city?: string; country?: string };
    tier: string;
    kycStatus: string;
  };
}

// ============================================
// COMPONENTS
// ============================================

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b py-4" style={{ borderColor: "#e5e5e5" }}>
      <h3 className="font-semibold mb-3" style={{ color: "#1a1a1a" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function PriceRangeInput({
  min,
  max,
  onChange,
}: {
  min: string;
  max: string;
  onChange: (min: string, max: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        placeholder="Min"
        value={min}
        onChange={(e) => onChange(e.target.value, max)}
        className="w-full px-3 py-2 rounded-lg text-sm"
        style={{
          border: "1px solid #87ceeb",
          backgroundColor: "#fffdd0",
          color: "#1a1a1a",
        }}
      />
      <span style={{ color: "#87ceeb" }}>-</span>
      <input
        type="number"
        placeholder="Max"
        value={max}
        onChange={(e) => onChange(min, e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm"
        style={{
          border: "1px solid #87ceeb",
          backgroundColor: "#fffdd0",
          color: "#1a1a1a",
        }}
      />
    </div>
  );
}

function FilterCheckbox(props: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  count?: number;
}) {
  const { label, checked, onChange, count } = props;
  return (
    <label className="flex items-center gap-2 py-1 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded"
        style={{ accentColor: "#87ceeb" }}
      />
      <span className="text-sm" style={{ color: "#2d2d2d" }}>
        {label}
      </span>
      {count !== undefined && (
        <span className="text-xs" style={{ color: "#87ceeb" }}>
          ({count})
        </span>
      )}
    </label>
  );
}

function SortDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const options = [
    { value: "createdAt-desc", label: "Newest First" },
    { value: "pricing.base-asc", label: "Price: Low to High" },
    { value: "pricing.base-desc", label: "Price: High to Low" },
    { value: "stats.avgRating-desc", label: "Top Rated" },
    { value: "stats.totalSold-desc", label: "Best Sales" },
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-4 py-2 rounded-lg text-sm"
      style={{
        border: "1px solid #87ceeb",
        backgroundColor: "#fffdd0",
        color: "#1a1a1a",
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function SearchResultCard({ product }: { product: Product }) {
  const hasDiscount =
    product.pricing?.compareAt &&
    product.pricing.base < product.pricing.compareAt;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.pricing.base / product.pricing.compareAt) * 100)
    : 0;
  const { addItem } = useCartStore();

  const handleAddToCart = (e: React.MouseEvent) => {
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
      sellerName: product.seller?.storeName || "Unknown Seller",
    });
  };

  return (
    <Link href={`/product/${product.slug}`} className="group">
      <div
        className="rounded-[2px] overflow-hidden hover:shadow-xl transition-all"
        style={{ border: "1px solid #e5e5e5", backgroundColor: "white" }}
      >
        <div
          className="relative aspect-square"
          style={{ backgroundColor: "#2d2d2d" }}
        >
          {product.media && product.media[0] ? (
            <Image
              src={product.media[0].url}
              alt={product.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl">📦</span>
            </div>
          )}
          {hasDiscount && (
            <div
              className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold text-white"
              style={{ backgroundColor: "#ef4444" }}
            >
              -{discountPercent}%
            </div>
          )}
          {product.condition === "new" && (
            <div
              className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-medium"
              style={{ backgroundColor: "#87ceeb", color: "#1a1a1a" }}
            >
              ✨ New
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="text-xs mb-1" style={{ color: "#87ceeb" }}>
            {product.category.primary}
          </p>
          <h3
            className="font-medium line-clamp-2 mb-2"
            style={{ color: "#1a1a1a" }}
          >
            {product.title}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              <span style={{ color: "#fbbf24" }}>★</span>
              <span
                className="text-sm font-medium"
                style={{ color: "#1a1a1a" }}
              >
                {product.stats?.avgRating?.toFixed(1) || "N/A"}
              </span>
            </div>
            <span className="text-xs" style={{ color: "#87ceeb" }}>
              ({product.stats?.reviewCount || 0})
            </span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Link
              href={`/store/${product.seller?.storeSlug}`}
              className="text-sm flex items-center gap-1"
              style={{ color: "#5bbce4" }}
              onClick={(e) => e.stopPropagation()}
            >
              {product.seller?.storeName || "Unknown Seller"}
              {product.seller?.kycStatus === "verified" && (
                <span style={{ color: "#22c55e" }}>✓</span>
              )}
            </Link>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold" style={{ color: "#1a1a1a" }}>
              ${product.pricing?.base?.toFixed(2) || "0.00"}
            </span>
            {hasDiscount && (
              <span
                className="text-sm line-through"
                style={{ color: "#9ca3af" }}
              >
                ${product.pricing.compareAt?.toFixed(2)}
              </span>
            )}
          </div>
          {product.seller?.location && (
            <div
              className="flex items-center gap-1 mt-2 text-xs"
              style={{ color: "#2d2d2d" }}
            >
              <span>📍</span>
              {typeof product.seller.location === "string"
                ? product.seller.location
                : [
                    product.seller.location.city,
                    product.seller.location.country,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Location not specified"}
            </div>
          )}
          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="w-full mt-3 py-2 rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
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
      </div>
    </Link>
  );
}

// ============================================
// MAIN PAGE
// ============================================

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [minRating, setMinRating] = useState("");
  const [sortBy, setSortBy] = useState("createdAt-desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(true);

  // Real data from database
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 24,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // Fetch products from database
  useEffect(() => {
    fetchProducts();
  }, [searchParams, category, sortBy, pagination.page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      // Build query params
      const params = new URLSearchParams();
      if (initialQuery) params.set("q", initialQuery);
      if (category) params.set("category", category);
      if (priceMin) params.set("minPrice", priceMin);
      if (priceMax) params.set("maxPrice", priceMax);
      if (minRating) params.set("minRating", minRating);

      const [sortField, sortOrder] = sortBy.split("-");
      params.set("sortBy", sortField);
      params.set("sortOrder", sortOrder);
      params.set("page", pagination.page.toString());
      params.set("limit", "24");

      const response = await fetch(`/api/products/search?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
        setPagination((prev) => ({
          ...prev,
          ...data.pagination,
        }));
        if (data.availableCategories) {
          setAvailableCategories(data.availableCategories);
        }
      } else {
        setError(data.error || "Failed to load products");
      }
    } catch (err) {
      setError(
        "Failed to connect to database. Please ensure MongoDB is running.",
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (category) params.set("category", category);

    // Log search activity
    try {
      const token = localStorage.getItem("token");
      if (token && searchQuery) {
        await fetch("/api/activity/log", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "search_performed",
            metadata: {
              query: searchQuery,
              category: category || "all",
            },
          }),
        });
      }
    } catch (error) {
      console.error("Failed to log search activity:", error);
    }

    router.push(`/search?${params.toString()}`);
  };

  const handleFilterChange = () => {
    // Re-fetch with new filters
    fetchProducts();
  };

  const clearFilters = () => {
    setPriceMin("");
    setPriceMax("");
    setMinRating("");
    setCategory("");
  };

  const activeFilterCount = [priceMin || priceMax, minRating, category].filter(
    Boolean,
  ).length;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#f5f5dc" }}
    >
      <main className="flex-1">
        {/* Search Header - Black background */}
        <div
          className="sticky top-16 z-40"
          style={{ backgroundColor: "#1a1a1a" }}
        >
          <div className="max-w-7xl mx-auto px-4 py-4">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ color: "#87ceeb" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl"
                  style={{
                    border: "2px solid #87ceeb",
                    backgroundColor: "#fffdd0",
                    color: "#1a1a1a",
                  }}
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 font-medium rounded-xl transition-colors"
                style={{ backgroundColor: "#87ceeb", color: "#1a1a1a" }}
              >
                Search
              </button>
            </form>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>
                {initialQuery
                  ? `Results for "${initialQuery}"`
                  : "All Products"}
              </h1>
              <p className="mt-1" style={{ color: "#5bbce4" }}>
                {pagination.total} products found
              </p>
            </div>
            <div className="flex items-center gap-3">
              <SortDropdown value={sortBy} onChange={setSortBy} />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-lg"
                style={{
                  border: "1px solid #87ceeb",
                  backgroundColor: showFilters ? "#1a1a1a" : "transparent",
                  color: showFilters ? "#f5f5dc" : "#1a1a1a",
                }}
              >
                Filters
                {activeFilterCount > 0 && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "#87ceeb", color: "#1a1a1a" }}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Filters Sidebar - Beige background */}
            {showFilters && (
              <aside className="w-64 flex-shrink-0 hidden lg:block">
                <div
                  className="rounded-xl p-4 sticky top-36"
                  style={{
                    backgroundColor: "#faebd7",
                    border: "1px solid #87ceeb",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold" style={{ color: "#1a1a1a" }}>
                      Filters
                    </h2>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={clearFilters}
                        className="text-sm hover:underline"
                        style={{ color: "#87ceeb" }}
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <FilterSection title="Category">
                    <FilterCheckbox
                      label="All Categories"
                      checked={category === ""}
                      onChange={() => setCategory("")}
                    />
                    {availableCategories.slice(0, 10).map((cat) => (
                      <FilterCheckbox
                        key={cat}
                        label={cat}
                        checked={category === cat}
                        onChange={(checked) => {
                          setCategory(checked ? cat : "");
                          handleFilterChange();
                        }}
                      />
                    ))}
                  </FilterSection>
                </div>
              </aside>
            )}

            {/* Products Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div
                      key={i}
                      className="bg-white rounded-[2px] overflow-hidden animate-pulse"
                    >
                      <div className="aspect-square bg-gray-200" />
                      <div className="p-4">
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
                    No products found
                  </p>
                  <p className="mt-2" style={{ color: "#5bbce4" }}>
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
                  {products.map((product) => (
                    <SearchResultCard key={product._id} product={product} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from(
                    { length: pagination.totalPages },
                    (_, i) => i + 1,
                  ).map((page) => (
                    <button
                      key={page}
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page }))
                      }
                      className={`px-4 py-2 rounded-lg font-medium ${
                        pagination.page === page
                          ? "text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      style={{
                        backgroundColor:
                          pagination.page === page ? "#1a1a1a" : "transparent",
                        border:
                          pagination.page === page
                            ? "none"
                            : "1px solid #e5e5e5",
                      }}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
