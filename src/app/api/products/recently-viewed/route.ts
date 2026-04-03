import { NextRequest, NextResponse } from "next/server";
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
    bufferCommands: true,
  };

  const conn = await mongoose.connect(MONGODB_URI, opts);
  cachedConn = conn.connection;
  return cachedConn;
}

// GET: Retrieve recently viewed products
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();

    // For now, return some recent products as recently viewed
    // In a real implementation, this would track per user based on their browsing history
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
          $project: {
            _id: 1,
            title: 1,
            slug: 1,
            pricing: 1,
            media: 1,
            stats: 1,
            sellerName: "$seller.businessName",
            sellerSlug: "$seller.slug",
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $limit: 4,
        },
      ])
      .toArray();

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Failed to fetch recently viewed products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch recently viewed products" },
      { status: 500 },
    );
  }
}

// POST: Track a product view
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, userId } = body;

    // For now, just log the view
    // In a real implementation, this would store the view in a user_views collection
    console.log(
      `Product view tracked: ${productId} by user ${userId || "anonymous"}`,
    );

    return NextResponse.json({
      success: true,
      message: "Product view tracked",
    });
  } catch (error) {
    console.error("Failed to track product view:", error);
    return NextResponse.json(
      { success: false, error: "Failed to track product view" },
      { status: 500 },
    );
  }
}
