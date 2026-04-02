import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { verifyToken, extractToken } from '@/lib/auth/middleware';
import { generateKeyPair, generateSecurityCode } from '@/lib/encryption';


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

// GET - Get user's public key
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
    
    // Get user's public key
    const userRecord = await db.collection('users').findOne(
      { _id: userId },
      { projection: { publicKey: 1 } }
    );

    if (!userRecord?.publicKey) {
      return NextResponse.json(
        { success: false, error: 'No public key found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      publicKey: userRecord.publicKey
    });

  } catch (error) {
    console.error('Error getting public key:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get public key' },
      { status: 500 }
    );
  }
}

// POST - Generate and store key pair for user
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

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    
    // Check if user already has keys
    const existingUser = await db.collection('users').findOne(
      { _id: userId },
      { projection: { publicKey: 1, privateKey: 1 } }
    );

    if (existingUser?.publicKey) {
      return NextResponse.json({
        success: true,
        message: 'Keys already exist',
        publicKey: existingUser.publicKey
      });
    }

    // Generate new key pair
    const { publicKey, privateKey } = generateKeyPair();
    
    // Store keys in user document
    await db.collection('users').updateOne(
      { _id: userId },
      {
        $set: {
          publicKey,
          privateKey,
          encryptionEnabled: true,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Keys generated successfully',
      publicKey
    });

  } catch (error) {
    console.error('Error generating keys:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate keys' },
      { status: 500 }
    );
  }
}

// PUT - Get security code for verification with another user
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
    const { otherUserId } = body;

    if (!otherUserId) {
      return NextResponse.json(
        { success: false, error: 'Other user ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    const otherUserObjectId = new mongoose.Types.ObjectId(otherUserId);
    
    // Get both users' public keys
    const [currentUser, otherUser] = await Promise.all([
      db.collection('users').findOne(
        { _id: userId },
        { projection: { publicKey: 1 } }
      ),
      db.collection('users').findOne(
        { _id: otherUserObjectId },
        { projection: { publicKey: 1 } }
      )
    ]);

    if (!currentUser?.publicKey || !otherUser?.publicKey) {
      return NextResponse.json(
        { success: false, error: 'Both users must have encryption keys' },
        { status: 400 }
      );
    }

    // Generate security code
    const securityCode = generateSecurityCode(currentUser.publicKey, otherUser.publicKey);

    return NextResponse.json({
      success: true,
      securityCode
    });

  } catch (error) {
    console.error('Error generating security code:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate security code' },
      { status: 500 }
    );
  }
}
