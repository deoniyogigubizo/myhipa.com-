import { MetadataRoute } from "next";
import connectDB from "@/lib/database/mongodb";
import { Product, Seller } from "@/lib/database/schemas";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://myhipa.com";

// Maximum URLs per sitemap (Google limit is 50,000)
const MAX_URLS_PER_SITEMAP = 45000;

export async function generateSitemaps() {
  // For large sites: generates multiple sitemap chunks
  // e.g., /sitemap.xml, /sitemap-1.xml, /sitemap-2.xml
  await connectDB();

  const productCount = await Product.countDocuments({ status: "active" });
  const sellerCount = await Seller.countDocuments({ status: "active" });
  const totalDynamic = productCount + sellerCount;

  const chunks = Math.ceil(totalDynamic / MAX_URLS_PER_SITEMAP);
  const sitemaps = Array.from({ length: Math.max(1, chunks) }, (_, i) => ({
    id: i,
  }));

  return sitemaps;
}

export default async function sitemap({
  id,
}: { id?: number } = {}): Promise<MetadataRoute.Sitemap> {
  await connectDB();

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // ============================================
  // STATIC PAGES (always included)
  // ============================================
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/stores`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/sellers`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/new-arrivals`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/community`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: oneWeekAgo,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/advertising`,
      lastModified: oneWeekAgo,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/artisan-stories`,
      lastModified: oneWeekAgo,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/regional-collections`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/recently-viewed`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.3,
    },
  ];

  // ============================================
  // CATEGORY PAGES
  // ============================================
  const categories = [
    "electronics-media",
    "fashion-apparel",
    "home-garden-tools",
    "health-beauty-personal-care",
    "sports-outdoors-travel",
    "baby-kids",
    "automotive-industrial",
    "pet-supplies",
    "groceries-essentials",
    "digital-products",
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${BASE_URL}/search?category=${cat}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // ============================================
  // DYNAMIC PAGES: Products
  // ============================================
  let productPages: MetadataRoute.Sitemap = [];

  try {
    const skip = (id ?? 0) * MAX_URLS_PER_SITEMAP;

    const products = await Product.find({ status: "active" })
      .select("slug updatedAt createdAt")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(MAX_URLS_PER_SITEMAP)
      .lean();

    productPages = products.map((product) => ({
      url: `${BASE_URL}/product/${product.slug}`,
      lastModified: product.updatedAt || product.createdAt || now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error("Sitemap: Failed to fetch products", error);
  }

  // ============================================
  // DYNAMIC PAGES: Stores (Sellers)
  // ============================================
  let storePages: MetadataRoute.Sitemap = [];

  try {
    const sellers = await Seller.find({ status: "active" })
      .select("store.slug updatedAt createdAt")
      .sort({ updatedAt: -1 })
      .limit(10000)
      .lean();

    storePages = sellers
      .filter((s) => s.store?.slug)
      .map((seller) => ({
        url: `${BASE_URL}/store/${seller.store.slug}`,
        lastModified: seller.updatedAt || seller.createdAt || now,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      }));
  } catch (error) {
    console.error("Sitemap: Failed to fetch sellers", error);
  }

  // ============================================
  // COMBINE ALL ENTRIES
  // ============================================
  const allEntries = [
    ...staticPages,
    ...categoryPages,
    ...productPages,
    ...storePages,
  ];

  console.log(
    `Sitemap generated: ${allEntries.length} URLs (products: ${productPages.length}, stores: ${storePages.length})`,
  );

  return allEntries;
}
