import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/mongodb";
import { Seller } from "@/lib/database/schemas";
import {
  withSuperAdminAuth,
  type AuthenticatedRequest,
} from "@/lib/auth/middleware";

async function updateSellerCommission(request: AuthenticatedRequest) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const id = url.pathname.split("/").slice(-2, -1)[0];
    const body = await request.json();
    const { feeRate } = body;

    if (typeof feeRate !== "number" || feeRate < 0 || feeRate > 100) {
      return NextResponse.json(
        { success: false, error: "Invalid fee rate (0-100)" },
        { status: 400 },
      );
    }

    const seller = await Seller.findByIdAndUpdate(
      id,
      { $set: { feeRate } },
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
      message: `Commission rate updated to ${feeRate}%`,
      data: { id: seller._id?.toString(), feeRate: seller.feeRate },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export const PUT = withSuperAdminAuth(updateSellerCommission);
