import { NextResponse } from "next/server";
import {
  withSuperAdminAuth,
  type AuthenticatedRequest,
} from "@/lib/auth/middleware";
import { getPermissions } from "@/lib/auth/permissions";

// In-memory roles store (in production, persist to DB)
const customRoles = [
  {
    id: "super_admin",
    name: "Super Admin",
    description: "CEO/Owner with god-mode access to the entire platform",
    isSystem: true,
    permissions: getPermissions("super_admin"),
    userCount: 0,
  },
  {
    id: "admin",
    name: "Administrator",
    description: "Full admin access to platform management",
    isSystem: true,
    permissions: getPermissions("admin"),
    userCount: 0,
  },
  {
    id: "finance_admin",
    name: "Finance Admin",
    description: "Manage finances, payouts, and commissions",
    isSystem: false,
    permissions: {
      canViewFinancialReports: true,
      canManageCommissions: true,
      canApprovePayouts: true,
      canViewOrders: true,
      canViewAnalytics: true,
      canExportData: true,
    },
    userCount: 0,
  },
  {
    id: "content_moderator",
    name: "Content Moderator",
    description: "Review and moderate products and content",
    isSystem: false,
    permissions: {
      canModerateContent: true,
      canViewOrders: true,
      canManageProducts: true,
    },
    userCount: 0,
  },
  {
    id: "support_agent",
    name: "Support Agent",
    description: "Handle customer support and disputes",
    isSystem: false,
    permissions: {
      canViewOrders: true,
      canManageDisputes: true,
      canManageUsers: true,
    },
    userCount: 0,
  },
];

async function getRoles(request: AuthenticatedRequest) {
  return NextResponse.json({
    success: true,
    data: { roles: customRoles },
  });
}

async function createRole(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { name, description, permissions } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Role name is required" },
        { status: 400 },
      );
    }

    const newRole = {
      id: name.toLowerCase().replace(/\s+/g, "_"),
      name,
      description: description || "",
      isSystem: false,
      permissions: permissions || {},
      userCount: 0,
    };

    customRoles.push(newRole);

    return NextResponse.json({
      success: true,
      data: newRole,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export const GET = withSuperAdminAuth(getRoles);
export const POST = withSuperAdminAuth(createRole);
