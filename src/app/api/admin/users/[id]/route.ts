import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/mongodb";
import { User } from "@/lib/database/schemas";
import {
  withSuperAdminAuth,
  type AuthenticatedRequest,
} from "@/lib/auth/middleware";


export const dynamic = "force-dynamic";
async function getUser(request: AuthenticatedRequest) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();
    const user = await User.findById(id).lean();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({
      success: true,
      data: {
        id: user._id?.toString(),
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile: user.profile,
        reputation: user.reputation,
        wallet: user.wallet,
        auth: user.auth,
        preferences: user.preferences,
        kycStatus: user.kycStatus,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deletedAt: user.deletedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

async function updateUser(request: AuthenticatedRequest) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();
    const body = await request.json();

    const { passwordHash, _id, ...updateData } = body;

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user._id?.toString(),
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

async function deleteUser(request: AuthenticatedRequest) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();
    const user = await User.findByIdAndUpdate(
      id,
      { $set: { deletedAt: new Date() } },
      { new: true },
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, message: "User soft deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export const GET = withSuperAdminAuth(getUser);
export const PUT = withSuperAdminAuth(updateUser);
export const DELETE = withSuperAdminAuth(deleteUser);
