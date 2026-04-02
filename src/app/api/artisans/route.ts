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
    bufferCommands: false,
  };
  
  const conn = await mongoose.connect(MONGODB_URI, opts);
  cachedConn = conn.connection;
  return cachedConn;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const region = searchParams.get('region');
    
    const db = await getDb();
    
    // Build query for artisan stories (sellers with stories/bio)
    const query: Record<string, unknown> = {
      kycStatus: 'verified',
      $or: [
        { 'store.bio': { $exists: true, $ne: '' } },
        { 'store.story': { $exists: true, $ne: '' } }
      ]
    };
    
    // Filter by region if specified
    if (region) {
      query['store.location'] = { $regex: region, $options: 'i' };
    }
    
    // Fetch artisan sellers with stories
    const artisans = await db.collection('sellers')
      .find(query)
      .project({
        _id: 1,
        store: 1,
        tier: 1,
        stats: 1,
        verifiedAt: 1,
        createdAt: 1
      })
      .limit(limit)
      .toArray();
    
    // If no artisans found, return featured sellers as fallback
    if (artisans.length === 0) {
      const fallbackSellers = await db.collection('sellers')
        .find({ kycStatus: 'verified' })
        .project({
          _id: 1,
          store: 1,
          tier: 1,
          stats: 1,
          verifiedAt: 1,
          createdAt: 1
        })
        .limit(limit)
        .toArray();
      
      return NextResponse.json({
        success: true,
        data: fallbackSellers,
        count: fallbackSellers.length
      });
    }
    
    return NextResponse.json({
      success: true,
      data: artisans,
      count: artisans.length
    });
    
  } catch (error) {
    console.error('Error fetching artisan stories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch artisan stories' },
      { status: 500 }
    );
  }
}
