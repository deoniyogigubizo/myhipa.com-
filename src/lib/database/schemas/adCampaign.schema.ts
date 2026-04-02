import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * AdCampaign Collection Schema
 * 
 * Advertising campaigns created by sellers to promote their products.
 * 
 * @field sellerId - Reference to seller
 * @field name - Campaign name
 * @field objective - Campaign objective (awareness | traffic | conversions)
 * @field targeting - Target audience configuration
 * @field creative - Ad creative configuration
 * @field budget - Budget and bidding settings
 * @field schedule - Campaign schedule
 * @field performance - Campaign performance metrics
 */

// Campaign Objective Enum
export type AdObjective = 'awareness' | 'traffic' | 'conversions';

// Audience Type Enum
export type AudienceType = 'broad' | 'lookalike' | 'retarget';

// Creative Type Enum
export type CreativeType = 'sponsored_listing' | 'banner' | 'post_boost' | 'flash_sale';

// Bid Type Enum
export type BidType = 'cpc' | 'cpm';

// Schedule Status Enum
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'rejected';

// ============================================
// SUB-SCHEMAS
// ============================================

/**
 * Targeting Sub-document
 */
const TargetingSchema = new Schema({
  categories: [{
    type: String,
    description: 'Product categories to target'
  }],
  locations: [{
    type: String,
    description: 'Geographic locations to target'
  }],
  interests: [{
    type: String,
    description: 'User interests to target'
  }],
  audienceType: {
    type: String,
    enum: ['broad', 'lookalike', 'retarget'],
    default: 'broad',
    description: 'Type of audience targeting'
  }
}, { _id: false });

/**
 * Creative Sub-document
 */
const CreativeSchema = new Schema({
  type: {
    type: String,
    enum: ['sponsored_listing', 'banner', 'post_boost', 'flash_sale'],
    required: true,
    description: 'Type of ad creative'
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    description: 'Product being promoted'
  },
  headline: {
    type: String,
    maxlength: 100,
    description: 'Ad headline'
  },
  imageUrl: {
    type: String,
    description: 'Ad image URL'
  }
}, { _id: false });

/**
 * Budget Sub-document
 */
const BudgetSchema = new Schema({
  daily: {
    type: Number,
    min: 0,
    description: 'Daily budget'
  },
  total: {
    type: Number,
    min: 0,
    description: 'Total campaign budget'
  },
  spent: {
    type: Number,
    min: 0,
    default: 0,
    description: 'Amount spent so far'
  },
  bidType: {
    type: String,
    enum: ['cpc', 'cpm'],
    default: 'cpc',
    description: 'Bid type'
  },
  bidAmount: {
    type: Number,
    min: 0,
    description: 'Bid amount'
  }
}, { _id: false });

/**
 * Schedule Sub-document
 */
const ScheduleSchema = new Schema({
  startAt: {
    type: Date,
    required: true,
    description: 'Campaign start date'
  },
  endAt: {
    type: Date,
    description: 'Campaign end date'
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'rejected'],
    default: 'draft',
    description: 'Campaign status'
  }
}, { _id: false });

/**
 * Performance Sub-document
 */
const PerformanceSchema = new Schema({
  impressions: {
    type: Number,
    min: 0,
    default: 0,
    description: 'Total impressions'
  },
  clicks: {
    type: Number,
    min: 0,
    default: 0,
    description: 'Total clicks'
  },
  ctr: {
    type: Number,
    min: 0,
    default: 0,
    description: 'Click-through rate'
  },
  conversions: {
    type: Number,
    min: 0,
    default: 0,
    description: 'Total conversions'
  },
  revenue: {
    type: Number,
    min: 0,
    default: 0,
    description: 'Total revenue from conversions'
  },
  roas: {
    type: Number,
    min: 0,
    default: 0,
    description: 'Return on ad spend'
  }
}, { _id: false });

// ============================================
// MAIN AD CAMPAIGN SCHEMA
// ============================================

/**
 * IAdCampaign Interface
 * TypeScript interface for AdCampaign Document
 */
