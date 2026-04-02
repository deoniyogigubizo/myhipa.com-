import { ObjectId } from 'mongodb';
import connectDB from '@/lib/database/mongodb';
import { UserProfileAI, UserEvent } from '@/lib/database/schemas/ai.schema';
import { Product } from '@/lib/database/schemas/product.schema';
import { cosineSimilarity } from './embedding';
import type { ILookalikeAudience, IRetargetingEntry, IPacingStatus, ITrafficCurve } from '@/types/ai';

// ============================================
// TARGETING ENGINE (Part 7)
// ============================================

/**
 * Get users for retargeting based on product views
 */
export async function getRetargetingUsers(
  productId: ObjectId,
  options: {
    excludePurchased?: boolean;
    maxImpressions?: number;
    limit?: number;
  } = {}
): Promise<IRetargetingEntry[]> {
  await connectDB();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get users who viewed this product
  const views = await UserEvent.aggregate([
    {
      $match: {
        event: 'product_view',
        'entity.type': 'product',
        'entity.id': productId,
        ts: { $gte: sevenDaysAgo }
      }
    },
    {
      $group: {
        _id: '$userId',
        viewCount: { $sum: 1 },
        lastSeen: { $max: '$ts' }
      }
    },
    { $sort: { viewCount: -1 } },
    { $limit: options.limit || 1000 }
  ]);

  // Get users who already purchased
  const purchasedQuery: Record<string, unknown> = {
    event: 'purchase',
    'entity.type': 'product',
    'entity.id': productId
  };

  const purchasedUsers = options.excludePurchased
    ? await UserEvent.distinct('userId', purchasedQuery)
    : [];

  // Filter out purchased users and build retargeting entries
  const retargeting: IRetargetingEntry[] = views
    .filter(v => !purchasedUsers.includes(v._id))
    .map(v => ({
      userId: v._id as ObjectId,
      productId,
      impressions: v.viewCount,
      lastSeen: v.lastSeen,
      exclude: false
    }));

  // Apply impression cap
  if (options.maxImpressions) {
    return retargeting
      .filter(r => r.impressions <= options.maxImpressions!)
      .slice(0, options.limit || 1000);
  }

  return retargeting.slice(0, options.limit || 1000);
}

/**
 * Create lookalike audience from seed users (past buyers)
 */
