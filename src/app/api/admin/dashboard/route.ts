import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/mongodb";
import {
  User,
  Seller,
  Order,
  Transaction,
  AuditLog,
} from "@/lib/database/schemas";
import {
  withSuperAdminAuth,
  type AuthenticatedRequest,
} from "@/lib/auth/middleware";

async function getDashboardStats(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // User stats
    const totalUsers = await User.countDocuments({ deletedAt: null });
    const totalBuyers = await User.countDocuments({
      role: { $in: ["buyer", "both"] },
      deletedAt: null,
    });
    const totalSellers = await Seller.countDocuments();
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: todayStart },
      deletedAt: null,
    });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: monthStart },
      deletedAt: null,
    });

    // Order stats
    const totalOrders = await Order.countDocuments();
    const ordersToday = await Order.countDocuments({
      createdAt: { $gte: todayStart },
    });
    const ordersThisMonth = await Order.countDocuments({
      createdAt: { $gte: monthStart },
    });
    const pendingOrders = await Order.countDocuments({
      status: { $in: ["pending_payment", "payment_held", "seller_processing"] },
    });
    const disputedOrders = await Order.countDocuments({ status: "disputed" });

    // Revenue / GMV
    const revenueAgg = await Order.aggregate([
      { $match: { status: { $in: ["completed", "dispute_window"] } } },
      { $group: { _id: null, total: { $sum: "$pricing.total" } } },
    ]);
    const totalGMV = revenueAgg[0]?.total || 0;

    const todayRevenueAgg = await Order.aggregate([
      {
        $match: {
          status: { $in: ["completed", "dispute_window"] },
          createdAt: { $gte: todayStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$pricing.total" } } },
    ]);
    const todayGMV = todayRevenueAgg[0]?.total || 0;

    const monthRevenueAgg = await Order.aggregate([
      {
        $match: {
          status: { $in: ["completed", "dispute_window"] },
          createdAt: { $gte: monthStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$pricing.total" } } },
    ]);
    const monthGMV = monthRevenueAgg[0]?.total || 0;

    const prevMonthRevenueAgg = await Order.aggregate([
      {
        $match: {
          status: { $in: ["completed", "dispute_window"] },
          createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd },
        },
      },
      { $group: { _id: null, total: { $sum: "$pricing.total" } } },
    ]);
    const prevMonthGMV = prevMonthRevenueAgg[0]?.total || 0;

    // Platform commission earned
    const commissionAgg = await Transaction.aggregate([
      { $group: { _id: null, total: { $sum: "$hipaFee" } } },
    ]);
    const totalCommission = commissionAgg[0]?.total || 0;

    const monthCommissionAgg = await Transaction.aggregate([
      { $match: { createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$hipaFee" } } },
    ]);
    const monthCommission = monthCommissionAgg[0]?.total || 0;

    // Escrow stats
    const escrowAgg = await Transaction.aggregate([
      { $match: { "escrow.status": "held" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const escrowHeld = escrowAgg[0]?.total || 0;

    // Seller tier distribution
    const sellerTiers = await Seller.aggregate([
      { $group: { _id: "$tier", count: { $sum: 1 } } },
    ]);

    // Pending approvals
    const pendingSellerApprovals = await Seller.countDocuments({
      kycStatus: "pending",
    });

    // Recent orders (last 10)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Revenue chart (last 30 days)
    const revenueChart = await Order.aggregate([
      {
        $match: {
          status: { $in: ["completed", "dispute_window"] },
          createdAt: {
            $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$pricing.total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top sellers by revenue
    const topSellers = await Order.aggregate([
      { $match: { status: { $in: ["completed", "dispute_window"] } } },
      {
        $group: {
          _id: "$sellerId",
          totalRevenue: { $sum: "$pricing.total" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "sellers",
          localField: "_id",
          foreignField: "_id",
          as: "seller",
        },
      },
      { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "seller.userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    ]);

    // Recent activity from audit logs
    const recentActivity = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // AOV
    const avgOrderValue = totalOrders > 0 ? totalGMV / totalOrders : 0;

    // GMV change %
    const gmvChange =
      prevMonthGMV > 0
        ? (((monthGMV - prevMonthGMV) / prevMonthGMV) * 100).toFixed(1)
        : "N/A";

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalGMV,
          todayGMV,
          monthGMV,
          gmvChange: `${Number(gmvChange) > 0 ? "+" : ""}${gmvChange}%`,
          totalCommission,
          monthCommission,
          totalOrders,
          ordersToday,
          ordersThisMonth,
          pendingOrders,
          disputedOrders,
          totalUsers,
          totalBuyers,
          totalSellers,
          newUsersToday,
          newUsersThisMonth,
          avgOrderValue: Math.round(avgOrderValue),
          escrowHeld,
          pendingSellerApprovals,
        },
        sellerTiers,
        revenueChart: revenueChart.map((d) => ({
          date: d._id,
          revenue: d.revenue,
          orders: d.orders,
        })),
        topSellers: topSellers.map((s) => ({
          id: s._id?.toString(),
          storeName: s.seller?.store?.name || "Unknown",
          totalRevenue: s.totalRevenue,
          orderCount: s.orderCount,
          tier: s.seller?.tier || "standard",
        })),
        recentOrders: recentOrders.map((o) => ({
          id: o._id?.toString(),
          orderNumber: o.orderNumber,
          total: o.pricing?.total || 0,
          status: o.status,
          createdAt: o.createdAt,
        })),
        recentActivity: recentActivity.map((a) => ({
          id: a._id?.toString(),
          action: a.action,
          entity: a.entity,
          actor: a.actor,
          createdAt: a.createdAt,
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export const GET = withSuperAdminAuth(getDashboardStats);
