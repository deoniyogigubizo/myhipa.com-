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

// GET - Get all labels for user
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
    
    // Get labels
    const labels = await db.collection('labels')
      .find({ userId })
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      labels: labels.map(label => ({
        id: label._id.toString(),
        name: label.name,
        color: label.color,
        description: label.description,
        createdAt: label.createdAt,
        updatedAt: label.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error getting labels:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get labels' },
      { status: 500 }
    );
  }
}

// POST - Create new label
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
    const { name, color, description } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Label name is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    
    // Check if label name already exists
    const existing = await db.collection('labels').findOne({
      userId,
      name
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Label name already exists' },
        { status: 400 }
      );
    }

    // Create label
    const result = await db.collection('labels').insertOne({
      userId,
      name,
      color: color || '#3B82F6',
      description: description || '',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Label created successfully',
      label: {
        id: result.insertedId.toString(),
        name,
        color: color || '#3B82F6',
        description: description || ''
      }
    });

  } catch (error) {
    console.error('Error creating label:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create label' },
      { status: 500 }
    );
  }
}

// PUT - Update label
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
    const { id, name, color, description } = body;

    if (!id || !name) {
      return NextResponse.json(
        { success: false, error: 'ID and name are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    const labelId = new mongoose.Types.ObjectId(id);
    
    // Check if label name already exists for another label
    const existing = await db.collection('labels').findOne({
      userId,
      name,
      _id: { $ne: labelId }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Label name already exists' },
        { status: 400 }
      );
    }

    // Update label
    await db.collection('labels').updateOne(
      { _id: labelId, userId },
      {
        $set: {
          name,
          color: color || '#3B82F6',
          description: description || '',
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Label updated successfully'
    });

  } catch (error) {
    console.error('Error updating label:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update label' },
      { status: 500 }
    );
  }
}

// DELETE - Delete label
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
        { success: false, error: 'Label ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    const labelId = new mongoose.Types.ObjectId(id);
    
    // Delete label
    await db.collection('labels').deleteOne({
      _id: labelId,
      userId
    });

    // Remove label from all conversations
    await db.collection('conversations').updateMany(
      { participants: userId },
      { $pull: { labels: labelId } as any }
    );

    return NextResponse.json({
      success: true,
      message: 'Label deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting label:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete label' },
      { status: 500 }
    );
  }
}
