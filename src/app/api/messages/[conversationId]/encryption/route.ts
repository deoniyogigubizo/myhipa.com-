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

// POST - Enable/disable encryption for a conversation
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
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Enabled status is required' },
        { status: 400 }
      );
    }

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

    // Check if both users have encryption keys
    if (enabled) {
      const otherParticipantId = conversation.participants.find(
        (p: mongoose.Types.ObjectId) => p.toString() !== user.userId
      );
      
      if (otherParticipantId) {
        const [currentUser, otherUser] = await Promise.all([
          db.collection('users').findOne(
            { _id: userId },
            { projection: { publicKey: 1 } }
          ),
          db.collection('users').findOne(
            { _id: otherParticipantId },
            { projection: { publicKey: 1 } }
          )
        ]);

        if (!currentUser?.publicKey || !otherUser?.publicKey) {
          return NextResponse.json(
            { success: false, error: 'Both users must have encryption keys enabled' },
            { status: 400 }
          );
        }
      }
    }

    // Update conversation encryption status
    await db.collection('conversations').updateOne(
      { _id: conversationObjectId },
      {
        $set: {
          encryptionEnabled: enabled,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: `Encryption ${enabled ? 'enabled' : 'disabled'} successfully`,
      encryptionEnabled: enabled
    });

  } catch (error) {
    console.error('Error updating encryption:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update encryption' },
      { status: 500 }
    );
  }
}

// GET - Get encryption status for a conversation
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

    return NextResponse.json({
      success: true,
      encryptionEnabled: conversation.encryptionEnabled || false
    });

  } catch (error) {
    console.error('Error getting encryption status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get encryption status' },
      { status: 500 }
    );
  }
}
