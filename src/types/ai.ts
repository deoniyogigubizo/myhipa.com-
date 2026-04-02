import { ObjectId } from 'mongodb';

// ============================================
// EVENT TYPES (Part 1 - Signal Collection)
// ============================================

export type HipaEventType = 
  | 'product_view'
  | 'product_click'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'purchase'
  | 'search_query'
  | 'search_no_results'
  | 'search_result_click'
  | 'seller_view'
  | 'seller_follow'
  | 'post_view'
  | 'post_like'
  | 'post_share'
  | 'review_read'
  | 'wishlist_add'
  | 'wishlist_remove'
  | 'ad_impression'
  | 'ad_click'
  | 'ad_conversion'
  | 'session_start'
  | 'session_end';

export type EventEntityType = 'product' | 'seller' | 'post' | 'review' | 'search' | 'ad' | 'category';

export interface IEventEntity {
  type: EventEntityType;
  id: ObjectId;
}

export interface IEventContext {
  page: string;
  query?: string;
  position?: number;
  source?: 'search' | 'feed' | 'recommendation' | 'ad' | 'direct';
}

export interface IEventLocation {
  city: string;
  country: string;
  coords?: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface IUserEvent {
  _id?: ObjectId;
  userId: ObjectId | null;  // null for guests
  sessionId: string;
  event: HipaEventType;
  entity: IEventEntity;
  context: IEventContext;
  device: DeviceType;
  location: IEventLocation;
  ts: Date;
  metadata?: Record<string, unknown>;
}

// ============================================
// USER PROFILE AI (Part 2 - User & Content Embeddings)
// ============================================

export interface IUserProfileAI {
  _id?: ObjectId;
  userId: ObjectId;
  embeddingVector: number[];  // 1536-dimensional
  topCategories: string[];
  topBrands: string[];
  priceRange: {
    min: number;
    max: number;
  };
  interestSegments: string[];
  lookalikes: ObjectId[];  // 100 nearest user IDs
  lastUpdated: Date;
  coldStart: boolean;
  trendingCategories?: string[];
  trendingProducts?: ObjectId[];
}

// Interest segments
export const INTEREST_SEGMENTS = [
  'tech_enthusiast',
  'fashion_shopper',
  'home_decor_buyer',
  'deal_hunter',
  'gadget_guru',
  'beauty_paragon',
  'sports_lover',
  'bookworm',
  'parenting_pro',
  'fitness_fanatic',
  'foodie',
  'traveler',
  'gamer',
  'musiclover',
  'artisan_supporter'
] as const;

export type InterestSegment = typeof INTEREST_SEGMENTS[number];

// ============================================
// EMBEDDING TYPES (Part 2)
// ============================================

export interface IProductEmbedding {
  productId: ObjectId;
  embeddingVector: number[];
  generatedAt: Date;
  model: 'openai-embedding-3-small' | 'local-model';
}

export interface ISearchEmbedding {
  query: string;
  embeddingVector: number[];
  filters?: {
    brand?: string;
    category?: string;
    maxPrice?: number;
    minPrice?: number;
    attributes?: string[];
    location?: string;
  };
}

// ============================================
// FEED RANKING TYPES (Part 3)
// ============================================

export interface IFeedScore {
  relevanceScore: number;    // 0-1, cosine similarity
  recencyScore: number;      // 0-1, time decay
  engagementScore: number;   // 0-1, normalized engagement
  trustScore: number;        // 0-1, seller reputation
  adBoostScore: number;      // 0-1, paid boost
  totalScore: number;
}

export interface IFeedItemRanking {
  itemId: ObjectId;
  itemType: 'product' | 'post';
  feedScore: IFeedScore;
  reasons: string[];
}

// ============================================
// SEARCH AI TYPES (Part 4)
// ============================================

export interface IQueryUnderstanding {
  keywords: string;
  filters: {
    brand?: string;
    category?: string;
    maxPrice?: number;
    minPrice?: number;
    attributes?: string[];
    location?: string;
  };
  intent: 'browse' | 'search' | 'compare' | 'buy' | 'research';
  originalQuery: string;
}

export interface ISearchResult {
  itemId: ObjectId;
  itemType: 'product' | 'seller' | 'post';
  keywordScore: number;
  semanticScore: number;
  sellerTrustScore: number;
  adBoostScore: number;
  finalScore: number;
}

export interface IVisualSearchResult {
  description: string;
  products: ISearchResult[];
}

// ============================================
// DYNAMIC PRICING TYPES (Part 5)
// ============================================

export interface IPricingSuggestion {
  productId: ObjectId;
  currentPrice: number;
  suggestedPrice: number;
  priceRange: {
    p25: number;
    median: number;
    p75: number;
  };
  competitors: number;
  confidence: number;
  factors: string[];
}

export interface IDemandForecast {
  category: string;
  currentDemand: number;
  predictedDemand: number;
  trend: 'rising' | 'falling' | 'stable';
  seasonalFactors: {
    event?: string;
    impact: number;
    date: string;
  }[];
  recommendation: string;
}

// ============================================
// AD AUCTION TYPES (Part 6)
// ============================================

export interface IAdRank {
  campaignId: ObjectId;
  bidAmount: number;
  qualityScore: number;
  ctrHistorical: number;
  relevanceScore: number;
  landingPageScore: number;
  finalRank: number;
}

export interface IAuctionResult {
  campaignId: ObjectId;
  rank: number;
  winningBid: number;
  actualCPC: number;
  impressionsToday: number;
}

export interface IAdImpression {
  _id?: ObjectId;
  campaignId: ObjectId;
  userId: ObjectId | null;
  sessionId: string;
  adRank: number;
  qualityScore: number;
  actualCPC: number;
  position: number;
  ts: Date;
}

export interface IAdClick {
  _id?: ObjectId;
  impressionId: ObjectId;
  campaignId: ObjectId;
  userId: ObjectId | null;
  ts: Date;
}

// ============================================
// TARGETING TYPES (Part 7)
// ============================================

export interface ILookalikeAudience {
  sellerId: ObjectId;
  sourceUserIds: ObjectId[];
  lookalikeUserIds: ObjectId[];
  similarity: number;
  createdAt: Date;
}

export interface IRetargetingEntry {
  userId: ObjectId;
  productId: ObjectId;
  impressions: number;
  lastSeen: Date;
  exclude: boolean;
}

// ============================================
// BUDGET PACING TYPES (Part 8)
// ============================================

export interface ITrafficCurve {
  hour: number;
  weight: number;
}

export interface IPacingStatus {
  campaignId: ObjectId;
  expectedSpend: number;
  actualSpend: number;
  variance: number;
  shouldServe: boolean;
  suggestedBidAdjustment?: number;
}

// ============================================
// ATTRIBUTION TYPES (Part 9)
// ============================================

export type AttributionModel = 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based';

export interface IAttributionEntry {
  orderId: ObjectId;
  campaignId: ObjectId;
  userId: ObjectId;
  credit: number;
  model: AttributionModel;
  touchpoints: {
    campaignId: ObjectId;
    type: 'impression' | 'click';
    ts: Date;
    credit: number;
  }[];
}

export interface IROASReport {
  campaignId: ObjectId;
  revenue: number;
  spend: number;
  roas: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
  avgCPC: number;
  period: {
    start: Date;
    end: Date;
  };
}

// ============================================
// AI CHATBOT TYPES (Part 10)
// ============================================

export interface IChatbotContext {
  storeId: ObjectId;
  storeName: string;
  policies: {
    shipping: string;
    returns: string;
    paymentMethods: string[];
  };
  topProducts: {
    id: ObjectId;
    name: string;
    price: number;
    stock: number;
  }[];
}

export interface IChatbotMessage {
  role: 'user' | 'assistant';
  content: string;
  ts: Date;
}

export interface IChatbotSession {
  _id?: ObjectId;
  userId: ObjectId | null;
  sessionId: string;
  storeId: ObjectId;
  messages: IChatbotMessage[];
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// FRAUD DETECTION TYPES (Part 11)
// ============================================

export interface IFraudSignal {
  type: 'fake_review' | 'dispute_abuse' | 'seller_fraud' | 'account_takeover';
  severity: 'low' | 'medium' | 'high' | 'critical';
  entity: {
    type: 'user' | 'seller' | 'order' | 'review';
    id: ObjectId;
  };
  evidence: Record<string, unknown>;
  confidence: number;
  recommendedAction: 'watch' | 'flag' | 'suspend' | 'ban';
  createdAt: Date;
}

export interface IFakeReviewSignal {
  reviewId: ObjectId;
  signals: {
    postedWithinMinutesOfPurchase: boolean;
    genericVagueText: boolean;
    reviewerCreatedSameDay: boolean;
    sameIPMultipleReviews: boolean;
    suspiciousPattern: boolean;
  };
  confidence: number;
}

export interface IDisputeAbuseSignal {
  userId: ObjectId;
  totalDisputes: number;
  totalOrders: number;
  disputeRate: number;
  trackingMismatch: boolean;
}

export interface ISellerFraudSignal {
  sellerId: ObjectId;
  signals: {
    highVolumeFirstWeek: boolean;
    multipleAccountsSameDevice: boolean;
    largePayoutBeforeDisputeWindow: boolean;
    poorDeliveryProof: boolean;
  };
}

export interface IAccountTakeoverSignal {
  userId: ObjectId;
  signals: {
    newDevice: boolean;
    newLocation: boolean;
    bulkListingChanges: boolean;
    largeWithdrawal: boolean;
  };
  verificationRequired: boolean;
}

// ============================================
// LOOKALIKE AUDIENCE COMPUTATION
// ============================================

export interface ILookalikeSeed {
  userId: ObjectId;
  embeddingVector: number[];
  hasPurchased: boolean;
}

export interface INearestNeighbor {
  userId: ObjectId;
  distance: number;
}
