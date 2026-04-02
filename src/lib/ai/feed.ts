import { ObjectId } from 'mongodb';
import connectDB from '@/lib/database/mongodb';
import { UserProfileAI } from '@/lib/database/schemas/ai.schema';
import { Product } from '@/lib/database/schemas/product.schema';
import { Post } from '@/lib/database/schemas/community';
import { cosineSimilarity, generateTextEmbedding } from './embedding';
import type { IFeedScore, IFeedItemRanking } from '@/types/ai';
import type { IProduct, IPost } from '@/types';

// ============================================
// FEED RANKING ALGORITHM (Part 3)
// ============================================

// Feed score weights from Part 3
const WEIGHTS = {
  relevance: 0.40,
  recency: 0.25,
  engagement: 0.20,
  trust: 0.10,
  adBoost: 0.05
};

/**
 * Calculate feed score for a product
 */
export async function calculateProductFeedScore(
  product: IProduct & { embeddingVector?: number[] },
  userEmbedding?: number[],
  userId?: ObjectId | null
): Promise<IFeedScore> {
  // 1. Relevance Score (0-1) - cosine similarity between user and product embeddings
  let relevanceScore = 0;
  if (userEmbedding && product.embeddingVector) {
    relevanceScore = cosineSimilarity(userEmbedding, product.embeddingVector);
    // Normalize to 0-1 (cosine can be -1 to 1)
    relevanceScore = (relevanceScore + 1) / 2;
  }

  // 2. Recency Score - decays over time
  const hoursOld = (Date.now() - product.createdAt.getTime()) / (1000 * 60 * 60);
  const recencyScore = 1 / (1 + hoursOld * 0.1);

  // 3. Engagement Score - normalized likes + comments + shares + CTR
  const engagementScore = calculateEngagementScore(product.stats);

  // 4. Trust Score - seller reputation and KYC status
  const trustScore = await calculateSellerTrustScore(product.sellerId);

  // 5. AdBoost Score - if product has active ad campaign (would check ad system)
  const adBoostScore = 0; // Placeholder - would integrate with ad system

  // Calculate total score
  const totalScore = 
    (relevanceScore * WEIGHTS.relevance) +
    (recencyScore * WEIGHTS.recency) +
    (engagementScore * WEIGHTS.engagement) +
    (trustScore * WEIGHTS.trust) +
    (adBoostScore * WEIGHTS.adBoost);

  return {
    relevanceScore,
    recencyScore,
    engagementScore,
    trustScore,
    adBoostScore,
    totalScore
  };
}

/**
 * Calculate feed score for a post
 */
export async function calculatePostFeedScore(
  post: IPost,
  userEmbedding?: number[],
  userId?: ObjectId | null
): Promise<IFeedScore> {
  // For posts, relevance would be based on:
  // - Author followed by user
  // - Group membership
  // - Interest segment matching
  
  let relevanceScore = 0.5; // Default for cold start
  if (userEmbedding) {
    // Would calculate post embedding and compare
    // For now, use base score
  }

  // Recency
  const hoursOld = (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60);
  const recencyScore = 1 / (1 + hoursOld * 0.1);

  // Engagement
  const engagementScore = calculatePostEngagementScore(post.engagement);

  // Trust (author reputation)
  const trustScore = await calculateUserTrustScore(post.authorId);

  // AdBoost
  const adBoostScore = post.boosted ? 0.05 : 0;

  const totalScore = 
    (relevanceScore * WEIGHTS.relevance) +
    (recencyScore * WEIGHTS.recency) +
    (engagementScore * WEIGHTS.engagement) +
    (trustScore * WEIGHTS.trust) +
    (adBoostScore * WEIGHTS.adBoost);

  return {
    relevanceScore,
    recencyScore,
    engagementScore,
    trustScore,
    adBoostScore,
    totalScore
  };
}

/**
 * Calculate engagement score from product stats
 */
function calculateEngagementScore(stats: IProduct['stats']): number {
  const views = stats.views || 1;
  const clicks = stats.addedToCart || 0;
  const purchases = stats.purchased || 0;
  const wishlist = stats.wishlistCount || 0;
  const reviews = stats.reviewCount || 0;
  
  // Normalize: combine signals with weights
  const rawScore = 
    (clicks * 3) +    // Cart intent is strong
    (purchases * 10) + // Purchase is strongest
    (wishlist * 2) +
    (reviews * 5);
  
  // Normalize to 0-1 using log scale
  return Math.min(1, Math.log10(rawScore + 1) / 4);
}

