import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');

    const db = await getDb();

    // Build match conditions
    const matchConditions: any = {
      suspendedAt: null, // Only active (not suspended) sellers
    };

    if (category) {
      matchConditions.categories = { $in: [category] };
    }

    if (location) {
      matchConditions['address.district'] = location;
    }

    const sellers = await db.collection('sellers')
      .aggregate([
        {
          $match: matchConditions
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: 'sellerId',
            as: 'products'
          }
        },
        {
          $addFields: {
            productCount: { $size: '$products' },
            avgRating: { $avg: '$products.stats.avgRating' }
          }
        },
        {
          $project: {
            _id: 1,
            businessName: '$store.name',
            slug: '$store.slug',
            logo: '$store.logo',
            banner: '$store.banner',
            description: '$store.bio',
            categories: '$store.categories',
            address: {
              district: '$store.location.city',
              sector: '$store.location.city'
            },
            contact: 1,
            socialLinks: 1,
            stats: {
              followers: { $ifNull: ['$stats.followerCount', 0] },
              products: '$productCount',
              rating: { $ifNull: ['$stats.avgRating', 0] }
            },
            tier: 1,
            createdAt: 1
          }
        },
        {
          $sort: { 'stats.followers': -1, createdAt: -1 }
        },
        {
          $skip: skip
        },
        {
          $limit: limit
        }
      ])
      .toArray();

    // Get total count for pagination
    const totalCount = await db.collection('sellers')
      .countDocuments(matchConditions);

    return NextResponse.json({
      success: true,
      data: sellers,
      pagination: {
        total: totalCount,
        limit,
        skip,
        hasMore: skip + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Failed to fetch sellers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sellers' },
      { status: 500 }
    );
  }
}