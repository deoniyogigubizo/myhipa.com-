import { ObjectId } from 'mongodb';
import connectDB from '@/lib/database/mongodb';
import { AdImpression, AdClick } from '@/lib/database/schemas/ai.schema';
import { UserEvent } from '@/lib/database/schemas/ai.schema';
import type { IAdRank, IAuctionResult } from '@/types/ai';
import type { IAdCampaign } from '@/types';

// ============================================
// AD AUCTION ENGINE (Part 6 - Second-Price Auction)
// ============================================

// Ad campaign model weights
const QUALITY_WEIGHTS = {
  ctr: 0.40,
  relevance: 0.35,
  landingPage: 0.25
};

/**
 * Run ad auction for a given context
 */
export async function runAdAuction(
  context: {
    query?: string;
    category?: string;
    location?: string;
    userId?: ObjectId | null;
    interestSegments?: string[];
    position: number;
    adSlot: string;
  },
  activeCampaigns: IAdCampaign[]
): Promise<IAuctionResult | null> {
  if (activeCampaigns.length === 0) return null;

  // Filter campaigns by targeting criteria
  const eligibleCampaigns = filterEligibleCampaigns(activeCampaigns, context);

  if (eligibleCampaigns.length === 0) return null;

  // Calculate AdRank for each campaign
  const rankedCampaigns: IAdRank[] = [];

  for (const campaign of eligibleCampaigns) {
    const rank = await calculateAdRank(campaign, context);
    rankedCampaigns.push(rank);
  }

  // Sort by AdRank descending
  rankedCampaigns.sort((a, b) => b.finalRank - a.finalRank);

  // Get winner and runner-up
  const winner = rankedCampaigns[0];
  const runnerUp = rankedCampaigns[1];

  if (!winner) return null;

  // Calculate winning price (second-price auction)
  const actualCPC = runnerUp 
    ? (runnerUp.finalRank / winner.qualityScore) + 0.01
    : winner.bidAmount;

  // Record impression
  await recordAdImpression({
    campaignId: winner.campaignId,
    userId: context.userId ?? null,
    sessionId: '', // Would be passed from request
    adRank: winner.finalRank,
    qualityScore: winner.qualityScore,
    actualCPC,
    position: context.position
  });

  return {
    campaignId: winner.campaignId,
    rank: 1,
    winningBid: winner.bidAmount,
    actualCPC: Math.round(actualCPC * 100) / 100,
    impressionsToday: 0 // Would be fetched
  };
}

/**
 * Filter campaigns by targeting criteria
 */
