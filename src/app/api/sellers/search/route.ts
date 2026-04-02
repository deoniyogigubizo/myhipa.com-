import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { verifyToken, extractToken } from '@/lib/auth/middleware';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://deoniyogisubizo:maiden410@myhipa.qkj7r5a.mongodb.net/hipa';

let cachedConn: mongoose.Connection | null = null;

async function getDb() {
  if (cachedConn && cachedConn.readyState === 1) {
    return cachedConn;
  }
  
  const opts = {
    bufferCommands: false,
  };
  
  const conn = await mongoose.connect(MONGODB_URI, opts);
  cachedConn = conn.connection;
  return cachedConn;
}

// GET - Search sellers by name, category, username, or email
export async function GET(request: Request) {
  try {
    const token = extractToken(request as any);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query && !category) {
      return NextResponse.json(
        { success: false, error: 'Search query or category is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    
    // Build search query
    const searchQuery: any = {
      _id: { $ne: userId }, // Exclude current user
      role: 'seller' // Only search for sellers
    };

    // Build OR conditions for search
    const orConditions: any[] = [];

    if (query) {
      // Search by name, username, or email
      orConditions.push(
        { name: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { 'store.name': { $regex: query, $options: 'i' } }
      );
    }

    if (category) {
      // Search by product category
      orConditions.push({ 'store.categories': { $regex: category, $options: 'i' } });
    }

    if (orConditions.length > 0) {
      searchQuery.$or = orConditions;
    }

    // Execute search with pagination
    const skip = (page - 1) * limit;
    
    const sellers = await db.collection('users')
      .find(searchQuery)
      .sort({ 'store.rating': -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const totalSellers = await db.collection('users').countDocuments(searchQuery);

    // Format seller data
    const formattedSellers = sellers.map(seller => ({
      id: seller._id.toString(),
      name: seller.store?.name || 'Unknown Seller',
      username: seller.username || '',
      email: seller.email || '',
      avatar: seller.avatar || seller.store?.logo || null,
      storeName: seller.store?.name || '',
      storeSlug: seller.store?.slug || '',
      categories: seller.store?.categories || [],
      rating: seller.store?.rating || 0,
      totalSales: seller.store?.totalSales || 0,
      isVerified: seller.store?.isVerified || false,
      responseTime: seller.store?.responseTime || 'Unknown',
      location: seller.store?.location || ''
    }));

    return NextResponse.json({
      success: true,
      sellers: formattedSellers,
      pagination: {
        page,
        limit,
        total: totalSellers,
        totalPages: Math.ceil(totalSellers / limit)
      }
    });

  } catch (error) {
    console.error('Error searching sellers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search sellers' },
      { status: 500 }
    );
  }
}
