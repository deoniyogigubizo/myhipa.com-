/**
 * Role-Based Permission System
 *
 * Defines what actions each user role can perform on the platform.
 *
 * ROLES:
 * - buyer: Can only buy products
 * - seller: Can buy AND sell products
 * - both: Can buy AND sell products (legacy role, same as seller)
 * - admin: Full access to everything
 * - super_admin: CEO/Owner god-mode access with dedicated super admin panel
 */

export type UserRole = "buyer" | "seller" | "both" | "admin" | "super_admin";

export interface Permission {
  canBuy: boolean;
  canSell: boolean;
  canManageStore: boolean;
  canAccessSellerDashboard: boolean;
  canCreateProducts: boolean;
  canEditProducts: boolean;
  canDeleteProducts: boolean;
  canViewOrders: boolean;
  canManageOrders: boolean;
  canViewAnalytics: boolean;
  canManagePayouts: boolean;
  canAccessAdminPanel: boolean;
  canManageUsers: boolean;
  canModerateContent: boolean;
  // Super Admin Permissions
  canAccessSuperAdminPanel: boolean;
  canManageAdmins: boolean;
  canManageRoles: boolean;
  canManagePlatformSettings: boolean;
  canViewFinancialReports: boolean;
  canManageCommissions: boolean;
  canApprovePayouts: boolean;
  canManageSellers: boolean;
  canApproveSellers: boolean;
  canViewAuditLogs: boolean;
  canManageSystemSettings: boolean;
  canImpersonateUsers: boolean;
  canManageDisputes: boolean;
  canManageEscrow: boolean;
  canManageShipping: boolean;
  canManageMarketing: boolean;
  canExportData: boolean;
  canManageSecurity: boolean;
}

/**
 * Get permissions for a given user role
 */