export interface IAdCampaign extends Document {
  _id: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  name: string;
  objective: AdObjective;
  targeting: {
    categories: string[];
    locations: string[];
    interests: string[];
    audienceType: AudienceType;
  };
  creative: {
    type: CreativeType;
    productId?: mongoose.Types.ObjectId;
    headline?: string;
    imageUrl?: string;
  };
  budget: {
    daily: number;
    total: number;
    spent: number;
    bidType: BidType;
    bidAmount: number;
  };
  schedule: {
    startAt: Date;
    endAt?: Date;
    status: CampaignStatus;
  };
  performance: {
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    revenue: number;
    roas: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AdCampaign Schema Definition
 */
export const AdCampaignSchema = new Schema<IAdCampaign>(
  {
    // ========================================
    // CORE FIELDS
    // ========================================
    
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'Seller',
      required: [true, 'Seller ID is required'],
      index: true,
      description: 'Reference to seller'
    },
    
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      maxlength: 100,
      description: 'Campaign name'
    },
    
    objective: {
      type: String,
      enum: {
        values: ['awareness', 'traffic', 'conversions'],
        message: 'Invalid campaign objective'
      },
      required: [true, 'Campaign objective is required'],
      description: 'Campaign objective'
    },

    // ========================================
    // TARGETING
    // ========================================
    
    targeting: {
      type: TargetingSchema,
      default: () => ({
        categories: [],
        locations: [],
        interests: [],
        audienceType: 'broad'
      }),
      description: 'Target audience configuration'
    },

    // ========================================
    // CREATIVE
    // ========================================
    
    creative: {
      type: CreativeSchema,
      required: [true, 'Ad creative is required'],
      description: 'Ad creative configuration'
    },

    // ========================================
    // BUDGET
    // ========================================
    
    budget: {
      type: BudgetSchema,
      required: [true, 'Budget is required'],
      description: 'Budget and bidding settings'
    },

    // ========================================
    // SCHEDULE
    // ========================================
    
    schedule: {
      type: ScheduleSchema,
      required: [true, 'Schedule is required'],
      description: 'Campaign schedule'
    },

    // ========================================
    // PERFORMANCE
    // ========================================
    
    performance: {
      type: PerformanceSchema,
      default: () => ({
        impressions: 0,
        clicks: 0,
        ctr: 0,
        conversions: 0,
        revenue: 0,
        roas: 0
      }),
      description: 'Campaign performance metrics'
    }
  },
  {
    // ========================================
    // SCHEMA OPTIONS
    // ========================================
    timestamps: true,
    collection: 'ad_campaigns',
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// ============================================
// INDEXES
// ============================================

// Seller ID index
AdCampaignSchema.index({ sellerId: 1 }, { name: 'seller_id_idx' });

// Status index
AdCampaignSchema.index({ 'schedule.status': 1 }, { name: 'status_idx' });

// Objective index
AdCampaignSchema.index({ objective: 1 }, { name: 'objective_idx' });

// Start date index
AdCampaignSchema.index({ 'schedule.startAt': 1 }, { name: 'start_at_idx' });

// Created at index
AdCampaignSchema.index({ createdAt: -1 }, { name: 'created_at_idx' });

// Compound index for active campaigns
AdCampaignSchema.index(
  { sellerId: 1, 'schedule.status': 1 },
  { name: 'seller_active_idx' }
);

// ============================================
// VIRTUALS
// ============================================

/**
 * Virtual for remaining budget
 */
AdCampaignSchema.virtual('remainingBudget').get(function() {
  return Math.max(0, this.budget.total - this.budget.spent);
});

/**
 * Virtual for daily remaining budget
 */
AdCampaignSchema.virtual('dailyRemainingBudget').get(function() {
  return Math.max(0, this.budget.daily - (this.budget.spent / 30)); // Approximate
});

/**
 * Virtual for is active
 */
AdCampaignSchema.virtual('isActive').get(function() {
  return this.schedule.status === 'active';
});

/**
 * Virtual for is completed
 */
AdCampaignSchema.virtual('isCompleted').get(function() {
  return this.schedule.status === 'completed';
});

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find active campaigns
 */
AdCampaignSchema.statics.findActive = function() {
  return this.find({ 'schedule.status': 'active' })
    .populate('sellerId', 'storeName')
    .sort({ createdAt: -1 });
};

/**
 * Find campaigns by seller
 */
AdCampaignSchema.statics.findBySeller = function(sellerId: string) {
  return this.find({ sellerId: new mongoose.Types.ObjectId(sellerId) })
    .sort({ createdAt: -1 });
};

/**
 * Find campaigns by status
 */
AdCampaignSchema.statics.findByStatus = function(status: CampaignStatus) {
  return this.find({ 'schedule.status': status })
    .populate('sellerId', 'storeName')
    .sort({ createdAt: -1 });
};

/**
 * Get campaign stats by seller
 */
AdCampaignSchema.statics.getSellerStats = async function(sellerId: string) {
  const campaigns = await this.find({ sellerId: new mongoose.Types.ObjectId(sellerId) });
  
  return {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.schedule.status === 'active').length,
    totalSpent: campaigns.reduce((sum, c) => sum + c.budget.spent, 0),
    totalImpressions: campaigns.reduce((sum, c) => sum + c.performance.impressions, 0),
    totalClicks: campaigns.reduce((sum, c) => sum + c.performance.clicks, 0),
    totalConversions: campaigns.reduce((sum, c) => sum + c.performance.conversions, 0),
    totalRevenue: campaigns.reduce((sum, c) => sum + c.performance.revenue, 0)
  };
};

/**
 * Get overall ad stats
 */
AdCampaignSchema.statics.getOverallStats = async function() {
  const campaigns = await this.find();
  
  return {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.schedule.status === 'active').length,
    totalSpent: campaigns.reduce((sum, c) => sum + c.budget.spent, 0),
    totalImpressions: campaigns.reduce((sum, c) => sum + c.performance.impressions, 0),
    totalClicks: campaigns.reduce((sum, c) => sum + c.performance.clicks, 0),
    totalConversions: campaigns.reduce((sum, c) => sum + c.performance.conversions, 0),
    totalRevenue: campaigns.reduce((sum, c) => sum + c.performance.revenue, 0)
  };
};

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Activate campaign
 */
