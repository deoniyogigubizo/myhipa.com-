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

// GET - Get conversation settings
export async function GET(
  request: Request,
  { params }: { params: { conversationId: string } }
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

    const { conversationId } = params;
    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    const conversationObjectId = new mongoose.Types.ObjectId(conversationId);
    
    // Verify user is a participant in this conversation
    const conversation = await db.collection('conversations').findOne({
      _id: conversationObjectId,
      participants: userId
    });
    
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Get user-specific conversation settings
    const settings = await db.collection('conversationSettings').findOne({
      conversationId: conversationObjectId,
      userId
    });

    return NextResponse.json({
      success: true,
      settings: {
        pinned: settings?.pinned || false,
        archived: settings?.archived || false,
        muted: settings?.muted || false,
        mutedUntil: settings?.mutedUntil || null,
        wallpaper: settings?.wallpaper || null,
        disappearingMessages: settings?.disappearingMessages || 'off',
        disappearingMessagesDuration: settings?.disappearingMessagesDuration || null
      }
    });

  } catch (error) {
    console.error('Error getting conversation settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get conversation settings' },
      { status: 500 }
    );
  }
}

// POST - Update conversation settings
export async function POST(
  request: Request,
  { params }: { params: { conversationId: string } }
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

    const { conversationId } = params;
    const body = await request.json();
    const {
      pinned,
      archived,
      muted,
      mutedUntil,
      wallpaper,
      disappearingMessages,
      disappearingMessagesDuration
    } = body;

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    const conversationObjectId = new mongoose.Types.ObjectId(conversationId);
    
    // Verify user is a participant in this conversation
    const conversation = await db.collection('conversations').findOne({
      _id: conversationObjectId,
      participants: userId
    });
    
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date()
    };

    if (pinned !== undefined) updateData.pinned = pinned;
    if (archived !== undefined) updateData.archived = archived;
    if (muted !== undefined) updateData.muted = muted;
    if (mutedUntil !== undefined) updateData.mutedUntil = mutedUntil ? new Date(mutedUntil) : null;
    if (wallpaper !== undefined) updateData.wallpaper = wallpaper;
    if (disappearingMessages !== undefined) {
      updateData.disappearingMessages = disappearingMessages;
      if (disappearingMessages === 'off') {
        updateData.disappearingMessagesDuration = null;
      }
    }
    if (disappearingMessagesDuration !== undefined) {
      updateData.disappearingMessagesDuration = disappearingMessagesDuration;
    }

    // Update or create conversation settings
    await db.collection('conversationSettings').updateOne(
      { conversationId: conversationObjectId, userId },
      {
        $set: updateData
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Conversation settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating conversation settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update conversation settings' },
      { status: 500 }
    );
  }
}
