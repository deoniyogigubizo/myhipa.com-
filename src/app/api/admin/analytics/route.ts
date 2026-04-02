import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/mongodb";
import {
  Order,
  Transaction,
  User,
  Seller,
  Product,
} from "@/lib/database/schemas";
import {
  withSuperAdminAuth,
  type AuthenticatedRequest,
} from "@/lib/auth/middleware";

async function getAnalytics(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "30d";

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Order analytics
    const orderStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$pricing.total" },
        },
      },
    ]);

    // Revenue by day
    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          status: { $in: ["completed", "dispute_window"] },
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$pricing.total" },
          orders: { $sum: 1 },
          commission: { $sum: "$pricing.hipaFee" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // User growth
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: startDate }, deletedAt: null } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          newUsers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Category breakdown
    const categoryBreakdown = await Product.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: "$category.primary", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Top products by views
    const topProducts = await Product.find({ status: "active" })
      .sort({ "stats.views": -1 })
      .limit(10)
      .select("title slug stats pricing")
      .lean();

    // Conversion funnel
    const totalProducts = await Product.countDocuments({ status: "active" });
    const totalOrders = await Order.countDocuments({
      createdAt: { $gte: startDate },
    });
    const completedOrders = await Order.countDocuments({
      status: { $in: ["completed", "dispute_window"] },
      createdAt: { $gte: startDate },
    });

    return NextResponse.json({
      success: true,
      data: {
        period,
        orderStats,
        dailyRevenue: dailyRevenue.map((d) => ({
          date: d._id,
          revenue: d.revenue,
          orders: d.orders,
          commission: d.commission,
        })),
        userGrowth: userGrowth.map((d) => ({
          date: d._id,
          newUsers: d.newUsers,
        })),
        categoryBreakdown: categoryBreakdown.map((c) => ({
          category: c._id,
          productCount: c.count,
        })),
        topProducts: topProducts.map((p) => ({
          id: p._id?.toString(),
          title: p.title,
          views: p.stats?.views || 0,
          purchased: p.stats?.purchased || 0,
          price: p.pricing?.base || 0,
        })),
        funnel: {
          activeProducts: totalProducts,
          totalOrders,
          completedOrders,
          conversionRate:
            totalOrders > 0
              ? ((completedOrders / totalOrders) * 100).toFixed(1)
              : "0",
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

export const GET = withSuperAdminAuth(getAnalytics);
