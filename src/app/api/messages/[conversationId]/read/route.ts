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

// POST - Mark messages as read
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
    const { messageIds } = body;
    
    if (!messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json(
        { success: false, error: 'Message IDs are required' },
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
    
    // Mark messages as read
    const messageObjectIds = messageIds.map(id => new mongoose.Types.ObjectId(id));
    
    await db.collection('messages').updateMany(
      {
        _id: { $in: messageObjectIds },
        conversationId: conversationObjectId,
        readBy: { $ne: userId }
      },
      {
        $addToSet: { readBy: userId }
      }
    );
    
    // Reset unread count for this user in the conversation
    await db.collection('conversations').updateOne(
      { _id: conversationObjectId },
      {
        $set: {
          'unreadCount.$[elem].count': 0
        }
      },
      {
        arrayFilters: [{ 'elem.userId': userId }]
      }
    );
    
    // Get the other participant to send read receipt
    const otherParticipantId = conversation.participants.find(
      (p: mongoose.Types.ObjectId) => p.toString() !== user.userId
    );
    
    // Send read receipt via WebSocket if other participant is connected
    if (otherParticipantId) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/messages/ws`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'read_receipt',
            conversationId,
            recipientId: otherParticipantId.toString(),
            data: {
              messageIds,
              readBy: user.userId
            }
          }),
        });
      } catch (err) {
        console.error('Error sending read receipt:', err);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Messages marked as read'
    });
    
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