/**
 * Calculate engagement score for post
 */
function calculatePostEngagementScore(engagement: IPost['engagement']): number {
  const likes = engagement.likes || 0;
  const comments = engagement.commentCount || 0;
  const shares = engagement.shareCount || 0;
  const views = engagement.viewCount || 1;
  
  // CTR-like metric
  const ctr = (likes + comments + shares) / views;
  
  // Normalize
  return Math.min(1, ctr * 10);
}

/**
 * Calculate seller trust score
 */
async function calculateSellerTrustScore(sellerId: ObjectId): Promise<number> {
  await connectDB();
  
  const { Seller } = await import('@/lib/database/schemas/seller.schema');
  const seller = await Seller.findById(sellerId).select('stats kycStatus verifiedAt').lean();
  
  if (!seller) return 0.3; // Default low trust

  // Rating factor (0-0.5 based on 0-5 rating)
  const ratingFactor = (seller.stats?.avgRating || 0) / 10;
  
  // Review count factor (0-0.25, more reviews = more trust)
  const reviewCountFactor = Math.min(0.25, (seller.stats?.reviewCount || 0) / 100);
  
  // KYC bonus (0-0.15)
  const kycBonus = seller.kycStatus === 'verified' ? 0.15 : 0;
  
  // Verified bonus (0-0.1)
  const verifiedBonus = seller.verifiedAt ? 0.1 : 0;
  
  // Base trust
  const baseTrust = 0.3;
  
  return Math.min(1, baseTrust + ratingFactor + reviewCountFactor + kycBonus + verifiedBonus);
}

/**
 * Calculate user trust score for post authors
 */
async function calculateUserTrustScore(userId: ObjectId): Promise<number> {
  await connectDB();
  
  const { User } = await import('@/lib/database/schemas/user.schema');
  const user = await User.findById(userId).select('reputation kycStatus').lean();
  
  if (!user) return 0.3;

  // Reputation score factor (0-0.6)
  const repScore = (user.reputation?.score || 0) / 100;
  
  // KYC bonus
  const kycBonus = user.kycStatus === 'verified' ? 0.2 : 0;
  
  // Badge bonus
  const badgeBonus = Math.min(0.2, (user.reputation?.badges?.length || 0) * 0.05);
  
  return Math.min(1, 0.3 + repScore * 0.6 + kycBonus + badgeBonus);
}

/**
 * Get personalized feed for user
 */
export async function getPersonalizedFeed(
  userId?: ObjectId | null,
  options: {
    type?: 'home' | 'community' | 'mixed';
    limit?: number;
    category?: string;
  } = {}
): Promise<IFeedItemRanking[]> {
  await connectDB();

  const limit = options.limit || 20;
  let userEmbedding: number[] | undefined;
  let userProfile: { topCategories?: string[]; coldStart?: boolean; trendingCategories?: string[]; trendingProducts?: any[] } | undefined;

  // Get user profile and embedding if logged in
  if (userId) {
    const profile = await UserProfileAI.findOne({ userId })
      .select('embeddingVector topCategories coldStart trendingCategories trendingProducts')
      .lean();
    
    userProfile = profile ?? undefined;
    
    if (profile && profile.embeddingVector) {
      userEmbedding = profile.embeddingVector;
    }
  }

  const isColdStart = !userId || !userEmbedding || (userProfile?.coldStart ?? false);

  // Get candidate items
  const candidates = await getFeedCandidates(options.type || 'home', {
    category: options.category,
    limit: 200, // Get more candidates than needed for re-ranking
    coldStart: isColdStart,
    topCategories: userProfile?.topCategories,
    trendingCategories: userProfile?.trendingCategories,
    trendingProducts: userProfile?.trendingProducts
  });

  // Score and rank each candidate
  const scoredItems: IFeedItemRanking[] = [];

  for (const candidate of candidates) {
    if (candidate.type === 'product') {
      const score = await calculateProductFeedScore(
        candidate.item as IProduct & { embeddingVector?: number[] },
        userEmbedding,
        userId
      );
      scoredItems.push({
        itemId: candidate.item._id,
        itemType: 'product',
        feedScore: score,
        reasons: generateScoreReasons(score)
      });
    } else if (candidate.type === 'post') {
      const score = await calculatePostFeedScore(
        candidate.item as IPost,
        userEmbedding,
        userId
      );
      scoredItems.push({
        itemId: candidate.item._id,
        itemType: 'post',
        feedScore: score,
        reasons: generateScoreReasons(score)
      });
    }
  }

  // Sort by total score descending
  scoredItems.sort((a, b) => b.feedScore.totalScore - a.feedScore.totalScore);

  return scoredItems.slice(0, limit);
}

