import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/mongodb";
import { User } from "@/lib/database/schemas";
import {
  withSuperAdminAuth,
  type AuthenticatedRequest,
} from "@/lib/auth/middleware";


export const dynamic = "force-dynamic";
async function suspendUser(request: AuthenticatedRequest) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const id = url.pathname.split("/").slice(-2, -1)[0];
    const body = await request.json();
    const { reason, suspended } = body;

    const updateOps: any = {};
    if (suspended) {
      updateOps.deletedAt = new Date();
      updateOps["suspendReason"] = reason || "Suspended by super admin";
    } else {
      updateOps.deletedAt = null;
      updateOps["suspendReason"] = null;
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateOps },
      { new: true },
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: suspended ? "User suspended" : "User reactivated",
      data: { id: user._id?.toString(), email: user.email },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export const POST = withSuperAdminAuth(suspendUser);
