import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { UserRole, canPerformAction } from "./permissions";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

/**
 * Verify JWT token and extract user data
 */
export function verifyToken(
  token: string,
): { userId: string; email: string; role: UserRole } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: UserRole;
    };
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from request headers or cookies
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  // Also check cookies
  const cookieToken = request.cookies.get("hipa_token");
  if (cookieToken) {
    return cookieToken.value;
  }
  return null;
}

/**
 * Middleware to authenticate requests
 */
export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
) {
  return async (request: NextRequest) => {
    const token = extractToken(request);

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    // Add user to request
    (request as AuthenticatedRequest).user = user;

    return handler(request as AuthenticatedRequest);
  };
}

/**
 * Middleware to authorize specific roles
 */
export function withRole(
  allowedRoles: UserRole[],
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
) {
  return withAuth(async (request: AuthenticatedRequest) => {
    const user = request.user!;

    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    return handler(request);
  });
}

/**
 * Middleware to check if user can perform a specific action
 */
export function withPermission(
  permission: string,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
) {
  return withAuth(async (request: AuthenticatedRequest) => {
    const user = request.user!;

    if (!canPerformAction(user.role, permission as any)) {
      return NextResponse.json(
        { error: "You do not have permission to perform this action" },
        { status: 403 },
      );
    }

    return handler(request);
  });
}

/**
 * Middleware to check if user is a seller
 */
export function withSellerAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
) {
  return withRole(["seller", "both", "admin", "super_admin"], handler);
}

/**
 * Middleware to check if user is a buyer
 */
export function withBuyerAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
) {
  return withRole(["buyer", "seller", "both", "admin", "super_admin"], handler);
}

/**
 * Middleware to check if user is an admin
 */
export function withAdminAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
) {
  return withRole(["admin", "super_admin"], handler);
}

/**
 * Middleware to check if user is a super admin (CEO/Owner)
 */
export function withSuperAdminAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
) {
  return withRole(["super_admin"], handler);
}

/**
 * Client-side hook to check permissions
 */
export function usePermissions(role: UserRole | undefined) {
  if (!role) {
    return {
      canBuy: false,
      canSell: false,
      canManageStore: false,
      canAccessSellerDashboard: false,
      canCreateProducts: false,
      canEditProducts: false,
      canDeleteProducts: false,
      canViewOrders: false,
      canManageOrders: false,
      canViewAnalytics: false,
      canManagePayouts: false,
      canAccessAdminPanel: false,
      canManageUsers: false,
      canModerateContent: false,
      canAccessSuperAdminPanel: false,
      canManageAdmins: false,
      canManageRoles: false,
      canManagePlatformSettings: false,
      canViewFinancialReports: false,
      canManageCommissions: false,
      canApprovePayouts: false,
      canManageSellers: false,
      canApproveSellers: false,
      canViewAuditLogs: false,
      canManageSystemSettings: false,
      canImpersonateUsers: false,
      canManageDisputes: false,
      canManageEscrow: false,
      canManageShipping: false,
      canManageMarketing: false,
      canExportData: false,
      canManageSecurity: false,
    };
  }

  return {
    canBuy: canPerformAction(role, "canBuy"),
    canSell: canPerformAction(role, "canSell"),
    canManageStore: canPerformAction(role, "canManageStore"),
    canAccessSellerDashboard: canPerformAction(
      role,
      "canAccessSellerDashboard",
    ),
    canCreateProducts: canPerformAction(role, "canCreateProducts"),
    canEditProducts: canPerformAction(role, "canEditProducts"),
    canDeleteProducts: canPerformAction(role, "canDeleteProducts"),
    canViewOrders: canPerformAction(role, "canViewOrders"),
    canManageOrders: canPerformAction(role, "canManageOrders"),
    canViewAnalytics: canPerformAction(role, "canViewAnalytics"),
    canManagePayouts: canPerformAction(role, "canManagePayouts"),
    canAccessAdminPanel: canPerformAction(role, "canAccessAdminPanel"),
    canManageUsers: canPerformAction(role, "canManageUsers"),
    canModerateContent: canPerformAction(role, "canModerateContent"),
    canAccessSuperAdminPanel: canPerformAction(
      role,
      "canAccessSuperAdminPanel",
    ),
    canManageAdmins: canPerformAction(role, "canManageAdmins"),
    canManageRoles: canPerformAction(role, "canManageRoles"),
    canManagePlatformSettings: canPerformAction(
      role,
      "canManagePlatformSettings",
    ),
    canViewFinancialReports: canPerformAction(role, "canViewFinancialReports"),
    canManageCommissions: canPerformAction(role, "canManageCommissions"),
    canApprovePayouts: canPerformAction(role, "canApprovePayouts"),
    canManageSellers: canPerformAction(role, "canManageSellers"),
    canApproveSellers: canPerformAction(role, "canApproveSellers"),
    canViewAuditLogs: canPerformAction(role, "canViewAuditLogs"),
    canManageSystemSettings: canPerformAction(role, "canManageSystemSettings"),
    canImpersonateUsers: canPerformAction(role, "canImpersonateUsers"),
    canManageDisputes: canPerformAction(role, "canManageDisputes"),
    canManageEscrow: canPerformAction(role, "canManageEscrow"),
    canManageShipping: canPerformAction(role, "canManageShipping"),
    canManageMarketing: canPerformAction(role, "canManageMarketing"),
    canExportData: canPerformAction(role, "canExportData"),
    canManageSecurity: canPerformAction(role, "canManageSecurity"),
  };
}
