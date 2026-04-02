import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/mongodb";
import { Seller } from "@/lib/database/schemas";
import {
  withSuperAdminAuth,
  type AuthenticatedRequest,
} from "@/lib/auth/middleware";


export const dynamic = "force-dynamic";
async function updateSellerTier(request: AuthenticatedRequest) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const id = url.pathname.split("/").slice(-2, -1)[0];
    const body = await request.json();
    const { tier, feeRate } = body;

    const validTiers = ["standard", "silver", "gold", "pro"];
    if (!validTiers.includes(tier)) {
      return NextResponse.json(
        { success: false, error: "Invalid tier" },
        { status: 400 },
      );
    }

    const updateOps: any = { tier };
    if (feeRate !== undefined) {
      updateOps.feeRate = feeRate;
    }

    const seller = await Seller.findByIdAndUpdate(
      id,
      { $set: updateOps },
      { new: true },
    );

    if (!seller) {
      return NextResponse.json(
        { success: false, error: "Seller not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Seller tier updated to ${tier}`,
      data: {
        id: seller._id?.toString(),
        tier: seller.tier,
        feeRate: seller.feeRate,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export const PUT = withSuperAdminAuth(updateSellerTier);
