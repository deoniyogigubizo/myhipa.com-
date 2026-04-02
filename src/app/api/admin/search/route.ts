import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/mongodb";
import { User, Seller, Product, Order } from "@/lib/database/schemas";
import {
  withSuperAdminAuth,
  type AuthenticatedRequest,
} from "@/lib/auth/middleware";

async function globalSearch(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const url = new URL(request.url);
    const query = url.searchParams.get("q") || "";
    const type = url.searchParams.get("type") || "all";
    const limit = parseInt(url.searchParams.get("limit") || "10");

    if (!query || query.length < 2) {
      return NextResponse.json(
        { success: false, error: "Search query must be at least 2 characters" },
        { status: 400 },
      );
    }

    const results: any = {};

    if (type === "all" || type === "users") {
      results.users = await User.find({
        $or: [
          { email: { $regex: query, $options: "i" } },
          { "profile.displayName": { $regex: query, $options: "i" } },
        ],
        deletedAt: null,
      })
        .limit(limit)
        .select("email profile.displayName role")
        .lean();
    }

    if (type === "all" || type === "sellers") {
      results.sellers = await Seller.find({
        "store.name": { $regex: query, $options: "i" },
      })
        .limit(limit)
        .select("store.name store.slug tier kycStatus")
        .lean();
    }

    if (type === "all" || type === "products") {
      results.products = await Product.find({
        title: { $regex: query, $options: "i" },
      })
        .limit(limit)
        .select("title slug pricing.base status")
        .lean();
    }

    if (type === "all" || type === "orders") {
      results.orders = await Order.find({
        orderNumber: { $regex: query, $options: "i" },
      })
        .limit(limit)
        .select("orderNumber pricing.total status")
        .lean();
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export const GET = withSuperAdminAuth(globalSearch);
