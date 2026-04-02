import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/mongodb";
import { Seller } from "@/lib/database/schemas";
import {
  withSuperAdminAuth,
  type AuthenticatedRequest,
} from "@/lib/auth/middleware";


export const dynamic = "force-dynamic";
async function getSeller(request: AuthenticatedRequest) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    const seller = await Seller.findById(id)
      .populate("userId", "email profile phone auth")
      .lean();
    if (!seller) {
      return NextResponse.json(
        { success: false, error: "Seller not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: seller._id?.toString(),
        userId: seller.userId,
        store: seller.store,
        tier: seller.tier,
        feeRate: seller.feeRate,
        kycStatus: seller.kycStatus,
        kycDocs: seller.kycDocs,
        verifiedAt: seller.verifiedAt,
        stats: seller.stats,
        wallet: seller.wallet,
        payoutMethods: seller.payoutMethods,
        policies: seller.policies,
        shippingZones: seller.shippingZones,
        businessHours: seller.businessHours,
        onboardingStep: seller.onboardingStep,
        suspendedAt: seller.suspendedAt,
        suspendReason: seller.suspendReason,
        createdAt: seller.createdAt,
        updatedAt: seller.updatedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

async function updateSeller(request: AuthenticatedRequest) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();
    const body = await request.json();

    const { _id, ...updateData } = body;

    const seller = await Seller.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).lean();

    if (!seller) {
      return NextResponse.json(
        { success: false, error: "Seller not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: seller._id?.toString(), store: seller.store },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export const GET = withSuperAdminAuth(getSeller);
export const PUT = withSuperAdminAuth(updateSeller);
