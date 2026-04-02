import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/mongodb";
import { Seller } from "@/lib/database/schemas";
import {
  withSuperAdminAuth,
  type AuthenticatedRequest,
} from "@/lib/auth/middleware";

async function approveSeller(request: AuthenticatedRequest) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const id = url.pathname.split("/").slice(-2, -1)[0];
    const body = await request.json();
    const { approved, reason } = body;

    const updateOps: any = {};
    if (approved) {
      updateOps.kycStatus = "verified";
      updateOps.verifiedAt = new Date();
      updateOps.suspendedAt = null;
      updateOps.suspendReason = null;
    } else {
      updateOps.kycStatus = "rejected";
      updateOps.suspendReason = reason || "KYC verification failed";
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
      message: approved ? "Seller approved and verified" : "Seller rejected",
      data: { id: seller._id?.toString(), kycStatus: seller.kycStatus },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export const POST = withSuperAdminAuth(approveSeller);
