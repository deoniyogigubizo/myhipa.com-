import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/mongodb";
import { Order } from "@/lib/database/schemas";
import {
  withSuperAdminAuth,
  type AuthenticatedRequest,
} from "@/lib/auth/middleware";


export const dynamic = "force-dynamic";
async function getOrder(request: AuthenticatedRequest) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    const order = await Order.findById(id).lean();
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: order._id?.toString(),
        orderNumber: order.orderNumber,
        buyerId: order.buyerId?.toString(),
        sellerId: order.sellerId?.toString(),
        items: order.items,
        pricing: order.pricing,
        delivery: order.delivery,
        status: order.status,
        statusHistory: order.statusHistory,
        sellerShipDeadline: order.sellerShipDeadline,
        disputeWindowEnd: order.disputeWindowEnd,
        autoReleaseAt: order.autoReleaseAt,
        payment: order.payment,
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

async function updateOrder(request: AuthenticatedRequest) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();
    const body = await request.json();

    const order = await Order.findByIdAndUpdate(
      id,
      {
        $set: body,
        $push: { statusHistory: { status: body.status, at: new Date() } },
      },
      { new: true },
    ).lean();

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: order._id?.toString(), status: order.status },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export const GET = withSuperAdminAuth(getOrder);
export const PUT = withSuperAdminAuth(updateOrder);
