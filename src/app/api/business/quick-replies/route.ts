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
    bufferCommands: false,
  };
  
  const conn = await mongoose.connect(MONGODB_URI, opts);
  cachedConn = conn.connection;
  return cachedConn;
}

// GET - Get all quick replies for user
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
    
    // Get quick replies
    const quickReplies = await db.collection('quickReplies')
      .find({ userId })
      .sort({ shortcut: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      quickReplies: quickReplies.map(qr => ({
        id: qr._id.toString(),
        shortcut: qr.shortcut,
        message: qr.message,
        createdAt: qr.createdAt,
        updatedAt: qr.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error getting quick replies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get quick replies' },
      { status: 500 }
    );
  }
}

// POST - Create new quick reply
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
    const { shortcut, message } = body;

    if (!shortcut || !message) {
      return NextResponse.json(
        { success: false, error: 'Shortcut and message are required' },
        { status: 400 }
      );
    }

    // Validate shortcut format (should start with /)
    if (!shortcut.startsWith('/')) {
      return NextResponse.json(
        { success: false, error: 'Shortcut must start with /' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    
    // Check if shortcut already exists
    const existing = await db.collection('quickReplies').findOne({
      userId,
      shortcut
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Shortcut already exists' },
        { status: 400 }
      );
    }

    // Create quick reply
    const result = await db.collection('quickReplies').insertOne({
      userId,
      shortcut,
      message,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Quick reply created successfully',
      quickReply: {
        id: result.insertedId.toString(),
        shortcut,
        message
      }
    });

  } catch (error) {
    console.error('Error creating quick reply:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create quick reply' },
      { status: 500 }
    );
  }
}

// PUT - Update quick reply
export async function PUT(request: Request) {
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
    const { id, shortcut, message } = body;

    if (!id || !shortcut || !message) {
      return NextResponse.json(
        { success: false, error: 'ID, shortcut, and message are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    const quickReplyId = new mongoose.Types.ObjectId(id);
    
    // Check if shortcut already exists for another quick reply
    const existing = await db.collection('quickReplies').findOne({
      userId,
      shortcut,
      _id: { $ne: quickReplyId }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Shortcut already exists' },
        { status: 400 }
      );
    }

    // Update quick reply
    await db.collection('quickReplies').updateOne(
      { _id: quickReplyId, userId },
      {
        $set: {
          shortcut,
          message,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Quick reply updated successfully'
    });

  } catch (error) {
    console.error('Error updating quick reply:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update quick reply' },
      { status: 500 }
    );
  }
}

// DELETE - Delete quick reply
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Quick reply ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    const quickReplyId = new mongoose.Types.ObjectId(id);
    
    // Delete quick reply
    await db.collection('quickReplies').deleteOne({
      _id: quickReplyId,
      userId
    });

    return NextResponse.json({
      success: true,
      message: 'Quick reply deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting quick reply:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete quick reply' },
      { status: 500 }
    );
  }
}