function filterEligibleCampaigns(
  campaigns: IAdCampaign[],
  context: {
    query?: string;
    category?: string;
    location?: string;
    userId?: ObjectId | null;
    interestSegments?: string[];
  }
): IAdCampaign[] {
  return campaigns.filter(campaign => {
    const targeting = campaign.targeting;

    // Check if campaign is active
    if (campaign.schedule.status !== 'active') return false;
    
    // Check if within budget
    if (campaign.budget.spent >= campaign.budget.daily) return false;

    // Check category targeting
    if (targeting.categories?.length) {
      if (!context.category || !targeting.categories.includes(context.category)) {
        return false;
      }
    }

    // Check location targeting
    if (targeting.locations?.length) {
      if (!context.location || !targeting.locations.includes(context.location)) {
        return false;
      }
    }

    // Check interest targeting
    if (targeting.interests?.length && targeting.audienceType === 'broad') {
      if (!context.interestSegments?.some(i => targeting.interests?.includes(i))) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Calculate AdRank for a campaign
 */
async function calculateAdRank(
  campaign: IAdCampaign,
  context: {
    query?: string;
    category?: string;
    userId?: ObjectId | null;
  }
): Promise<IAdRank> {
  // Get historical CTR
  const ctrHistorical = await getCampaignCTR(campaign._id);

  // Calculate relevance score (embedding similarity)
  const relevanceScore = await calculateRelevanceScore(campaign, context);

  // Calculate landing page score
  const landingPageScore = await calculateLandingPageScore(campaign.sellerId);

  // Calculate quality score
  const qualityScore = 
    (ctrHistorical * QUALITY_WEIGHTS.ctr) +
    (relevanceScore * QUALITY_WEIGHTS.relevance) +
    (landingPageScore * QUALITY_WEIGHTS.landingPage);

  // Calculate final rank
  const finalRank = campaign.budget.bidAmount * qualityScore;

  return {
    campaignId: campaign._id,
    bidAmount: campaign.budget.bidAmount,
    qualityScore,
    ctrHistorical,
    relevanceScore,
    landingPageScore,
    finalRank
  };
}

/**
 * Get campaign's historical CTR
 */
async function getCampaignCTR(campaignId: ObjectId): Promise<number> {
  await connectDB();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get impressions and clicks
  const [impressions, clicks] = await Promise.all([
    AdImpression.countDocuments({
      campaignId,
      ts: { $gte: sevenDaysAgo }
    }),
    AdClick.countDocuments({
      campaignId,
      ts: { $gte: sevenDaysAgo }
    })
  ]);

  if (impressions === 0) {
    return 0.02; // Baseline CTR for new ads
  }

  return clicks / impressions;
}

/**
 * Calculate relevance score using embeddings
 */
async function calculateRelevanceScore(
  campaign: IAdCampaign,
  context: {
    query?: string;
    category?: string;
  }
): Promise<number> {
  // If we have a query, calculate relevance based on product similarity
  // This would use embeddings in production
  
  if (context.query && campaign.creative.productId) {
    // Check if product matches query
    // Placeholder: return random score
    return 0.5 + Math.random() * 0.3;
  }

  // If category matches
  if (context.category && campaign.targeting.categories?.includes(context.category)) {
    return 0.8;
  }

  return 0.5;
}

/**
 * Calculate landing page score based on seller metrics
 */
async function calculateLandingPageScore(sellerId: ObjectId): Promise<number> {
  await connectDB();

  const { Seller } = await import('@/lib/database/schemas/seller.schema');
  const seller = await Seller.findById(sellerId).select('stats kycStatus verifiedAt').lean();

  if (!seller) return 0.3;

  // Rating factor (0-0.5)
  const ratingFactor = (seller.stats?.avgRating || 0) / 10;

  // Response time factor (0-0.25)
  const responseFactor = Math.min(0.25, (seller.stats?.avgResponseTimeMin || 60) / 240);

  // Store completion factor (0-0.15) - placeholder
  const completionFactor = 0.1;

  // KYC bonus (0-0.1)
  const kycBonus = seller.kycStatus === 'verified' ? 0.1 : 0;

  const score = Math.min(1, 0.3 + ratingFactor + responseFactor + completionFactor + kycBonus);
  return score;
}

/**
 * Record an ad impression
 */
export async function recordAdImpression(
  impression: {
    campaignId: ObjectId;
    userId?: ObjectId | null;
    sessionId: string;
    adRank: number;
    qualityScore: number;
    actualCPC: number;
    position: number;
  }
): Promise<void> {
  await connectDB();

  await AdImpression.create({
    campaignId: impression.campaignId,
    userId: impression.userId || null,
    sessionId: impression.sessionId,
    adRank: impression.adRank,
    qualityScore: impression.qualityScore,
    actualCPC: impression.actualCPC,
    position: impression.position,
    ts: new Date()
  });

  // Update campaign stats (would be done async in production)
  // await AdCampaign.updateOne(
  //   { _id: impression.campaignId },
  //   { $inc: { 'performance.impressions': 1 } }
  // );
}

/**
 * Record an ad click
 */
export async function recordAdClick(
  impressionId: ObjectId,
  userId?: ObjectId | null
): Promise<void> {
  await connectDB();

  const impression = await AdImpression.findById(impressionId);
  if (!impression) return;

  await AdClick.create({
    impressionId,
    campaignId: impression.campaignId,
    userId: userId || null,
    ts: new Date()
  });

  // Track click event
  await UserEvent.create({
    userId: userId || null,
    sessionId: '',
    event: 'ad_click',
    entity: { type: 'ad', id: impression.campaignId },
    context: { page: '', source: 'ad' },
    device: 'mobile',
    location: { city: '', country: '' },
    ts: new Date()
  });
}

/**
 * Get auction statistics for a campaign
 */
export async function getAuctionStats(
  campaignId: ObjectId,
  days: number = 7
): Promise<{
  totalImpressions: number;
  totalClicks: number;
  avgCTR: number;
  avgCPC: number;
  totalSpend: number;
}> {
  await connectDB();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [impressions, clicks, impressionData] = await Promise.all([
    AdImpression.countDocuments({ campaignId, ts: { $gte: startDate } }),
    AdClick.countDocuments({ campaignId, ts: { $gte: startDate } }),
    AdImpression.find({ campaignId, ts: { $gte: startDate } }).lean()
  ]);

  const totalSpend = impressionData.reduce((sum, i) => sum + (i.actualCPC || 0), 0);

  return {
    totalImpressions: impressions,
    totalClicks: clicks,
    avgCTR: impressions > 0 ? clicks / impressions : 0,
    avgCPC: clicks > 0 ? totalSpend / clicks : 0,
    totalSpend
  };
}
