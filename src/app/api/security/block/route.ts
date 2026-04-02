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

// GET - Get blocked users
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

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    
    // Get blocked users
    const blockedUsers = await db.collection('blockedUsers')
      .find({ userId })
      .toArray();

    // Get user details for blocked users
    const blockedUserDetails = await Promise.all(
      blockedUsers.map(async (blocked) => {
        const blockedUser = await db.collection('users').findOne(
          { _id: blocked.blockedUserId },
          { projection: { _id: 1, 'profile.displayName': 1, email: 1, 'profile.avatar': 1 } }
        );

        return {
          id: blocked._id.toString(),
          blockedUserId: blocked.blockedUserId.toString(),
          user: blockedUser ? {
            id: blockedUser._id.toString(),
            name: blockedUser.profile?.displayName || blockedUser.email?.split('@')[0] || 'Unknown User',
            email: blockedUser.email,
            avatar: blockedUser.profile?.avatar
          } : null,
          reason: blocked.reason,
          blockedAt: blocked.blockedAt
        };
      })
    );

    return NextResponse.json({
      success: true,
      blockedUsers: blockedUserDetails
    });

  } catch (error) {
    console.error('Error getting blocked users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get blocked users' },
      { status: 500 }
    );
  }
}

// POST - Block user
export async function POST(request: Request) {
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

    const body = await request.json();
    const { userId: blockedUserId, reason } = body;

    if (!blockedUserId) {
      return NextResponse.json(
        { success: false, error: 'User ID to block is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    const blockedUserObjectId = new mongoose.Types.ObjectId(blockedUserId);
    
    // Check if already blocked
    const existing = await db.collection('blockedUsers').findOne({
      userId,
      blockedUserId: blockedUserObjectId
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'User is already blocked' },
        { status: 400 }
      );
    }

    // Block user
    await db.collection('blockedUsers').insertOne({
      userId,
      blockedUserId: blockedUserObjectId,
      reason: reason || '',
      blockedAt: new Date()
    });

    // Add to privacy settings blocked users list
    await db.collection('privacySettings').updateOne(
      { userId },
      {
        $addToSet: { blockedUsers: blockedUserObjectId },
        $set: { updatedAt: new Date() }
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'User blocked successfully'
    });

  } catch (error) {
    console.error('Error blocking user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to block user' },
      { status: 500 }
    );
  }
}

// DELETE - Unblock user
export async function DELETE(request: Request) {
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
    const blockedUserId = searchParams.get('userId');

    if (!blockedUserId) {
      return NextResponse.json(
        { success: false, error: 'User ID to unblock is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    const blockedUserObjectId = new mongoose.Types.ObjectId(blockedUserId);
    
    // Unblock user
    await db.collection('blockedUsers').deleteOne({
      userId,
      blockedUserId: blockedUserObjectId
    });

    // Remove from privacy settings blocked users list
    await db.collection('privacySettings').updateOne(
      { userId },
      {
        $pull: { blockedUsers: blockedUserObjectId } as any,
        $set: { updatedAt: new Date() }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'User unblocked successfully'
    });

  } catch (error) {
    console.error('Error unblocking user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unblock user' },
      { status: 500 }
    );
  }
}
