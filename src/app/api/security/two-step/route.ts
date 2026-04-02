import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { verifyToken, extractToken } from '@/lib/auth/middleware';
import crypto from 'crypto';

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

// Hash PIN
function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

// GET - Get two-step verification status
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
    
    // Get two-step verification status
    const twoStep = await db.collection('twoStepVerification').findOne({
      userId
    });

    return NextResponse.json({
      success: true,
      enabled: twoStep?.enabled || false,
      email: twoStep?.email || null,
      createdAt: twoStep?.createdAt || null
    });

  } catch (error) {
    console.error('Error getting two-step verification status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get two-step verification status' },
      { status: 500 }
    );
  }
}

// POST - Enable two-step verification
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
    const { pin, email } = body;

    if (!pin || pin.length !== 6 || !/^\d+$/.test(pin)) {
      return NextResponse.json(
        { success: false, error: 'PIN must be 6 digits' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    
    // Check if already enabled
    const existing = await db.collection('twoStepVerification').findOne({
      userId
    });

    if (existing?.enabled) {
      return NextResponse.json(
        { success: false, error: 'Two-step verification is already enabled' },
        { status: 400 }
      );
    }

    // Hash PIN
    const hashedPin = hashPin(pin);

    // Enable two-step verification
    await db.collection('twoStepVerification').updateOne(
      { userId },
      {
        $set: {
          enabled: true,
          hashedPin,
          email: email || null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Two-step verification enabled successfully'
    });

  } catch (error) {
    console.error('Error enabling two-step verification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to enable two-step verification' },
      { status: 500 }
    );
  }
}

// PUT - Verify PIN
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
    const { pin } = body;

    if (!pin) {
      return NextResponse.json(
        { success: false, error: 'PIN is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    
    // Get two-step verification settings
    const twoStep = await db.collection('twoStepVerification').findOne({
      userId,
      enabled: true
    });

    if (!twoStep) {
      return NextResponse.json(
        { success: false, error: 'Two-step verification is not enabled' },
        { status: 400 }
      );
    }

    // Verify PIN
    const hashedPin = hashPin(pin);
    if (hashedPin !== twoStep.hashedPin) {
      return NextResponse.json(
        { success: false, error: 'Invalid PIN' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'PIN verified successfully'
    });

  } catch (error) {
    console.error('Error verifying PIN:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify PIN' },
      { status: 500 }
    );
  }
}

// DELETE - Disable two-step verification
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

    const body = await request.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json(
        { success: false, error: 'PIN is required to disable two-step verification' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    
    // Get two-step verification settings
    const twoStep = await db.collection('twoStepVerification').findOne({
      userId,
      enabled: true
    });

    if (!twoStep) {
      return NextResponse.json(
        { success: false, error: 'Two-step verification is not enabled' },
        { status: 400 }
      );
    }

    // Verify PIN
    const hashedPin = hashPin(pin);
    if (hashedPin !== twoStep.hashedPin) {
      return NextResponse.json(
        { success: false, error: 'Invalid PIN' },
        { status: 400 }
      );
    }

    // Disable two-step verification
    await db.collection('twoStepVerification').updateOne(
      { userId },
      {
        $set: {
          enabled: false,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Two-step verification disabled successfully'
    });

  } catch (error) {
    console.error('Error disabling two-step verification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disable two-step verification' },
      { status: 500 }
    );
  }
}
