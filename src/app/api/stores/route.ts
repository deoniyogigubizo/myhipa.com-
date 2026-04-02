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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const tier = searchParams.get('tier');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'stats.totalRevenue';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const skip = (page - 1) * limit;
    
    const db = await getDb();
    
    // Build query
    const query: Record<string, unknown> = { kycStatus: 'verified' };
    
    if (category) {
      query['store.categories'] = { $regex: category, $options: 'i' };
    }
    
    if (tier) {
      query.tier = tier;
    }
    
    if (search) {
      query.$or = [
        { 'store.name': { $regex: search, $options: 'i' } },
        { 'store.storeName': { $regex: search, $options: 'i' } },
        { 'store.bio': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await db.collection('sellers').countDocuments(query);
    
    // Fetch stores with pagination
    const stores = await db.collection('sellers')
      .find(query)
      .project({
        _id: 1,
        store: 1,
        tier: 1,
        stats: 1,
        verifiedAt: 1,
        createdAt: 1,
        kycStatus: 1
      })
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Get product counts for each store
    const storeIds = stores.map((s: Record<string, unknown>) => s._id);
    const productCounts = await db.collection('products')
      .aggregate([
        { $match: { sellerId: { $in: storeIds }, status: 'active' } },
        { $group: { _id: '$sellerId', count: { $sum: 1 } } }
      ]);
    
    const productCountMap = new Map(
      (await productCounts.toArray()).map((p: Record<string, unknown>) => [p._id.toString(), p.count])
    );
    
    // Enrich stores with product counts
    const enrichedStores = stores.map((store: Record<string, unknown>) => ({
      ...store,
      productCount: productCountMap.get(store._id?.toString() || '') || 0
    }));
    
    return NextResponse.json({
      success: true,
      data: enrichedStores,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stores' },
      { status: 500 }
    );
  }
}
