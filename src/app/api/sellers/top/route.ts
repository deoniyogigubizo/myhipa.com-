import { NextResponse } from "next/server";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";
// MongoDB connection
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://deoniyogisubizo:maiden410@myhipa.qkj7r5a.mongodb.net/hipa";

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

// Get day of year (1-366) for deterministic daily rotation
function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const db = await getDb();
    const dayOfYear = getDayOfYear();

    // Get all sellers sorted by totalRevenue descending
    const allSellers = await db
      .collection("sellers")
      .aggregate([
        { $match: { kycStatus: "verified" } },
        {
          $project: {
            _id: 1,
            store: 1,
            tier: 1,
            stats: 1,
            createdAt: 1,
          },
        },
      ])
      .toArray();

    // Use day of year to rotate - different 10 sellers each day
    const shuffled = [...allSellers].sort((a, b) => {
      // Create a deterministic shuffle based on day of year
      const aScore =
        (a.stats?.totalRevenue || 0) + (a.stats?.avgRating || 0) * 1000;
      const bScore =
        (b.stats?.totalRevenue || 0) + (b.stats?.avgRating || 0) * 1000;

      // Add day-based rotation
      const aRotated = (aScore + dayOfYear * 7919) % 100000;
      const bRotated = (bScore + dayOfYear * 7919) % 100000;

      return bRotated - aRotated;
    });

    // Take top sellers after shuffle
    const topSellers = shuffled.slice(0, limit);

    // Format response
    const sellers = topSellers.map((seller) => ({
      _id: seller._id,
      name: seller.store?.name,
      storeSlug: seller.store?.slug,
      logo: seller.store?.logo,
      banner: seller.store?.banner,
      tier: seller.tier,
      stats: {
        avgRating: seller.stats?.avgRating || 0,
        totalRevenue: seller.stats?.totalRevenue || 0,
        totalOrders: seller.stats?.totalOrders || 0,
        reviewCount: seller.stats?.reviewCount || 0,
        productCount: seller.stats?.productCount || 0,
      },
      isVerified: seller.kycStatus === "verified",
    }));

    return NextResponse.json({
      success: true,
      data: sellers,
      count: sellers.length,
      dayOfYear, // Include for debugging
    });
  } catch (error) {
    console.error("Error fetching top sellers:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch top sellers" },
      { status: 500 },
    );
  }
}
