import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const dynamic = "force-dynamic";
// MongoDB connection
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://deoniyogisubizo:maiden410@myhipa.qkj7r5a.mongodb.net/hipa";

// Cache for database connection
let cachedClient: MongoClient | null = null;

async function getDb() {
  if (cachedClient) {
    return cachedClient.db();
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client.db();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "8");
    const minOrders = parseInt(searchParams.get("minOrders") || "10");

    const db = await getDb();

    // Get products with highest purchases (most sold items)
    // Use lenient filter - include products even if totalStock is missing/undefined
    const products = await db
      .collection("products")
      .aggregate([
        {
          $match: {
            status: "active",
            $or: [
              { "inventory.totalStock": { $gt: 0 } },
              { "inventory.totalStock": { $exists: false } },
              { inventory: { $exists: false } },
            ],
            "stats.purchased": { $gte: minOrders },
          },
        },
        {
          $lookup: {
            from: "sellers",
            localField: "sellerId",
            foreignField: "_id",
            as: "seller",
          },
        },
        {
          $unwind: {
            path: "$seller",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $sort: {
            "stats.purchased": -1, // Most sold first
            "stats.avgRating": -1, // Then by rating
          },
        },
        {
          $limit: limit,
        },
        {
          $project: {
            _id: 1,
            title: 1,
            slug: 1,
            description: 1,
            media: 1,
            pricing: 1,
            inventory: 1,
            stats: 1,
            condition: 1,
            category: 1,
            tags: 1,
            createdAt: 1,
            sellerId: 1,
            sellerName: { $ifNull: ["$seller.store.name", "Unknown Seller"] },
            sellerSlug: { $ifNull: ["$seller.store.slug", "unknown"] },
            sellerTier: { $ifNull: ["$seller.tier", "standard"] },
          },
        },
      ])
      .toArray();

    // If not enough products with minOrders, get more without the filter
    let finalProducts = products;
    if (products.length < limit) {
      const additionalLimit = limit - products.length;
      const additionalProducts = await db
        .collection("products")
        .aggregate([
          {
            $match: {
              status: "active",
              $or: [
                { "inventory.totalStock": { $gt: 0 } },
                { "inventory.totalStock": { $exists: false } },
                { inventory: { $exists: false } },
              ],
              _id: { $nin: products.map((p) => p._id) },
            },
          },
          {
            $lookup: {
              from: "sellers",
              localField: "sellerId",
              foreignField: "_id",
              as: "seller",
            },
          },
          {
            $unwind: {
              path: "$seller",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $sort: {
              "stats.purchased": -1,
              "stats.avgRating": -1,
            },
          },
          {
            $limit: additionalLimit,
          },
          {
            $project: {
              _id: 1,
              title: 1,
              slug: 1,
              description: 1,
              media: 1,
              pricing: 1,
              inventory: 1,
              stats: 1,
              condition: 1,
              category: 1,
              tags: 1,
              createdAt: 1,
              sellerId: 1,
              sellerName: { $ifNull: ["$seller.store.name", "Unknown Seller"] },
              sellerSlug: { $ifNull: ["$seller.store.slug", "unknown"] },
              sellerTier: { $ifNull: ["$seller.tier", "standard"] },
            },
          },
        ])
        .toArray();

      finalProducts = [...products, ...additionalProducts];
    }

    // Calculate end times (flash deals expire in 24 hours from now)
    const now = new Date();
    finalProducts = finalProducts.map((product, index) => {
      const hoursLeft = 24 - index * 2; // Stagger the end times
      const endTime = new Date(now.getTime() + hoursLeft * 60 * 60 * 1000);
      return {
        ...product,
        endsAt: endTime.toISOString(),
        totalStock: product.inventory?.totalStock || 100,
        stock: product.inventory?.totalStock || 100,
      };
    });

    return NextResponse.json({
      success: true,
      data: finalProducts,
      count: finalProducts.length,
    });
  } catch (error) {
    console.error("Error fetching flash deals:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch flash deals" },
      { status: 500 },
    );
  }
}
