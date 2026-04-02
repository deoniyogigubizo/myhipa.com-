import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/database/mongodb";
import { Seller, Transaction, Order } from "@/lib/database/schemas";
import { withSellerAuth } from "@/lib/auth/middleware";

export const GET = withSellerAuth(async (request: NextRequest) => {
  try {
    await connectDB();

    const user = (request as any).user;
    // Convert userId string to ObjectId for proper MongoDB query
    const userId = new mongoose.Types.ObjectId(user.userId);
    const seller = await Seller.findOne({ userId });

    if (!seller) {
      return NextResponse.json(
        { error: "Seller profile not found" },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const query: any = { sellerId: seller._id };

    if (type && type !== "all") {
      query.type = type;
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Transaction.countDocuments(query),
    ]);

    // Calculate balances
    const escrowBalance = await Order.aggregate([
      {
        $match: {
          sellerId: seller._id,
          status: { $in: ["seller_processing", "in_delivery"] },
        },
      },
      { $group: { _id: null, total: { $sum: "$pricing.sellerPayout" } } },
    ]);

    const releasingToday = await Order.aggregate([
      {
        $match: {
          sellerId: seller._id,
          status: "dispute_window",
          "statusHistory.at": {
            $lte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$pricing.sellerPayout" } } },
    ]);

    return NextResponse.json({
      wallet: {
        available: seller.wallet.available,
        pending: seller.wallet.pending,
        held: seller.wallet.held,
        currency: seller.wallet.currency,
        totalWithdrawn: seller.wallet.totalWithdrawn,
      },
      escrow: {
        balance: escrowBalance[0]?.total || 0,
        releasingToday: releasingToday[0]?.total || 0,
      },
      transactions: transactions.map((tx) => ({
        id: tx._id,
        type:
          tx.escrow?.status === "released" ? "escrow_release" : "transaction",
        amount: tx.amount,
        currency: tx.currency,
        description:
          tx.escrow?.status === "released" ? "Escrow released" : "Transaction",
        reference: tx.orderId?.toString(),
        status: tx.escrow?.status || "completed",
        createdAt: tx.createdAt,
      })),
      payoutMethods: seller.payoutMethods,
      feeRate: seller.feeRate,
      tier: seller.tier,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Seller finance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
