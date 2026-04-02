import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/mongodb";
import { Product } from "@/lib/database/schemas";
import {
  withSuperAdminAuth,
  type AuthenticatedRequest,
} from "@/lib/auth/middleware";

async function getProducts(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    const category = url.searchParams.get("category") || "";
    const sellerId = url.searchParams.get("sellerId") || "";
    const sort = url.searchParams.get("sort") || "createdAt";
    const order = url.searchParams.get("order") || "desc";

    const query: any = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (category) {
      query["category.primary"] = category;
    }

    if (sellerId) {
      query.sellerId = sellerId;
    }

    const skip = (page - 1) * limit;
    const sortObj: any = { [sort]: order === "desc" ? -1 : 1 };

    const [products, total] = await Promise.all([
      Product.find(query).sort(sortObj).skip(skip).limit(limit).lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        products: products.map((p) => ({
          id: p._id?.toString(),
          sellerId: p.sellerId?.toString(),
          title: p.title,
          slug: p.slug,
          category: p.category,
          pricing: p.pricing,
          inventory: p.inventory,
          status: p.status,
          condition: p.condition,
          stats: p.stats,
          tags: p.tags,
          createdAt: p.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: skip + limit < total,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export const GET = withSuperAdminAuth(getProducts);
