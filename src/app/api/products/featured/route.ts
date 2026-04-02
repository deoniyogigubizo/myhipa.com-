import { NextResponse } from "next/server";
import mongoose from "mongoose";

// MongoDB connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb+srv://deoniyogisubizo:maiden410@myhipa.qkj7r5a.mongodb.net/hipa";

interface ProductDoc {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  media: { url: string; type: string; isPrimary: boolean }[];
  pricing: { base: number; compareAt?: number; currency: string };
  inventory: { totalStock: number };
  stats: { avgRating: number; reviewCount: number; views: number };
  condition: string;
  status: string;
  sellerId: mongoose.Types.ObjectId;
}

interface SellerDoc {
  _id: mongoose.Types.ObjectId;
  store: { name: string; slug: string };
  tier: string;
  stats: { avgRating: number };
}

// Cache for database connection
let cachedConn: mongoose.Connection | null = null;

async function getDb() {
  if (cachedConn && cachedConn.readyState === 1) {
    return cachedConn;
  }

  const opts = {
    bufferCommands: false,
  };

  const conn = await mongoose.connect(MONGODB_URI, opts);
  cachedConn = conn.connection;
  return cachedConn;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "8");

    const db = await getDb();

    // Get trusted sellers (silver/gold tier), fallback to all sellers if none found
    let trustedSellers = await db
      .collection("sellers")
      .find({ tier: { $in: ["silver", "gold"] } })
      .project<{
        _id: mongoose.Types.ObjectId;
        store: { name: string; slug: string };
      }>({ _id: 1, "store.name": 1, "store.slug": 1 })
      .limit(20)
      .toArray();

    // Fallback: if no silver/gold sellers, get any active sellers
    if (trustedSellers.length === 0) {
      trustedSellers = await db
        .collection("sellers")
        .find({ kycStatus: "verified" })
        .project<{
          _id: mongoose.Types.ObjectId;
          store: { name: string; slug: string };
        }>({ _id: 1, "store.name": 1, "store.slug": 1 })
        .limit(20)
        .toArray();
    }

    const sellerIds = trustedSellers.map((s) => s._id);

    // Fetch products from trusted sellers with highest reviews
    const products = await db
      .collection("products")
      .aggregate([
        {
          $match: {
            sellerId: { $in: sellerIds },
            status: "active",
            $or: [
              { "inventory.totalStock": { $gt: 0 } },
              { "inventory.totalStock": { $exists: false } },
              { inventory: { $exists: false } },
            ],
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
          $unwind: "$seller",
        },
        {
          $project: {
            title: 1,
            slug: 1,
            description: 1,
            media: 1,
            pricing: 1,
            inventory: 1,
            stats: 1,
            condition: 1,
            sellerId: 1,
            sellerName: "$seller.store.name",
            sellerSlug: "$seller.store.slug",
            sellerTier: "$seller.tier",
          },
        },
        {
          $sort: {
            "stats.reviewCount": -1,
            "stats.avgRating": -1,
          },
        },
        {
          $limit: limit,
        },
      ])
      .toArray();

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch featured products" },
      { status: 500 },
    );
  }
}
