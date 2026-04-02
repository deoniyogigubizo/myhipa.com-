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
    const query = searchParams.get("q") || searchParams.get("query") || "";
    const category = searchParams.get("category");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const location = searchParams.get("location");
    const minRating = searchParams.get("minRating");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "24");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    const db = await getDb();

    // Build search query
    const searchQuery: Record<string, unknown> = {
      status: "active",
      $and: [
        {
          $or: [
            { "inventory.totalStock": { $gt: 0 } },
            { "inventory.totalStock": { $exists: false } },
            { inventory: { $exists: false } },
          ],
        },
      ],
    };

    // Map URL-safe category slugs to actual category names
    const categoryMap: Record<string, string> = {
      "fresh-produce": "Fresh Produce",
      "grocery-gourmet-food": "Grocery & Gourmet Food",
      "meat-poultry": "Meat & Poultry",
      "frozen-foods": "Frozen Foods",
      "breads-snacks": "Breads & Snacks",
      "health-household": "Health & Household",
      "home-kitchen": "Home & Kitchen",
      "electronics-office": "Electronics & Office",
      "clothing-jewelry": "Clothing & Jewelry",
      "bags-travel": "Bags & Travel",
      "arts-gifts": "Arts & Gifts",
      "services-special-deals": "Services & Special Deals",
    };

    // Convert category slug to actual category name
    let categoryFilter = category;
    if (category && categoryMap[category]) {
      categoryFilter = categoryMap[category];
    }

    // Text search on title, description, and tags
    if (query) {
      (searchQuery.$and as Record<string, unknown>[]).push({
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { tags: { $regex: query, $options: "i" } },
        ],
      });
    }

    // Apply category filter - can be exact match or partial (for subcategories)
    // Use AND logic for category so it works with text search
    if (categoryFilter) {
      searchQuery["category.primary"] = {
        $regex: categoryFilter,
        $options: "i",
      };
    }

    if (minPrice) {
      searchQuery["pricing.base"] = { $gte: parseFloat(minPrice) };
    }

    if (maxPrice) {
      searchQuery["pricing.base"] = {
        ...(searchQuery["pricing.base"] as object),
        $lte: parseFloat(maxPrice),
      };
    }

    if (minRating) {
      searchQuery["stats.avgRating"] = { $gte: parseFloat(minRating) };
    }

    // Get total count for pagination
    const total = await db.collection("products").countDocuments(searchQuery);

    // Build sort object
    const sortObj: Record<string, 1 | -1> = {};
    sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Fetch products with seller info
    const products = await db
      .collection("products")
      .aggregate([
        { $match: searchQuery },
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
            inventory: 1,
            tags: 1,
            condition: 1,
            stats: 1,
            createdAt: 1,
            seller: {
              _id: "$seller._id",
              storeName: "$seller.store.storeName",
              storeSlug: "$seller.store.slug",
              location: "$seller.store.location",
              tier: "$seller.tier",
              kycStatus: "$seller.kycStatus",
            },
          },
        },
        { $sort: sortObj },
        { $skip: skip },
        { $limit: limit },
      ])
      .toArray();

    // Get unique categories for filter sidebar
    const categories = await db
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
        { $group: { _id: "$category.primary" } },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
      filters: {
        query,
        category,
        minPrice,
        maxPrice,
        minRating,
        location,
      },
      availableCategories: categories.map((c) => c._id).filter(Boolean),
    });
  } catch (error) {
    console.error("Error searching products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search products" },
      { status: 500 },
    );
  }
}