export function getPermissions(role: UserRole): Permission {
  const basePermissions: Permission = {
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

  switch (role) {
    case "buyer":
      return {
        ...basePermissions,
        canBuy: true,
        canViewOrders: true,
      };

    case "seller":
    case "both":
      return {
        ...basePermissions,
        canBuy: true,
        canSell: true,
        canManageStore: true,
        canAccessSellerDashboard: true,
        canCreateProducts: true,
        canEditProducts: true,
        canDeleteProducts: true,
        canViewOrders: true,
        canManageOrders: true,
        canViewAnalytics: true,
        canManagePayouts: true,
      };

    case "admin":
      return {
        ...basePermissions,
        canBuy: true,
        canSell: true,
        canManageStore: true,
        canAccessSellerDashboard: true,
        canCreateProducts: true,
        canEditProducts: true,
        canDeleteProducts: true,
        canViewOrders: true,
        canManageOrders: true,
        canViewAnalytics: true,
        canManagePayouts: true,
        canAccessAdminPanel: true,
        canManageUsers: true,
        canModerateContent: true,
      };

    case "super_admin":
      return {
        canBuy: true,
        canSell: true,
        canManageStore: true,
        canAccessSellerDashboard: true,
        canCreateProducts: true,
        canEditProducts: true,
        canDeleteProducts: true,
        canViewOrders: true,
        canManageOrders: true,
        canViewAnalytics: true,
        canManagePayouts: true,
        canAccessAdminPanel: true,
        canManageUsers: true,
        canModerateContent: true,
        canAccessSuperAdminPanel: true,
        canManageAdmins: true,
        canManageRoles: true,
        canManagePlatformSettings: true,
        canViewFinancialReports: true,
        canManageCommissions: true,
        canApprovePayouts: true,
        canManageSellers: true,
        canApproveSellers: true,
        canViewAuditLogs: true,
        canManageSystemSettings: true,
        canImpersonateUsers: true,
        canManageDisputes: true,
        canManageEscrow: true,
        canManageShipping: true,
        canManageMarketing: true,
        canExportData: true,
        canManageSecurity: true,
      };

    default:
      return basePermissions;
  }
}

/**
 * Check if a user can perform a specific action
 */
export function canPerformAction(
  role: UserRole,
  action: keyof Permission,
): boolean {
  const permissions = getPermissions(role);
  return permissions[action];
}

/**
 * Check if a user can buy products
 */
export function canBuy(role: UserRole): boolean {
  return canPerformAction(role, "canBuy");
}

/**
 * Check if a user can sell products
 */
export function canSell(role: UserRole): boolean {
  return canPerformAction(role, "canSell");
}

/**
 * Check if a user can access the seller dashboard
 */
export function canAccessSellerDashboard(role: UserRole): boolean {
  return canPerformAction(role, "canAccessSellerDashboard");
}

/**
 * Check if a user can create products
 */
export function canCreateProducts(role: UserRole): boolean {
  return canPerformAction(role, "canCreateProducts");
}

/**
 * Check if a user can manage orders
 */
export function canManageOrders(role: UserRole): boolean {
  return canPerformAction(role, "canManageOrders");
}

/**
 * Check if a user can manage payouts
 */
export function canManagePayouts(role: UserRole): boolean {
  return canPerformAction(role, "canManagePayouts");
}

/**
 * Check if a user is a seller (can sell products)
 */
export function isSeller(role: UserRole): boolean {
  return (
    role === "seller" ||
    role === "both" ||
    role === "admin" ||
    role === "super_admin"
  );
}

/**
 * Check if a user is a buyer (can buy products)
 */
export function isBuyer(role: UserRole): boolean {
  return (
    role === "buyer" ||
    role === "seller" ||
    role === "both" ||
    role === "admin" ||
    role === "super_admin"
  );
}

/**
 * Check if a user is an admin
 */
export function isAdmin(role: UserRole): boolean {
  return role === "admin" || role === "super_admin";
}

/**
 * Check if a user is a super admin
 */
export function isSuperAdmin(role: UserRole): boolean {
  return role === "super_admin";
}

/**
 * Check if a user can access the super admin panel
 */
export function canAccessSuperAdminPanel(role: UserRole): boolean {
  return canPerformAction(role, "canAccessSuperAdminPanel");
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case "buyer":
      return "Buyer";
    case "seller":
      return "Seller";
    case "both":
      return "Seller & Buyer";
    case "admin":
      return "Administrator";
    case "super_admin":
      return "Super Admin";
    default:
      return "Unknown";
  }
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  switch (role) {
    case "buyer":
      return "Can browse and purchase products from sellers";
    case "seller":
      return "Can buy products and sell their own products";
    case "both":
      return "Can buy products and sell their own products";
    case "admin":
      return "Full access to all platform features";
    case "super_admin":
      return "CEO/Owner with god-mode access to the entire platform ecosystem";
    default:
      return "";
  }
}

/**
 * Get role capabilities list
 */
export function getRoleCapabilities(role: UserRole): string[] {
  const capabilities: string[] = [];

  if (canBuy(role)) {
    capabilities.push("Browse and purchase products");
    capabilities.push("View order history");
    capabilities.push("Manage wishlist");
  }

  if (canSell(role)) {
    capabilities.push("Create and manage store");
    capabilities.push("List products for sale");
    capabilities.push("Manage orders");
    capabilities.push("View sales analytics");
    capabilities.push("Receive payouts");
  }

  if (isAdmin(role)) {
    capabilities.push("Access admin panel");
    capabilities.push("Manage users");
    capabilities.push("Moderate content");
    capabilities.push("View platform analytics");
  }

  if (isSuperAdmin(role)) {
    capabilities.push("Full super admin panel access");
    capabilities.push("Manage all admins and roles");
    capabilities.push("Platform settings and configuration");
    capabilities.push("Financial reports and commission management");
    capabilities.push("Seller approval and tier management");
    capabilities.push("Full audit log access");
    capabilities.push("User impersonation");
    capabilities.push("Dispute and escrow management");
    capabilities.push("System settings and security");
    capabilities.push("Data export and analytics");
  }

  return capabilities;
}