AdCampaignSchema.methods.activate = function() {
  this.schedule.status = 'active';
  return this.save();
};

/**
 * Pause campaign
 */
AdCampaignSchema.methods.pause = function() {
  this.schedule.status = 'paused';
  return this.save();
};

/**
 * Complete campaign
 */
AdCampaignSchema.methods.complete = function() {
  this.schedule.status = 'completed';
  return this.save();
};

/**
 * Update budget spent
 */
AdCampaignSchema.methods.updateSpent = function(amount: number) {
  this.budget.spent += amount;
  return this.save();
};

/**
 * Update performance metrics
 */
AdCampaignSchema.methods.updatePerformance = function(metrics: {
  impressions?: number;
  clicks?: number;
  conversions?: number;
  revenue?: number;
}) {
  if (metrics.impressions) this.performance.impressions += metrics.impressions;
  if (metrics.clicks) this.performance.clicks += metrics.clicks;
  if (metrics.conversions) this.performance.conversions += metrics.conversions;
  if (metrics.revenue) this.performance.revenue += metrics.revenue;
  
  // Recalculate CTR and ROAS
  if (this.performance.impressions > 0) {
    this.performance.ctr = this.performance.clicks / this.performance.impressions;
  }
  if (this.budget.spent > 0) {
    this.performance.roas = this.performance.revenue / this.budget.spent;
  }
  
  return this.save();
};

/**
 * Check if campaign is within budget
 */
AdCampaignSchema.methods.isWithinBudget = function(): boolean {
  return this.budget.spent < this.budget.total;
};

/**
 * Check if campaign schedule is valid
 */
AdCampaignSchema.methods.isScheduleValid = function(): boolean {
  const now = new Date();
  if (this.schedule.startAt > now) return false;
  if (this.schedule.endAt && this.schedule.endAt < now) return false;
  return true;
};

// ============================================
// EXPORT MODEL
// ============================================

export const AdCampaign: Model<IAdCampaign> = mongoose.models.AdCampaign || mongoose.model<IAdCampaign>('AdCampaign', AdCampaignSchema);

export default AdCampaign;
