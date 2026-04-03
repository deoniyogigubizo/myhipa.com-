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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { searchParams } = new URL(request.url);
    const { slug } = await params;

    const db = await getDb();

    // Fetch product by slug
    const product = await db.collection("products").findOne({ slug });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    }

    // Fetch seller information
    const seller = await db.collection("sellers").findOne(
      { _id: product.sellerId },
      {
        projection: { store: 1, tier: 1, stats: 1, kycStatus: 1, userId: 1 },
      },
    );

    // Fetch reviews for this product
    const reviews = await db
      .collection("reviews")
      .find({ productId: product._id.toString() })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // Fetch questions for this product
    const questions = await db
      .collection("questions")
      .find({ productId: product._id.toString() })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // Fetch related products (same category, different product)
    const relatedProducts = await db
      .collection("products")
      .find({
        "category.primary": product.category?.primary,
        _id: { $ne: product._id },
        status: "active",
      })
      .limit(5)
      .toArray();

    // Format the response
    const formattedProduct = {
      _id: product._id,
      title: product.title,
      slug: product.slug,
      description: product.description,
      media: product.media || [],
      pricing: product.pricing || { base: 0, currency: "RWF" },
      inventory: product.inventory || { totalStock: 0 },
      stats: product.stats || { avgRating: 0, reviewCount: 0 },
      condition: product.condition,
      category: product.category,
      tags: product.tags || [],
      sellerId: product.sellerId,
      seller: seller
        ? {
            _id: seller._id,
            userId: seller.userId,
            name: seller.store?.name || "Unknown Seller",
            slug: seller.store?.slug || "unknown",
            logo: seller.store?.logo || "",
            banner: seller.store?.banner || "",
            tier: seller.tier || "standard",
            kycStatus: seller.kycStatus || "pending",
            stats: seller.stats || { avgRating: 0, totalOrders: 0 },
          }
        : null,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    const formattedReviews = reviews.map((r) => ({
      _id: r._id,
      rating: r.rating,
      title: r.title || "",
      comment: r.comment || "",
      reviewerName: r.reviewerName || "Anonymous",
      reviewerAvatar:
        r.reviewerAvatar ||
        `https://i.pravatar.cc/40?img=${Math.floor(Math.random() * 70)}`,
      createdAt: r.createdAt,
      sellerResponse: r.sellerResponse || null,
      helpful: r.helpful || 0,
    }));

    const formattedQuestions = questions.map((q) => ({
      _id: q._id,
      question: q.question || "",
      answer: q.answer || null,
      userName: q.userName || "Anonymous",
      createdAt: q.createdAt,
      helpful: q.helpful || 0,
    }));

    const formattedRelatedProducts = relatedProducts.map((p) => ({
      _id: p._id,
      title: p.title,
      slug: p.slug,
      media: p.media || [],
      pricing: p.pricing || { base: 0 },
      stats: p.stats || { avgRating: 0, reviewCount: 0 },
    }));

    return NextResponse.json({
      success: true,
      data: {
        product: formattedProduct,
        reviews: formattedReviews,
        questions: formattedQuestions,
        relatedProducts: formattedRelatedProducts,
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
      { status: 500 },
    );
  }
}
