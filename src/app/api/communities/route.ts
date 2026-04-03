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

// GET - Get all communities for user
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
    
    // Get all communities where user is a member
    const communities = await db.collection('communities')
      .find({ members: userId })
      .sort({ createdAt: -1 })
      .toArray();

    // Enrich communities with member count and admin details
    const enrichedCommunities = await Promise.all(
      communities.map(async (community) => {
        const admin = await db.collection('users').findOne(
          { _id: community.adminId },
          { projection: { _id: 1, 'profile.displayName': 1, 'profile.avatar': 1, email: 1 } }
        );

        return {
          id: community._id.toString(),
          name: community.name,
          description: community.description,
          icon: community.icon,
          admin: admin ? {
            id: admin._id.toString(),
            name: admin.profile?.displayName || admin.email?.split('@')[0] || 'Unknown User',
            avatar: admin.profile?.avatar
          } : null,
          memberCount: community.members?.length || 0,
          createdAt: community.createdAt,
          updatedAt: community.updatedAt
        };
      })
    );

    return NextResponse.json({
      success: true,
      communities: enrichedCommunities
    });

  } catch (error) {
    console.error('Error getting communities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get communities' },
      { status: 500 }
    );
  }
}

// POST - Create new community
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
    const { name, description, icon } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Community name is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    
    // Create community
    const result = await db.collection('communities').insertOne({
      name,
      description: description || '',
      icon: icon || null,
      adminId: userId,
      members: [userId],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Community created successfully',
      community: {
        id: result.insertedId.toString(),
        name,
        description: description || '',
        icon: icon || null
      }
    });

  } catch (error) {
    console.error('Error creating community:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create community' },
      { status: 500 }
    );
  }
}

// PUT - Update community
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
    const { id, name, description, icon } = body;

    if (!id || !name) {
      return NextResponse.json(
        { success: false, error: 'ID and name are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    const communityId = new mongoose.Types.ObjectId(id);
    
    // Verify user is admin of this community
    const community = await db.collection('communities').findOne({
      _id: communityId,
      adminId: userId
    });

    if (!community) {
      return NextResponse.json(
        { success: false, error: 'Community not found or access denied' },
        { status: 404 }
      );
    }

    // Update community
    await db.collection('communities').updateOne(
      { _id: communityId },
      {
        $set: {
          name,
          description: description || '',
          icon: icon || null,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Community updated successfully'
    });

  } catch (error) {
    console.error('Error updating community:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update community' },
      { status: 500 }
    );
  }
}

// DELETE - Delete community
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
        { success: false, error: 'Community ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    const communityId = new mongoose.Types.ObjectId(id);
    
    // Verify user is admin of this community
    const community = await db.collection('communities').findOne({
      _id: communityId,
      adminId: userId
    });

    if (!community) {
      return NextResponse.json(
        { success: false, error: 'Community not found or access denied' },
        { status: 404 }
      );
    }

    // Delete community
    await db.collection('communities').deleteOne({
      _id: communityId
    });

    // Delete all groups in this community
    await db.collection('groups').deleteMany({
      communityId: communityId
    });

    return NextResponse.json({
      success: true,
      message: 'Community deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting community:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete community' },
      { status: 500 }
    );
  }
}
