import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/mongodb";
import { Transaction } from "@/lib/database/schemas";
import {
  withSuperAdminAuth,
  type AuthenticatedRequest,
} from "@/lib/auth/middleware";


export const dynamic = "force-dynamic";
async function resolveDispute(request: AuthenticatedRequest) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();
    const body = await request.json();
    const { resolution, buyerRefund, sellerReceived, reason } = body;

    const validResolutions = ["refund_buyer", "release_seller", "partial"];
    if (!validResolutions.includes(resolution)) {
      return NextResponse.json(
        { success: false, error: "Invalid resolution" },
        { status: 400 },
      );
    }

    const updateOps: any = {
      "dispute.resolution": resolution,
      "dispute.resolvedAt": new Date(),
      "dispute.adminId": request.user!.userId,
    };

    if (resolution === "refund_buyer") {
      updateOps["escrow.status"] = "refunded";
    } else if (resolution === "release_seller") {
      updateOps["escrow.status"] = "released";
      updateOps["escrow.releasedAt"] = new Date();
      updateOps["escrow.releaseType"] = "admin";
    } else if (resolution === "partial") {
      updateOps["escrow.status"] = "partial";
      updateOps["dispute.buyerRefund"] = buyerRefund;
      updateOps["dispute.sellerReceived"] = sellerReceived;
    }

    const transaction = await Transaction.findByIdAndUpdate(
      id,
      { $set: updateOps },
      { new: true },
    );

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Dispute resolved: ${resolution}`,
      data: { id: transaction._id?.toString(), resolution },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export const PUT = withSuperAdminAuth(resolveDispute);