/**
 * Get candidate items for feed
 */
async function getFeedCandidates(
  feedType: 'home' | 'community' | 'mixed',
  options: {
    category?: string;
    limit: number;
    coldStart: boolean;
    topCategories?: string[];
    trendingCategories?: string[];
    trendingProducts?: ObjectId[];
  }
): Promise<{ type: 'product' | 'post'; item: IProduct | IPost }[]> {
  const candidates: { type: 'product' | 'post'; item: IProduct | IPost }[] = [];

  if (feedType === 'home' || feedType === 'mixed') {
    // Get products
    const productQuery: Record<string, unknown> = {
      status: 'active',
      'inventory.totalStock': { $gt: 0 }
    };

    if (options.category) {
      productQuery['category.primary'] = options.category;
    } else if (options.coldStart) {
      // Use trending/popular for cold start
      if (options.trendingCategories?.length) {
        productQuery['category.primary'] = { $in: options.trendingCategories };
      }
    } else if (options.topCategories?.length) {
      productQuery['category.primary'] = { $in: options.topCategories };
    }

    const products = await Product.find(productQuery)
      .sort({ createdAt: -1 })
      .limit(options.limit)
      .lean();

    candidates.push(...products.map(p => ({ type: 'product' as const, item: p })));
  }

  if (feedType === 'community' || feedType === 'mixed') {
    // Get posts
    const posts = await (Post as any).find({ status: 'published' })
      .sort({ createdAt: -1 })
      .limit(Math.floor(options.limit / 2))
      .lean();

    candidates.push(...posts.map((p: any) => ({ type: 'post' as const, item: p })));
  }

  return candidates.slice(0, options.limit);
}

/**
 * Generate human-readable reasons for the score
 */
function generateScoreReasons(score: IFeedScore): string[] {
  const reasons: string[] = [];

  if (score.relevanceScore > 0.7) {
    reasons.push('Matches your interests');
  }
  if (score.recencyScore > 0.7) {
    reasons.push('Recently posted');
  }
  if (score.engagementScore > 0.5) {
    reasons.push('Popular in community');
  }
  if (score.trustScore > 0.7) {
    reasons.push('Trusted seller');
  }
  if (score.adBoostScore > 0) {
    reasons.push('Sponsored');
  }

  return reasons;
}

/**
 * Get cold start feed for new users
 */
export async function getColdStartFeed(
  location?: { city?: string; country?: string },
  limit: number = 20
): Promise<IFeedItemRanking[]> {
  // Fall back to: city-level trending, category popularity, globally top-rated
  
  // Get trending products (mock - would be computed from events)
  const trendingProducts = await Product.find({
    status: 'active',
    'inventory.totalStock': { $gt: 0 }
  })
  .sort({ 'stats.views': -1 })
  .limit(limit)
  .lean();

  // Get top-rated products
  const topRatedProducts = await Product.find({
    status: 'active',
    'inventory.totalStock': { $gt: 0 },
    'stats.avgRating': { $gte: 4.5 },
    'stats.reviewCount': { $gte: 5 }
  })
  .sort({ 'stats.avgRating': -1, 'stats.reviewCount': -1 })
  .limit(limit)
  .lean();

  // Combine and deduplicate
  const allProducts = [...trendingProducts, ...topRatedProducts];
  const seen = new Set();
  const unique = allProducts.filter(p => {
    if (seen.has(p._id.toString())) return false;
    seen.add(p._id.toString());
    return true;
  });

  // Score them uniformly (no personalization yet)
  const results: IFeedItemRanking[] = unique.slice(0, limit).map(product => ({
    itemId: product._id,
    itemType: 'product' as const,
    feedScore: {
      relevanceScore: 0.5,
      recencyScore: 0.5,
      engagementScore: calculateEngagementScore(product.stats),
      trustScore: 0.5,
      adBoostScore: 0,
      totalScore: 0.5
    },
    reasons: ['Trending', 'Top rated'].slice(0, 1)
  }));

  return results;
}
