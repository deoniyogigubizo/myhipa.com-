import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';


export const dynamic = "force-dynamic";
// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://deoniyogisubizo:maiden410@myhipa.qkj7r5a.mongodb.net/hipa';

// Cache for database connection
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sellerId, action } = body; // action: 'follow' or 'unfollow'

    if (!sellerId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = await getDb();

    if (action === 'follow') {
      // Increment follower count
      await db.collection('sellers').updateOne(
        { _id: new mongoose.Types.ObjectId(sellerId) },
        {
          $inc: { 'stats.followers': 1 },
          $setOnInsert: { stats: { followers: 1 } }
        },
        { upsert: true }
      );

      return NextResponse.json({
        success: true,
        message: 'Successfully followed seller',
        action: 'followed'
      });

    } else if (action === 'unfollow') {
      // Decrement follower count (ensure it doesn't go below 0)
      await db.collection('sellers').updateOne(
        { _id: new mongoose.Types.ObjectId(sellerId) },
        {
          $inc: { 'stats.followers': -1 },
          $min: { 'stats.followers': 0 }
        }
      );

      return NextResponse.json({
        success: true,
        message: 'Successfully unfollowed seller',
        action: 'unfollowed'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Failed to follow/unfollow seller:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update follow status' },
      { status: 500 }
    );
  }
}