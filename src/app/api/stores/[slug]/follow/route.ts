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

// GET - Check if user is following a store
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
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

    const { slug } = params;
    const db = await getDb();
    
    // Find store by slug
    const store = await db.collection('sellers').findOne({
      $or: [
        { 'store.slug': slug },
        { 'store.storeName': { $regex: `^${slug}$`, $options: 'i' } }
      ]
    });
    
    if (!store) {
      return NextResponse.json(
        { success: false, error: 'Store not found' },
        { status: 404 }
      );
    }

    // Check if user is following this store
    const follow = await db.collection('follows').findOne({
      userId: new mongoose.Types.ObjectId(user.userId),
      sellerId: store._id
    });

    return NextResponse.json({
      success: true,
      isFollowing: !!follow
    });
    
  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check follow status' },
      { status: 500 }
    );
  }
}

// POST - Toggle follow/unfollow a store
export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
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

    const { slug } = params;
    const db = await getDb();
    
    // Find store by slug
    const store = await db.collection('sellers').findOne({
      $or: [
        { 'store.slug': slug },
        { 'store.storeName': { $regex: `^${slug}$`, $options: 'i' } }
      ]
    });
    
    if (!store) {
      return NextResponse.json(
        { success: false, error: 'Store not found' },
        { status: 404 }
      );
    }

    const userId = new mongoose.Types.ObjectId(user.userId);
    
    // Check if already following
    const existingFollow = await db.collection('follows').findOne({
      userId,
      sellerId: store._id
    });

    if (existingFollow) {
      // Unfollow
      await db.collection('follows').deleteOne({
        userId,
        sellerId: store._id
      });
      
      // Decrement follower count
      await db.collection('sellers').updateOne(
        { _id: store._id },
        { $inc: { 'stats.followerCount': -1 } }
      );
      
      return NextResponse.json({
        success: true,
        isFollowing: false,
        message: 'Unfollowed store'
      });
    } else {
      // Follow
      await db.collection('follows').insertOne({
        userId,
        sellerId: store._id,
        createdAt: new Date()
      });
      
      // Increment follower count
      await db.collection('sellers').updateOne(
        { _id: store._id },
        { $inc: { 'stats.followerCount': 1 } }
      );
      
      return NextResponse.json({
        success: true,
        isFollowing: true,
        message: 'Following store'
      });
    }
    
  } catch (error) {
    console.error('Error toggling follow:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle follow' },
      { status: 500 }
    );
  }
}
