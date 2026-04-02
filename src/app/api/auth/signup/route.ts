import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/database/mongodb';
import { User, Seller } from '@/lib/database/schemas';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      password, 
      displayName, 
      city, 
      country, 
      phone, 
      role,
      sellerData 
    } = body;

    // Validate required fields
    if (!email || !password || !displayName || !city || !country || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['buyer', 'seller'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be buyer or seller' },
        { status: 400 }
      );
    }

    // Validate password
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Validate seller-specific fields
    if (role === 'seller') {
      if (!sellerData || !sellerData.store || !sellerData.store.name || !sellerData.store.slug) {
        return NextResponse.json(
          { error: 'Store name and slug are required for sellers' },
          { status: 400 }
        );
      }
      if (!phone && !sellerData.phone) {
        return NextResponse.json(
          { error: 'Phone number is required for sellers' },
          { status: 400 }
        );
      }
      if (!sellerData.payoutMethods || sellerData.payoutMethods.length === 0) {
        return NextResponse.json(
          { error: 'Payout method is required for sellers' },
          { status: 400 }
        );
      }
    }

    await connectDB();

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Check if phone already exists (if provided)
    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return NextResponse.json(
          { error: 'Phone number already registered' },
          { status: 409 }
        );
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      passwordHash,
      phone: phone || undefined,
      role: role === 'seller' ? 'seller' : 'buyer',
      profile: {
        displayName,
        location: {
          city,
          country,
        },
        language: 'en',
      },
      reputation: {
        score: 0,
        level: 'newcomer',
        badges: [],
        disputesFiled: 0,
        disputesLost: 0,
      },
      wallet: {
        balance: 0,
        currency: 'RWF',
        pendingRefunds: 0,
      },
      auth: {
        emailVerified: false,
        twoFactorEnabled: false,
        loginProvider: 'email',
      },
      preferences: {
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
        savedSearches: [],
        wishlist: [],
        followedSellers: [],
      },
      kycStatus: 'none',
    });

    await user.save();

    // Create seller profile if registering as seller
    if (role === 'seller' && sellerData) {
      const seller = new Seller({
        userId: user._id,
        store: {
          name: sellerData.store.name,
          slug: sellerData.store.slug,
          bio: sellerData.store.bio || '',
          categories: sellerData.store.categories || [],
          location: {
            city: sellerData.store.location?.city || city,
            country: sellerData.store.location?.country || country,
          },
        },
        tier: 'standard',
        feeRate: 0.03,
        kycStatus: 'none',
        stats: {
          totalRevenue: 0,
          totalOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          disputeRate: 0,
          avgRating: 0,
          reviewCount: 0,
          avgResponseTimeMin: 0,
          followerCount: 0,
          productCount: 0,
        },
        wallet: {
          available: 0,
          pending: 0,
          held: 0,
          currency: 'RWF',
          totalWithdrawn: 0,
        },
        payoutMethods: sellerData.payoutMethods || [],
        policies: {
          shipping: '',
          returns: '',
        },
        shippingZones: [],
        businessHours: {},
        onboardingStep: 'profile',
      });

      await seller.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password hash)
    const userData = {
      id: user._id,
      email: user.email,
      displayName: user.profile.displayName,
      avatar: user.profile.avatar,
      role: user.role,
      kycStatus: user.kycStatus,
    };

    const response = NextResponse.json({
      user: userData,
      token,
    }, { status: 201 });

    // Set token as cookie for middleware authentication
    response.cookies.set('hipa_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
