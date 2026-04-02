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

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Store slug is required' },
        { status: 400 }
      );
    }
    
    const db = await getDb();
    
    // Find store by slug or storeName (without kycStatus filter for flexibility)
    const store = await db.collection('sellers').findOne({
      $or: [
        { 'store.slug': slug },
        { 'store.storeName': { $regex: `^${slug}$`, $options: 'i' } },
        { 'store.name': { $regex: `^${slug}$`, $options: 'i' } }
      ]
    });
    
    if (!store) {
      return NextResponse.json(
        { success: false, error: 'Store not found' },
        { status: 404 }
      );
    }
    
    // Get user information
    const user = await db.collection('users').findOne(
      { _id: store.userId },
      { projection: { _id: 1, email: 1, profile: 1 } }
    );

    // Get products for this store
    const products = await db.collection('products')
      .find({ 
        sellerId: store._id,
        status: 'active'
      })
      .project({
        _id: 1,
        title: 1,
        pricing: 1,
        media: 1,
        stats: 1,
        inventory: 1,
        slug: 1
      })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();
    
    // Get reviews for this store
    const reviews = await db.collection('reviews')
      .find({ sellerId: store._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    // Get community posts for this store
    const communityPosts = await db.collection('community_posts')
      .find({ authorId: store._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    // Calculate stats
    const totalProducts = await db.collection('products')
      .countDocuments({ sellerId: store._id, status: 'active' });
    
    const totalReviews = await db.collection('reviews')
      .countDocuments({ sellerId: store._id });
    
    // Calculate average rating
    const ratingAgg = await db.collection('reviews')
      .aggregate([
        { $match: { sellerId: store._id } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ])
      .toArray();
    
    const avgRating = ratingAgg.length > 0 ? ratingAgg[0].avgRating : 0;
    
    return NextResponse.json({
      success: true,
      data: {
        store: {
          id: store._id.toString(),
          name: store.store?.storeName || store.store?.name || 'Store',
          slug: store.store?.slug || slug,
          logo: store.store?.logo || '/placeholder-logo.png',
          banner: store.store?.banner || '/placeholder-banner.png',
          bio: store.store?.bio || '',
          rating: avgRating,
          reviewCount: totalReviews,
          totalSales: store.stats?.totalSales || 0,
          responseRate: store.stats?.responseRate || 0,
          responseTime: store.stats?.responseTime || 'N/A',
          joinedDate: store.createdAt ? new Date(store.createdAt as string).getFullYear().toString() : 'N/A',
          location: store.store?.location || store.store?.address || 'Location not specified',
          verified: store.kycStatus === 'verified',
          badges: store.store?.badges || [],
          categories: store.store?.categories || []
        },
        products: products.map((p: any) => ({
          id: p._id?.toString(),
          title: p.title,
          price: p.pricing?.base || 0,
          image: Array.isArray(p.media) && p.media.length > 0 ? p.media[0].url : '/placeholder-product.png',
          rating: p.stats?.avgRating || 0,
          stock: p.inventory?.totalStock || 0,
          slug: p.slug
        })),
        reviews: reviews.map((r: any) => ({
          id: r._id?.toString(),
          author: r.authorName || 'Anonymous',
          avatar: r.authorAvatar || '/placeholder-avatar.png',
          rating: r.rating || 0,
          date: r.createdAt ? new Date(r.createdAt as string).toISOString().split('T')[0] : '',
          content: r.content || '',
          helpful: r.helpfulCount || 0
        })),
        communityPosts: communityPosts.map((p: any) => ({
          id: p._id?.toString(),
          author: {
            name: store.store?.storeName || store.store?.name || 'Store',
            avatar: store.store?.logo || '/placeholder-logo.png'
          },
          content: p.content || '',
          likes: p.likesCount || 0,
          comments: p.commentsCount || 0,
          time: p.createdAt ? getTimeAgo(new Date(p.createdAt as string)) : ''
        })),
        user: user ? {
          id: user._id.toString(),
          email: user.email,
          displayName: user.profile?.displayName || user.email.split('@')[0],
          avatar: user.profile?.avatar
        } : null
      }
    });
    
  } catch (error) {
    console.error('Error fetching store:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch store' },
      { status: 500 }
    );
  }
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;
  return `${Math.floor(seconds / 31536000)} years ago`;
}
