import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/mongodb";
import { Order, Transaction, Seller } from "@/lib/database/schemas";
import {
  withSuperAdminAuth,
  type AuthenticatedRequest,
} from "@/lib/auth/middleware";

async function getFinanceOverview(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Revenue breakdown
    const totalRevenueAgg = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          totalFees: { $sum: "$hipaFee" },
          totalGMV: { $sum: "$amount" },
          totalPayouts: { $sum: "$sellerPayout" },
        },
      },
    ]);
    const totalRevenue = totalRevenueAgg[0] || {
      totalFees: 0,
      totalGMV: 0,
      totalPayouts: 0,
    };

    const monthRevenueAgg = await Transaction.aggregate([
      { $match: { createdAt: { $gte: monthStart } } },
      {
        $group: {
          _id: null,
          totalFees: { $sum: "$hipaFee" },
          totalGMV: { $sum: "$amount" },
        },
      },
    ]);
    const monthRevenue = monthRevenueAgg[0] || { totalFees: 0, totalGMV: 0 };

    // Monthly revenue trend (last 12 months)
    const monthlyTrend = await Transaction.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          fees: { $sum: "$hipaFee" },
          gmv: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Escrow status
    const escrowStats = await Transaction.aggregate([
      {
        $group: {
          _id: "$escrow.status",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Pending payouts
    const pendingPayouts = await Seller.aggregate([
      {
        $group: {
          _id: null,
          totalPending: { $sum: "$wallet.pending" },
          totalAvailable: { $sum: "$wallet.available" },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        monthRevenue,
        monthlyTrend: monthlyTrend.map((m) => ({
          month: m._id,
          fees: m.fees,
          gmv: m.gmv,
          transactions: m.count,
        })),
        escrowStats,
        pendingPayouts: pendingPayouts[0] || {
          totalPending: 0,
          totalAvailable: 0,
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

export const GET = withSuperAdminAuth(getFinanceOverview);
