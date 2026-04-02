import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/mongodb";
import { Transaction } from "@/lib/database/schemas";
import {
  withSuperAdminAuth,
  type AuthenticatedRequest,
} from "@/lib/auth/middleware";


export const dynamic = "force-dynamic";
async function getDisputes(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    const query = { "dispute.raised": true };

    const skip = (page - 1) * limit;

    const [disputes, total] = await Promise.all([
      Transaction.find(query)
        .sort({ "dispute.raisedAt": -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        disputes: disputes.map((d) => ({
          id: d._id?.toString(),
          orderId: d.orderId?.toString(),
          buyerId: d.buyerId?.toString(),
          sellerId: d.sellerId?.toString(),
          amount: d.amount,
          dispute: d.dispute,
          createdAt: d.createdAt,
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

export const GET = withSuperAdminAuth(getDisputes);
