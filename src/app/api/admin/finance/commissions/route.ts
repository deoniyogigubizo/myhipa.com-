import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/mongodb";
import { Seller } from "@/lib/database/schemas";
import {
  withSuperAdminAuth,
  type AuthenticatedRequest,
} from "@/lib/auth/middleware";

async function getCommissions(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    // Get commission rate distribution
    const commissionStats = await Seller.aggregate([
      {
        $group: {
          _id: "$tier",
          avgFeeRate: { $avg: "$feeRate" },
          minFeeRate: { $min: "$feeRate" },
          maxFeeRate: { $max: "$feeRate" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        commissionStats,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

async function updateGlobalCommission(request: AuthenticatedRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { tier, feeRate } = body;

    if (!tier || typeof feeRate !== "number") {
      return NextResponse.json(
        { success: false, error: "Invalid parameters" },
        { status: 400 },
      );
    }

    // Update all sellers in the specified tier
    const result = await Seller.updateMany({ tier }, { $set: { feeRate } });

    return NextResponse.json({
      success: true,
      message: `Updated ${result.modifiedCount} sellers in ${tier} tier to ${feeRate}% commission`,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export const GET = withSuperAdminAuth(getCommissions);
export const PUT = withSuperAdminAuth(updateGlobalCommission);
