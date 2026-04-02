import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/database/mongodb";
import { User } from "@/lib/database/schemas";
import {
  withSuperAdminAuth,
  type AuthenticatedRequest,
} from "@/lib/auth/middleware";


export const dynamic = "force-dynamic";
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

async function impersonateUser(request: AuthenticatedRequest) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const id = url.pathname.split("/").slice(-2, -1)[0];

    const user = await User.findById(id).lean();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Generate a token for the impersonated user
    const impersonationToken = jwt.sign(
      {
        userId: user._id?.toString(),
        email: user.email,
        role: user.role,
        impersonatedBy: request.user!.userId,
      },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    return NextResponse.json({
      success: true,
      message: `Impersonation token generated for ${user.email}`,
      data: {
        token: impersonationToken,
        user: {
          id: user._id?.toString(),
          email: user.email,
          displayName: user.profile?.displayName,
          role: user.role,
        },
        expiresIn: "1h",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export const POST = withSuperAdminAuth(impersonateUser);
