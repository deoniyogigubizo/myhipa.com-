import { NextResponse } from 'next/server';
import mongoose from 'mongoose';


export const dynamic = "force-dynamic";
// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://deoniyogisubizo:maiden410@myhipa.qkj7r5a.mongodb.net/hipa';

// Cache for database connection
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // feed, groups, questions
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    const db = await getDb();
    
    if (type === 'groups') {
      // Fetch community groups
      const groups = await db.collection('groups')
        .find({ status: 'active' })
        .project({
          _id: 1,
          name: 1,
          slug: 1,
          description: 1,
          coverImage: 1,
          memberCount: 1,
          type: 1,
          category: 1,
          createdAt: 1
        })
        .sort({ memberCount: -1 })
        .limit(limit)
        .toArray();
      
      return NextResponse.json({
        success: true,
        data: groups,
        count: groups.length
      });
    }
    
    if (type === 'questions') {
      // Fetch Q&A questions
      const questions = await db.collection('questions')
        .find({ status: 'published' })
        .project({
          _id: 1,
          title: 1,
          content: 1,
          author: 1,
          tags: 1,
          answerCount: 1,
          views: 1,
          createdAt: 1
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      
      return NextResponse.json({
        success: true,
        data: questions,
        count: questions.length
      });
    }
    
    // Default: fetch community posts/feed
    const posts = await db.collection('posts')
      .find({ status: 'published' })
      .project({
        _id: 1,
        type: 1,
        content: 1,
        author: 1,
        tags: 1,
        engagement: 1,
        visibility: 1,
        groupId: 1,
        createdAt: 1
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    
    // Get group names for posts with groupId
    if (posts.length > 0) {
      const groupIds = [...new Set(posts.map((p: Record<string, unknown>) => p.groupId).filter(Boolean))];
      if (groupIds.length > 0) {
        const groups = await db.collection('groups')
          .find({ _id: { $in: groupIds as any[] } })
          .project({ _id: 1, name: 1 })
          .toArray();
        
        const groupMap = new Map(groups.map((g: Record<string, unknown>) => [g._id?.toString(), g.name]));
        
        posts.forEach((post: Record<string, unknown>) => {
          if (post.groupId) {
            (post as Record<string, unknown>).groupName = groupMap.get(post.groupId?.toString());
          }
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      data: posts,
      count: posts.length
    });
    
  } catch (error) {
    console.error('Error fetching community data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch community data' },
      { status: 500 }
    );
  }
}
