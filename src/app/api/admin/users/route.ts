import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/mongodb";
import { User } from "@/lib/database/schemas";
import {
  withSuperAdminAuth,
  type AuthenticatedRequest,
} from "@/lib/auth/middleware";


export const dynamic = "force-dynamic";
async function getUsers(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const search = url.searchParams.get("search") || "";
    const role = url.searchParams.get("role") || "";
    const status = url.searchParams.get("status") || "";
    const sort = url.searchParams.get("sort") || "createdAt";
    const order = url.searchParams.get("order") || "desc";

    const query: any = {};

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { "profile.displayName": { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status === "deleted") {
      query.deletedAt = { $ne: null };
    } else if (status === "active") {
      query.deletedAt = null;
    }

    const skip = (page - 1) * limit;
    const sortObj: any = { [sort]: order === "desc" ? -1 : 1 };

    const [users, total] = await Promise.all([
      User.find(query).sort(sortObj).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users: users.map((u) => ({
          id: u._id?.toString(),
          email: u.email,
          name: u.name,
          phone: u.phone,
          role: u.role,
          profile: u.profile,
          reputation: u.reputation,
          wallet: u.wallet,
          auth: u.auth,
          kycStatus: u.kycStatus,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          deletedAt: u.deletedAt,
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

export const GET = withSuperAdminAuth(getUsers);
