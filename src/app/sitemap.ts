import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://myhipa.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
  // DYNAMIC PAGES (best-effort, skipped if DB unavailable)
  // ============================================
  let dynamicPages: MetadataRoute.Sitemap = [];

  try {
    const connectDB = (await import("@/lib/database/mongodb")).default;
    const { Product, Seller } = await import("@/lib/database/schemas");

    await connectDB();

    const products = await Product.find({ status: "active" })
      .select("slug updatedAt createdAt")
      .sort({ updatedAt: -1 })
      .limit(10000)
      .lean();

    const productPages = products.map((product) => ({
      url: `${BASE_URL}/product/${product.slug}`,
      lastModified: product.updatedAt || product.createdAt || now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    const sellers = await Seller.find({ status: "active" })
      .select("store.slug updatedAt createdAt")
      .sort({ updatedAt: -1 })
      .limit(10000)
      .lean();

    const storePages = sellers
      .filter((s: any) => s.store?.slug)
      .map((seller: any) => ({
        url: `${BASE_URL}/store/${seller.store.slug}`,
        lastModified: seller.updatedAt || seller.createdAt || now,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      }));

    dynamicPages = [...productPages, ...storePages];
  } catch (error) {
    console.error("Sitemap: Failed to fetch dynamic pages", error);
  }

  const allEntries = [...staticPages, ...categoryPages, ...dynamicPages];

  return allEntries;
}
