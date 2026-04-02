import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/mongodb";
import { Seller, User } from "@/lib/database/schemas";
import {
  withSuperAdminAuth,
  type AuthenticatedRequest,
} from "@/lib/auth/middleware";


export const dynamic = "force-dynamic";
async function getSellers(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const search = url.searchParams.get("search") || "";
    const tier = url.searchParams.get("tier") || "";
    const kycStatus = url.searchParams.get("kycStatus") || "";
    const sort = url.searchParams.get("sort") || "createdAt";
    const order = url.searchParams.get("order") || "desc";

    const query: any = {};

    if (search) {
      query["store.name"] = { $regex: search, $options: "i" };
    }

    if (tier) {
      query.tier = tier;
    }

    if (kycStatus) {
      query.kycStatus = kycStatus;
    }

    const skip = (page - 1) * limit;
    const sortObj: any = { [sort]: order === "desc" ? -1 : 1 };

    const [sellers, total] = await Promise.all([
      Seller.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate("userId", "email profile phone")
        .lean(),
      Seller.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        sellers: sellers.map((s) => ({
          id: s._id?.toString(),
          userId: s.userId?._id?.toString() || s.userId?.toString(),
          store: s.store,
          tier: s.tier,
          feeRate: s.feeRate,
          kycStatus: s.kycStatus,
          stats: s.stats,
          wallet: s.wallet,
          suspendedAt: s.suspendedAt,
          createdAt: s.createdAt,
          user:
            s.userId && typeof s.userId === "object"
              ? {
                  email: (s.userId as any).email,
                  profile: (s.userId as any).profile,
                  phone: (s.userId as any).phone,
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

export const GET = withSuperAdminAuth(getSellers);
