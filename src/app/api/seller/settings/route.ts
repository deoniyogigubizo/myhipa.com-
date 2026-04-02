import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/database/mongodb';
import { Seller, User, AuditLog } from '@/lib/database/schemas';
import { withSellerAuth } from '@/lib/auth/middleware';


export const dynamic = "force-dynamic";
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

    // Fetch user data to get phone number
    const userData = await User.findById(user.userId);
    
    return NextResponse.json({
      store: {
        name: seller.store.name,
        slug: seller.store.slug,
        logo: seller.store.logo,
        banner: seller.store.banner,
        bio: seller.store.bio,
        categories: seller.store.categories,
        location: seller.store.location
      },
      phone: userData?.phone || null,
      policies: {
        shipping: seller.policies.shipping,
        returns: seller.policies.returns,
        autoReply: seller.policies.autoReply
      },
      businessHours: seller.businessHours,
      kycStatus: seller.kycStatus,
      payoutMethods: seller.payoutMethods
    });
  } catch (error) {
    console.error('Seller settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const PUT = withSellerAuth(async (request: NextRequest) => {
  try {
    await connectDB();
    
    const user = (request as any).user;
    const body = await request.json();
    
    const seller = await Seller.findOne({ userId: user.userId });
    
    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      );
    }

    // Update store fields
    if (body.store) {
      if (body.store.name) seller.store.name = body.store.name;
      if (body.store.bio !== undefined) seller.store.bio = body.store.bio;
      if (body.store.logo) seller.store.logo = body.store.logo;
      if (body.store.banner) seller.store.banner = body.store.banner;
    }

    // Update policies
    if (body.policies) {
      if (body.policies.shipping !== undefined) seller.policies.shipping = body.policies.shipping;
      if (body.policies.returns !== undefined) seller.policies.returns = body.policies.returns;
      if (body.policies.autoReply !== undefined) seller.policies.autoReply = body.policies.autoReply;
    }

    // Update business hours
    if (body.businessHours) {
      seller.businessHours = body.businessHours;
    }

    await seller.save();

    // Log settings update activity
    try {
      await (AuditLog as any).log({
        actor: {
          userId: user.userId,
          role: user.role || 'seller',
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        },
        action: 'settings_updated',
        entity: {
          type: 'seller',
          id: seller._id
        },
        metadata: {
          updatedFields: Object.keys(body)
        }
      });
    } catch (logError) {
      console.error('Error logging settings update:', logError);
    }

    // Fetch user data to get phone number
    const userData = await User.findById(user.userId);

    return NextResponse.json({
      message: 'Settings updated successfully',
      store: {
        name: seller.store.name,
        slug: seller.store.slug,
        logo: seller.store.logo,
        banner: seller.store.banner,
        bio: seller.store.bio,
        categories: seller.store.categories,
        location: seller.store.location
      },
      phone: userData?.phone || null,
      policies: {
        shipping: seller.policies.shipping,
        returns: seller.policies.returns,
        autoReply: seller.policies.autoReply
      },
      businessHours: seller.businessHours,
      kycStatus: seller.kycStatus,
      payoutMethods: seller.payoutMethods
    });
  } catch (error) {
    console.error('Update seller settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
