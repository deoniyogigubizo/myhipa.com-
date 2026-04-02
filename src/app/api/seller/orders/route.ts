import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/database/mongodb';
import { Order, Seller } from '@/lib/database/schemas';
import { withSellerAuth } from '@/lib/auth/middleware';

export const GET = withSellerAuth(async (request: NextRequest) => {
  try {
    await connectDB();
    
    const user = (request as any).user;
    // Convert userId string to ObjectId for proper MongoDB query
    const userId = new mongoose.Types.ObjectId(user.userId);
    const seller = await Seller.findOne({ userId });
    
    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const query: any = { sellerId: seller._id };
    
    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { _id: { $regex: search, $options: 'i' } },
        { 'buyerId.profile.displayName': { $regex: search, $options: 'i' } }
      ];
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('buyerId', 'profile.displayName profile.avatar profile.location')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query)
    ]);

    return NextResponse.json({
      orders: orders.map(order => ({
        id: order._id,
        orderNumber: order._id.toString().slice(-6),
        buyer: {
          id: order.buyerId._id,
          name: (order.buyerId as any).profile.displayName,
          avatar: (order.buyerId as any).profile.avatar,
          location: (order.buyerId as any).profile.location
        },
        items: order.items.map((item: any) => ({
          id: item.productId,
          name: item.name,
          image: item.image,
          quantity: item.quantity,
          price: item.price,
          variant: item.variant
        })),
        totalAmount: order.pricing?.total || 0,
        shippingFee: order.pricing?.shippingFee || 0,
        platformFee: order.pricing?.hipaFee || 0,
        sellerPayout: order.pricing?.sellerPayout || 0,
        status: order.status,
        paymentStatus: order.payment?.paidAt ? 'paid' : 'pending',
        shippingAddress: order.delivery?.address,
        trackingNumber: order.delivery?.tracking?.number,
        courierName: order.delivery?.tracking?.courier,
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        shippedAt: order.statusHistory?.find((h: any) => h.status === 'in_delivery')?.at,
        deliveredAt: order.statusHistory?.find((h: any) => h.status === 'dispute_window')?.at,
        completedAt: order.statusHistory?.find((h: any) => h.status === 'completed')?.at
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Seller orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const PATCH = withSellerAuth(async (request: NextRequest) => {
  try {
    await connectDB();
    
    const user = (request as any).user;
    // Convert userId string to ObjectId for proper MongoDB query
    const userId = new mongoose.Types.ObjectId(user.userId);
    const seller = await Seller.findOne({ userId });
    
    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { orderId, status, trackingNumber, courierName, notes } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const order = await Order.findOne({ _id: orderId, sellerId: seller._id });
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status
    if (status) {
      const validStatuses = ['pending_payment', 'paid', 'seller_processing', 'in_delivery', 'delivered', 'completed', 'cancelled', 'refunded'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
      
      order.status = status;
      
      // Add to status history
      if (!order.statusHistory) {
        order.statusHistory = [];
      }
      order.statusHistory.push({
        status,
        at: new Date()
      });
    }

    // Update tracking information
    if (trackingNumber || courierName) {
      if (!order.delivery || !order.delivery.address) {
        return NextResponse.json(
          { error: 'Order must have a delivery address before adding tracking information' },
          { status: 400 }
        );
      }
      if (!order.delivery.tracking) {
        order.delivery.tracking = {};
      }
      if (trackingNumber) {
        order.delivery.tracking.number = trackingNumber;
      }
      if (courierName) {
        order.delivery.tracking.courier = courierName;
      }
    }

    // Update notes
    if (notes !== undefined) {
      order.notes = notes;
    }

    await order.save();

    return NextResponse.json({
      success: true,
      order: {
        id: order._id,
        status: order.status,
        trackingNumber: order.delivery?.tracking?.number,
        courierName: order.delivery?.tracking?.courier,
        notes: order.notes,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
