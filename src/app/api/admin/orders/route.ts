import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/mongodb";
import { Order } from "@/lib/database/schemas";
import {
  withSuperAdminAuth,
  type AuthenticatedRequest,
} from "@/lib/auth/middleware";


export const dynamic = "force-dynamic";
async function getOrders(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const status = url.searchParams.get("status") || "";
    const search = url.searchParams.get("search") || "";
    const sellerId = url.searchParams.get("sellerId") || "";
    const buyerId = url.searchParams.get("buyerId") || "";
    const sort = url.searchParams.get("sort") || "createdAt";
    const order = url.searchParams.get("order") || "desc";
    const minValue = url.searchParams.get("minValue");
    const maxValue = url.searchParams.get("maxValue");

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.orderNumber = { $regex: search, $options: "i" };
    }

    if (sellerId) {
      query.sellerId = sellerId;
    }

    if (buyerId) {
      query.buyerId = buyerId;
    }

    if (minValue || maxValue) {
      query["pricing.total"] = {};
      if (minValue) query["pricing.total"].$gte = parseFloat(minValue);
      if (maxValue) query["pricing.total"].$lte = parseFloat(maxValue);
    }

    const skip = (page - 1) * limit;
    const sortObj: any = { [sort]: order === "desc" ? -1 : 1 };

    const [orders, total] = await Promise.all([
      Order.find(query).sort(sortObj).skip(skip).limit(limit).lean(),
      Order.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        orders: orders.map((o) => ({
          id: o._id?.toString(),
          orderNumber: o.orderNumber,
          buyerId: o.buyerId?.toString(),
          sellerId: o.sellerId?.toString(),
          items: o.items,
          pricing: o.pricing,
          status: o.status,
          delivery: o.delivery,
          payment: o.payment,
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
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

export const GET = withSuperAdminAuth(getOrders);
