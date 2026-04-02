import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { verifyToken, extractToken } from '@/lib/auth/middleware';
import crypto from 'crypto';


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

// Generate device ID
function generateDeviceId(): string {
  return crypto.randomBytes(16).toString('hex');
}

// GET - Get all linked devices
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
    
    // Get all linked devices
    const devices = await db.collection('devices')
      .find({ userId, active: true })
      .sort({ lastActive: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      devices: devices.map(device => ({
        id: device._id.toString(),
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        lastActive: device.lastActive,
        createdAt: device.createdAt
      }))
    });

  } catch (error) {
    console.error('Error getting devices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get devices' },
      { status: 500 }
    );
  }
}

// POST - Link new device
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
    const { deviceName, deviceType } = body;

    if (!deviceName || !deviceType) {
      return NextResponse.json(
        { success: false, error: 'Device name and type are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    
    // Check if user already has 4 devices (WhatsApp limit)
    const deviceCount = await db.collection('devices').countDocuments({
      userId,
      active: true
    });

    if (deviceCount >= 4) {
      return NextResponse.json(
        { success: false, error: 'Maximum 4 devices allowed' },
        { status: 400 }
      );
    }

    // Generate device ID
    const deviceId = generateDeviceId();

    // Create new device
    const result = await db.collection('devices').insertOne({
      userId,
      deviceId,
      deviceName,
      deviceType,
      active: true,
      lastActive: new Date(),
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Device linked successfully',
      device: {
        id: result.insertedId.toString(),
        deviceId,
        deviceName,
        deviceType
      }
    });

  } catch (error) {
    console.error('Error linking device:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to link device' },
      { status: 500 }
    );
  }
}

// PUT - Update device last active
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
    const { deviceId } = body;

    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: 'Device ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    
    // Update device last active
    await db.collection('devices').updateOne(
      { userId, deviceId, active: true },
      {
        $set: {
          lastActive: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Device activity updated'
    });

  } catch (error) {
    console.error('Error updating device activity:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update device activity' },
      { status: 500 }
    );
  }
}

// DELETE - Unlink device
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
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: 'Device ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    
    // Deactivate device
    await db.collection('devices').updateOne(
      { userId, deviceId },
      {
        $set: {
          active: false,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Device unlinked successfully'
    });

  } catch (error) {
    console.error('Error unlinking device:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unlink device' },
      { status: 500 }
    );
  }
}
