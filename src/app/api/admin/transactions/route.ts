import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/mongodb";
import { Transaction } from "@/lib/database/schemas";
import {
  withSuperAdminAuth,
  type AuthenticatedRequest,
} from "@/lib/auth/middleware";


export const dynamic = "force-dynamic";
async function getTransactions(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const escrowStatus = url.searchParams.get("escrowStatus") || "";
    const sort = url.searchParams.get("sort") || "createdAt";
    const order = url.searchParams.get("order") || "desc";

    const query: any = {};

    if (escrowStatus) {
      query["escrow.status"] = escrowStatus;
    }

    const skip = (page - 1) * limit;
    const sortObj: any = { [sort]: order === "desc" ? -1 : 1 };

    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort(sortObj).skip(skip).limit(limit).lean(),
      Transaction.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        transactions: transactions.map((t) => ({
          id: t._id?.toString(),
          orderId: t.orderId?.toString(),
          buyerId: t.buyerId?.toString(),
          sellerId: t.sellerId?.toString(),
          amount: t.amount,
          hipaFee: t.hipaFee,
          sellerPayout: t.sellerPayout,
          currency: t.currency,
          escrow: t.escrow,
          dispute: t.dispute,
          payoutBatch: t.payoutBatch,
          chargebackRisk: t.chargebackRisk,
          createdAt: t.createdAt,
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

export const GET = withSuperAdminAuth(getTransactions);
