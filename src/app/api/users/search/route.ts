import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { verifyToken, extractToken } from '@/lib/auth/middleware';


export const dynamic = "force-dynamic";
// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://deoniyogisubizo:maiden410@myhipa.qkj7r5a.mongodb.net/hipa';

let cachedConn: mongoose.Connection | null = null;

async function getDb() {
  if (cachedConn && cachedConn.readyState === 1) {
    return cachedConn;
  }
  
  const opts = {
    bufferCommands: true,
  };
  
  const conn = await mongoose.connect(MONGODB_URI, opts);
  cachedConn = conn.connection;
  return cachedConn;
}

// GET - Search all users (sellers, buyers, users) by name, username, or email
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
    const role = searchParams.get('role') || 'all'; // 'all', 'seller', 'buyer', 'user'
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

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
    };

    // Filter by role if specified
    if (role !== 'all') {
      searchQuery.role = role;
    } else {
      // When role is 'all', search for all user types (sellers, buyers, users)
      // No role filter means it will match all users
    }

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
      // Search by product category (for sellers) - use exact match for better results
      orConditions.push({ 'store.categories': { $regex: '^' + category + '$', $options: 'i' } });
    }

    if (orConditions.length > 0) {
      searchQuery.$or = orConditions;
    }

    // Execute search with pagination
    const skip = (page - 1) * limit;
    
    const users = await db.collection('users')
      .find(searchQuery)
      .sort({ 'store.rating': -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const totalUsers = await db.collection('users').countDocuments(searchQuery);

    // Format user data
    const formattedUsers = users.map(user => {
      // Try to get the best name from available fields
      const displayName = user.profile?.displayName || 
                         user.store?.name || 
                         user.username || 
                         user.email?.split('@')[0] || 
                         'Unknown User';
      
      return {
        id: user._id.toString(),
        name: displayName,
        username: user.username || '',
        email: user.email || '',
        avatar: user.avatar || user.store?.logo || null,
        role: user.role || 'user',
        storeName: user.store?.name || '',
        storeSlug: user.store?.slug || '',
        categories: user.store?.categories || [],
        rating: user.store?.rating || 0,
        totalSales: user.store?.totalSales || 0,
        isVerified: user.store?.isVerified || false,
        responseTime: user.store?.responseTime || 'Unknown',
        location: user.store?.location || ''
      };
    });

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit)
      }
    });

  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search users' },
      { status: 500 }
    );
  }
}