export async function createLookalikeAudience(
  sellerId: ObjectId,
  options: {
    seedUserCount?: number;
    lookalikeCount?: number;
  } = {}
): Promise<ILookalikeAudience> {
  await connectDB();

  // Get past buyers of this seller
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const purchases = await UserEvent.distinct('userId', {
    event: 'purchase',
    'entity.type': 'product',
    ts: { $gte: thirtyDaysAgo }
  });

  // Get actual seller products and their sellerId
  const { Order } = await import('@/lib/database/schemas/order.schema');
  
  const sellerOrders = await Order.find({
    sellerId,
    status: 'completed'
  })
  .select('buyerId')
  .limit(options.seedUserCount || 50)
  .lean();

  const seedUserIds = [...new Set(sellerOrders.map(o => o.buyerId))];

  if (seedUserIds.length === 0) {
    return {
      sellerId,
      sourceUserIds: [],
      lookalikeUserIds: [],
      similarity: 0,
      createdAt: new Date()
    };
  }

  // Get embeddings for seed users
  const seedProfiles = await UserProfileAI.find({
    userId: { $in: seedUserIds },
    embeddingVector: { $exists: true, $ne: [] }
  }).lean();

  if (seedProfiles.length === 0) {
    return {
      sellerId,
      sourceUserIds: seedUserIds,
      lookalikeUserIds: [],
      similarity: 0,
      createdAt: new Date()
    };
  }

  // Average the seed embeddings
  const avgSeedEmbedding = seedProfiles
    .map(p => p.embeddingVector)
    .reduce((acc, vec) => acc.map((v, i) => v + (vec[i] || 0)), new Array(1536).fill(0))
    .map(v => v / seedProfiles.length);

  // Find nearest neighbors among all users
  const allUsers = await UserProfileAI.find({
    userId: { $nin: seedUserIds },
    embeddingVector: { $exists: true, $ne: [] }
  })
  .select('userId embeddingVector')
  .limit(10000)
  .lean();

  const similarities = allUsers
    .map(u => ({
      userId: u.userId,
      similarity: cosineSimilarity(avgSeedEmbedding, u.embeddingVector || [])
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, options.lookalikeCount || 100);

  return {
    sellerId,
    sourceUserIds: seedUserIds,
    lookalikeUserIds: similarities.map(s => s.userId),
    similarity: similarities[0]?.similarity || 0,
    createdAt: new Date()
  };
}

/**
 * Build interest segments for a user based on their behavior
 */
export async function buildUserInterestSegments(userId: ObjectId): Promise<string[]> {
  await connectDB();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get user's category views
  const categoryViews = await UserEvent.aggregate([
    {
      $match: {
        userId,
        event: { $in: ['product_view', 'add_to_cart', 'purchase'] },
        ts: { $gte: thirtyDaysAgo }
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: 'entity.id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $group: {
        _id: '$product.category.primary',
        count: { $sum: 1 },
        purchaseCount: {
          $sum: { $cond: [{ $eq: ['$event', 'purchase'] }, 1, 0] }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Map categories to interest segments
  const segmentMap: Record<string, string[]> = {
    'smartphones': ['tech_enthusiast', 'gadget_guru'],
    'laptops': ['tech_enthusiast', 'gadget_guru'],
    'electronics': ['tech_enthusiast', 'gadget_guru'],
    'fashion': ['fashion_shopper'],
    'clothing': ['fashion_shopper'],
    'beauty': ['beauty_paragon'],
    'home': ['home_decor_buyer'],
    'furniture': ['home_decor_buyer'],
    'sports': ['sports_lover', 'fitness_fanatic'],
    'fitness': ['fitness_fanatic'],
    'books': ['bookworm'],
    'gaming': ['gamer'],
    'toys': ['parenting_pro'],
    'baby': ['parenting_pro'],
    'food': ['foodie'],
    'travel': ['traveler']
  };

  const segments = new Set<string>();

  for (const cat of categoryViews) {
    const mapped = segmentMap[cat._id?.toString() || ''];
    if (mapped) {
      mapped.forEach(s => segments.add(s));
    }
  }

  // Add deal hunter if user often looks at discounted items
  const discountedViews = await UserEvent.countDocuments({
    userId,
    event: 'product_view',
    'context.query': { $regex: 'discount|sale|offer', $options: 'i' },
    ts: { $gte: thirtyDaysAgo }
  });

  if (discountedViews > 5) {
    segments.add('deal_hunter');
  }

  return Array.from(segments);
}

// ============================================
// BUDGET PACING (Part 8)
// ============================================

// Pre-computed traffic curve for Rwanda (hourly weights)
const TRAFFIC_CURVE: ITrafficCurve[] = [
  { hour: 0, weight: 0.02 }, { hour: 1, weight: 0.01 }, { hour: 2, weight: 0.01 },
  { hour: 3, weight: 0.01 }, { hour: 4, weight: 0.01 }, { hour: 5, weight: 0.02 },
  { hour: 6, weight: 0.03 }, { hour: 7, weight: 0.05 }, { hour: 8, weight: 0.07 },
  { hour: 9, weight: 0.08 }, { hour: 10, weight: 0.07 }, { hour: 11, weight: 0.06 },
  { hour: 12, weight: 0.05 }, { hour: 13, weight: 0.05 }, { hour: 14, weight: 0.06 },
  { hour: 15, weight: 0.06 }, { hour: 16, weight: 0.05 }, { hour: 17, weight: 0.05 },
  { hour: 18, weight: 0.05 }, { hour: 19, weight: 0.05 }, { hour: 20, weight: 0.05 },
  { hour: 21, weight: 0.04 }, { hour: 22, weight: 0.03 }, { hour: 23, weight: 0.02 }
];

/**
 * Check if ad should be served based on pacing
 */
export function shouldServeAd(
  campaign: {
    budget: { daily: number; spent: number };
  },
  currentHour?: number
): IPacingStatus {
  const hour = currentHour ?? new Date().getHours();
  
  // Get traffic weight for current hour
  const hourData = TRAFFIC_CURVE.find(t => t.hour === hour);
  const trafficWeight = hourData?.weight || 0.04; // Default to average

  // Expected spend by now
  const expectedSpend = campaign.budget.daily * trafficWeight;
  const actualSpend = campaign.budget.spent;

  // Calculate variance
  const variance = actualSpend - expectedSpend;

  // Allow 10% tolerance
  const shouldServe = actualSpend <= expectedSpend * 1.1;

  // Suggest bid adjustment if overspending/underspending
  let suggestedBidAdjustment: number | undefined;
  if (actualSpend > expectedSpend * 1.2) {
    suggestedBidAdjustment = -0.1; // Reduce bid by 10%
  } else if (actualSpend < expectedSpend * 0.5 && expectedSpend > 0) {
    suggestedBidAdjustment = 0.1; // Increase bid by 10%
  }

  return {
    campaignId: new ObjectId(), // Would be passed in
    expectedSpend,
    actualSpend,
    variance,
    shouldServe,
    suggestedBidAdjustment
  };
}

/**
 * Get traffic weight for a specific hour
 */
export function getTrafficWeight(hour: number): number {
  const hourData = TRAFFIC_CURVE.find(t => t.hour === hour);
  return hourData?.weight || 0.04;
}

/**
 * Calculate daily spend projection
 */
export function projectDailySpend(
  hourlySpend: number[],
  campaignId: ObjectId
): { projectedTotal: number; onTrack: boolean; suggestions: string[] } {
  const currentHour = new Date().getHours();
  const todayHourlyWeights = TRAFFIC_CURVE.slice(0, currentHour + 1);
  
  // Calculate expected spend so far
  const expectedSoFar = todayHourlyWeights.reduce((sum, t) => sum + t.weight, 0);
  
  // Current actual spend
  const actualSoFar = hourlySpend.slice(0, currentHour + 1).reduce((a, b) => a + b, 0);

  // Project full day spend
  const currentRate = currentHour > 0 ? actualSoFar / currentHour : 0;
  const projectedTotal = currentRate * 24;

  const suggestions: string[] = [];

  if (actualSoFar > expectedSoFar * 1.2) {
    suggestions.push('Campaign is spending faster than expected. Consider reducing bid to stretch budget.');
  } else if (actualSoFar < expectedSoFar * 0.5 && expectedSoFar > 0) {
    suggestions.push('Campaign is underspending. Consider increasing bid or reviewing targeting.');
  }

  return {
    projectedTotal,
    onTrack: Math.abs(actualSoFar - expectedSoFar) / expectedSoFar < 0.2,
    suggestions
  };
}

