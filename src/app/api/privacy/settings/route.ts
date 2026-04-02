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

// GET - Get privacy settings
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
    
    // Get privacy settings
    const privacySettings = await db.collection('privacySettings').findOne({
      userId
    });

    if (!privacySettings) {
      // Return default settings
      return NextResponse.json({
        success: true,
        settings: {
          lastSeen: 'everyone',
          profilePhoto: 'everyone',
          about: 'everyone',
          readReceipts: true,
          groups: 'everyone',
          liveLocation: 'none',
          blockedUsers: []
        }
      });
    }

    return NextResponse.json({
      success: true,
      settings: {
        lastSeen: privacySettings.lastSeen || 'everyone',
        profilePhoto: privacySettings.profilePhoto || 'everyone',
        about: privacySettings.about || 'everyone',
        readReceipts: privacySettings.readReceipts !== false,
        groups: privacySettings.groups || 'everyone',
        liveLocation: privacySettings.liveLocation || 'none',
        blockedUsers: privacySettings.blockedUsers?.map((id: mongoose.Types.ObjectId) => id.toString()) || []
      }
    });

  } catch (error) {
    console.error('Error getting privacy settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get privacy settings' },
      { status: 500 }
    );
  }
}

// POST - Update privacy settings
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
    const {
      lastSeen,
      profilePhoto,
      about,
      readReceipts,
      groups,
      liveLocation
    } = body;

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    
    // Validate settings
    const validOptions = ['everyone', 'contacts', 'nobody'];
    
    if (lastSeen && !validOptions.includes(lastSeen)) {
      return NextResponse.json(
        { success: false, error: 'Invalid lastSeen value' },
        { status: 400 }
      );
    }

    if (profilePhoto && !validOptions.includes(profilePhoto)) {
      return NextResponse.json(
        { success: false, error: 'Invalid profilePhoto value' },
        { status: 400 }
      );
    }

    if (about && !validOptions.includes(about)) {
      return NextResponse.json(
        { success: false, error: 'Invalid about value' },
        { status: 400 }
      );
    }

    if (groups && !validOptions.includes(groups)) {
      return NextResponse.json(
        { success: false, error: 'Invalid groups value' },
        { status: 400 }
      );
    }

    if (liveLocation && !['everyone', 'contacts', 'none'].includes(liveLocation)) {
      return NextResponse.json(
        { success: false, error: 'Invalid liveLocation value' },
        { status: 400 }
      );
    }

    // Update or create privacy settings
    await db.collection('privacySettings').updateOne(
      { userId },
      {
        $set: {
          lastSeen: lastSeen || 'everyone',
          profilePhoto: profilePhoto || 'everyone',
          about: about || 'everyone',
          readReceipts: readReceipts !== false,
          groups: groups || 'everyone',
          liveLocation: liveLocation || 'none',
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Privacy settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating privacy settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update privacy settings' },
      { status: 500 }
    );
  }
}
