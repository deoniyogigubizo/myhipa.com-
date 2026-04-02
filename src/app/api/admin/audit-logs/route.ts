import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/mongodb";
import { AuditLog } from "@/lib/database/schemas";
import {
  withSuperAdminAuth,
  type AuthenticatedRequest,
} from "@/lib/auth/middleware";

async function getAuditLogs(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const action = url.searchParams.get("action") || "";
    const entity = url.searchParams.get("entity") || "";
    const userId = url.searchParams.get("userId") || "";

    const query: any = {};

    if (action) {
      query.action = { $regex: action, $options: "i" };
    }

    if (entity) {
      query.entity = entity;
    }

    if (userId) {
      query["actor.userId"] = userId;
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        logs: logs.map((l) => ({
          id: l._id?.toString(),
          actor: l.actor,
          action: l.action,
          entity: l.entity,
          changes: l.changes,
          metadata: l.metadata,
          createdAt: l.createdAt,
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

export const GET = withSuperAdminAuth(getAuditLogs);
