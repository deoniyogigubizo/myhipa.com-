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
    const limit = parseInt(searchParams.get("limit") || "6");

    const db = await getDb();

    // Get trending/popular products based on views, likes, and recency
    // Use $ifNull to handle missing stats fields gracefully
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
          $addFields: {
            popularityScore: {
              $add: [
                { $multiply: [{ $ifNull: ["$stats.views", 0] }, 1] },
                { $multiply: [{ $ifNull: ["$stats.likes", 0] }, 2] },
                { $multiply: [{ $ifNull: ["$stats.shares", 0] }, 3] },
                { $multiply: [{ $ifNull: ["$stats.reviewCount", 0] }, 5] },
                { $multiply: [{ $ifNull: ["$stats.purchased", 0] }, 10] },
                {
                  $ifNull: [
                    {
                      $divide: [
                        { $subtract: [new Date(), "$createdAt"] },
                        86400000,
                      ],
                    },
                    0,
                  ],
                },
              ],
            },
          },
        },
        {
          $sort: { popularityScore: -1, "pricing.base": -1 },
        },
        {
          $limit: limit,
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
          $unwind: { path: "$seller", preserveNullAndEmptyArrays: true },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            slug: 1,
            description: 1,
            category: 1,
            pricing: 1,
            media: 1,
            stats: 1,
            createdAt: 1,
            seller: {
              store: "$seller.store",
            },
          },
        },
      ])
      .toArray();

    // If no products found, fallback to any active products sorted by recency
    if (products.length === 0) {
      const fallbackProducts = await db
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
            $sort: { createdAt: -1 },
          },
          {
            $limit: limit,
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
            $unwind: { path: "$seller", preserveNullAndEmptyArrays: true },
          },
          {
            $project: {
              _id: 1,
              title: 1,
              slug: 1,
              description: 1,
              category: 1,
              pricing: 1,
              media: 1,
              stats: 1,
              createdAt: 1,
              seller: {
                store: "$seller.store",
              },
            },
          },
        ])
        .toArray();

      return NextResponse.json({
        success: true,
        data: fallbackProducts,
        count: fallbackProducts.length,
        source: "fallback",
      });
    }

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
      source: "trending",
    });
  } catch (error) {
    console.error("Error fetching trending products:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        data: [],
        count: 0,
      },
      { status: 500 },
    );
  }
}
