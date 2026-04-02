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

// GET - Get business profile
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
    
    // Get business profile
    const businessProfile = await db.collection('businessProfiles').findOne({
      userId
    });

    if (!businessProfile) {
      return NextResponse.json({
        success: true,
        profile: null
      });
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: businessProfile._id.toString(),
        businessName: businessProfile.businessName,
        description: businessProfile.description,
        address: businessProfile.address,
        email: businessProfile.email,
        website: businessProfile.website,
        category: businessProfile.category,
        hours: businessProfile.hours,
        catalogEnabled: businessProfile.catalogEnabled,
        autoReplyEnabled: businessProfile.autoReplyEnabled,
        greetingMessage: businessProfile.greetingMessage,
        awayMessage: businessProfile.awayMessage,
        quickReplies: businessProfile.quickReplies || [],
        labels: businessProfile.labels || [],
        createdAt: businessProfile.createdAt,
        updatedAt: businessProfile.updatedAt
      }
    });

  } catch (error) {
    console.error('Error getting business profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get business profile' },
      { status: 500 }
    );
  }
}

// POST - Create or update business profile
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
      businessName,
      description,
      address,
      email,
      website,
      category,
      hours,
      catalogEnabled,
      autoReplyEnabled,
      greetingMessage,
      awayMessage,
      quickReplies,
      labels
    } = body;

    if (!businessName) {
      return NextResponse.json(
        { success: false, error: 'Business name is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    
    // Check if profile exists
    const existingProfile = await db.collection('businessProfiles').findOne({
      userId
    });

    const profileData = {
      userId,
      businessName,
      description: description || '',
      address: address || '',
      email: email || '',
      website: website || '',
      category: category || '',
      hours: hours || {},
      catalogEnabled: catalogEnabled !== false,
      autoReplyEnabled: autoReplyEnabled !== false,
      greetingMessage: greetingMessage || 'Hello! How can I help you today?',
      awayMessage: awayMessage || 'Thank you for your message. We will get back to you soon.',
      quickReplies: quickReplies || [],
      labels: labels || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (existingProfile) {
      // Update existing profile
      await db.collection('businessProfiles').updateOne(
        { _id: existingProfile._id },
        { $set: profileData }
      );

      return NextResponse.json({
        success: true,
        message: 'Business profile updated successfully',
        profileId: existingProfile._id.toString()
      });
    } else {
      // Create new profile
      const result = await db.collection('businessProfiles').insertOne(profileData);

      return NextResponse.json({
        success: true,
        message: 'Business profile created successfully',
        profileId: result.insertedId.toString()
      });
    }

  } catch (error) {
    console.error('Error saving business profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save business profile' },
      { status: 500 }
    );
  }
}
