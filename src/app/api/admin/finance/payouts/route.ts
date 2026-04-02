import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/mongodb";
import { Seller } from "@/lib/database/schemas";
import {
  withSuperAdminAuth,
  type AuthenticatedRequest,
} from "@/lib/auth/middleware";


export const dynamic = "force-dynamic";
async function getPayouts(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    const skip = (page - 1) * limit;

    const [sellers, total] = await Promise.all([
      Seller.find({ "wallet.pending": { $gt: 0 } })
        .sort({ "wallet.pending": -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "email profile")
        .lean(),
      Seller.countDocuments({ "wallet.pending": { $gt: 0 } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        payouts: sellers.map((s) => ({
          id: s._id?.toString(),
          storeName: s.store?.name,
          pending: s.wallet?.pending || 0,
          available: s.wallet?.available || 0,
          payoutMethods: s.payoutMethods,
          user:
            s.userId && typeof s.userId === "object"
              ? {
                  email: (s.userId as any).email,
                }
              : null,
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

export const GET = withSuperAdminAuth(getPayouts);
