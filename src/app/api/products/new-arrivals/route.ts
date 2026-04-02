import { NextResponse } from "next/server";
import mongoose from "mongoose";


export const dynamic = "force-dynamic";
// MongoDB connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb+srv://deoniyogisubizo:maiden410@myhipa.qkj7r5a.mongodb.net/hipa";

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
    const limit = parseInt(searchParams.get("limit") || "25");
    const skip = parseInt(searchParams.get("skip") || "0");
    const category = searchParams.get("category");

    const db = await getDb();

    // Build query - products created in last 30 days considered "new"
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const query: Record<string, unknown> = {
      status: "active",
      $or: [
        { "inventory.totalStock": { $gt: 0 } },
        { "inventory.totalStock": { $exists: false } },
        { inventory: { $exists: false } },
      ],
    };

    if (category) {
      query["category.primary"] = category;
    }

    // Fetch newest products sorted by createdAt descending
    const products = await db
      .collection("products")
      .aggregate([
        {
          $match: query,
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
          $project: {
            _id: 1,
            title: 1,
            slug: 1,
            description: 1,
            category: 1,
            media: 1,
            pricing: 1,
            variants: 1,
            inventory: 1,
            tags: 1,
            condition: 1,
            status: 1,
            stats: 1,
            createdAt: 1,
            seller: {
              _id: "$seller._id",
              storeName: "$seller.store.storeName",
              storeSlug: "$seller.store.slug",
              tier: "$seller.tier",
              stats: "$seller.stats",
            },
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ])
      .toArray();

    // Get total count for pagination
    const total = await db.collection("products").countDocuments(query);

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
      total,
      pagination: {
        page: Math.floor(skip / limit) + 1,
        limit,
        total,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching new arrivals:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch new arrivals" },
      { status: 500 },
    );
  }
}
