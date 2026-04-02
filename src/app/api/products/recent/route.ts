import { NextResponse } from "next/server";
import mongoose from "mongoose";

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

    const db = await getDb();

    // Fetch recent products sorted by createdAt descending
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
            createdAt: -1,
          },
        },
        {
          $skip: skip,
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

    // Get total count for pagination
    const totalCount = await db.collection("products").countDocuments({
      status: "active",
      $or: [
        { "inventory.totalStock": { $gt: 0 } },
        { "inventory.totalStock": { $exists: false } },
        { inventory: { $exists: false } },
      ],
    });

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
      total: totalCount,
      pagination: {
        limit,
        skip,
        hasMore: skip + limit < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching recent products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch recent products" },
      { status: 500 },
    );
  }
}
