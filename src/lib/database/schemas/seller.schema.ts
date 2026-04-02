import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Seller Collection Schema
 * 
 * One document per seller — linked to users via userId.
 * Separated so buyer-only users don't carry seller overhead.
 * 
 * DENORMALIZATION STRATEGY:
 * - stats fields (totalSales, avgRating, productCount) are pre-computed by background jobs every 15 minutes
 * - wallet balance is NOT denormalized - always read from transactions collection (source of truth)
 * 
 * @field userId - Reference to users collection
 * @field store - Store information (name, slug, logo, banner, bio, categories, location)
 * @field tier - Seller tier: standard | silver | gold | pro
 * @field feeRate - Platform fee rate (e.g., 0.03 = 3%)
 * @field kycStatus - KYC verification status
 * @field kycDocs - Array of KYC document URLs
 * @field verifiedAt - Timestamp when seller was verified
 * @field stats - Denormalized seller statistics (pre-computed, updated every 15 min)
 * @field wallet - Seller wallet for payouts (balance from transactions)
 * @field payoutMethods - Array of payout method options
 * @field policies - Store policies (shipping, returns, autoReply)
 * @field shippingZones - Shipping zones with prices and delivery times
 * @field businessHours - Weekly business hours
 * @field onboardingStep - Tracks signup funnel step
 * @field suspendedAt - Suspension timestamp (if suspended)
 * @field suspendReason - Reason for suspension
 */

// ============================================
// SUB-SCHEMAS
// ============================================

/**
 * GeoJSON Coordinates for location
 */
const GeoCoordsSchema = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number],  // [longitude, latitude]
    index: '2dsphere'
  }
}, { _id: false });

/**
 * Store Location Sub-document
 */
const SellerLocationSchema = new Schema({
  city: {
    type: String,
    required: true,
    description: 'City name e.g., "Kigali", "Nairobi"'
  },
  country: {
    type: String,
    required: true,
    description: 'ISO 3166-1 alpha-2 country code'
  },
  coords: {
    type: GeoCoordsSchema,
    description: 'GeoJSON coordinates for geo-queries'
  }
}, { _id: false });

/**
 * Store Information Sub-document
 */
const StoreSchema = new Schema({
  name: {
    type: String,
    required: true,
    description: 'Store display name'
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    description: 'URL-safe store identifier'
  },
  logo: {
    type: String,
    description: 'URL to store logo image'
  },
  banner: {
    type: String,
    description: 'URL to store banner/cover image'
  },
  bio: {
    type: String,
    maxlength: 1000,
    description: 'Store description'
  },
  categories: [{
    type: String,
    description: 'Product categories the store sells'
  }],
  location: {
    type: SellerLocationSchema,
    required: true,
    description: 'Store physical location'
  },
  customUrl: {
    type: String,
    description: 'Custom store URL e.g., myhipa.com/store/store-name'
  }
}, { _id: false });

/**
 * Seller Statistics Sub-document
 * Denormalized for performance - updated via background jobs
 */
const SellerStatsSchema = new Schema({
  totalRevenue: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Total revenue in smallest currency unit'
  },
  totalOrders: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Total number of orders received'
  },
  completedOrders: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Successfully completed orders'
  },
  cancelledOrders: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Cancelled orders count'
  },
  disputeRate: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Ratio of disputed orders to total orders'
  },
  avgRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
    description: 'Average rating from reviews (0-5)'
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Total number of reviews'
  },
  avgResponseTimeMin: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Average response time in minutes'
  },
  followerCount: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Number of users following this seller'
  },
  productCount: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Number of active products'
  }
}, { _id: false });

/**
 * Seller Wallet Sub-document
 */
const SellerWalletSchema = new Schema({
  available: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Available balance for withdrawal'
  },
  pending: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Funds in active escrow (pending delivery)'
  },
  held: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Funds frozen in dispute'
  },
  currency: {
    type: String,
    default: 'RWF',
    description: 'Currency code'
  },
  totalWithdrawn: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Total amount withdrawn historically'
  }
}, { _id: false });

/**
 * Payout Method Sub-document
 */
const PayoutMethodSchema = new Schema({
  type: {
    type: String,
    enum: ['mobile_money', 'bank'],
    required: true,
    description: 'Type of payout method'
  },
  provider: {
    type: String,
    description: 'Mobile money provider e.g., "MTN", "Airtel"'
  },
  number: {
    type: String,
    description: 'Phone number for mobile money'
  },
  bankName: {
    type: String,
    description: 'Bank name for bank transfers'
  },
  accountNumber: {
    type: String,
    description: 'Bank account number'
  },
  isPrimary: {
    type: Boolean,
    default: false,
    description: 'Whether this is the primary payout method'
  }
}, { _id: false });

/**
 * Seller Policies Sub-document
 */
const SellerPoliciesSchema = new Schema({
  shipping: {
    type: String,
    default: '',
    description: 'Shipping policy description'
  },
  returns: {
    type: String,
    default: '',
    description: 'Return policy description'
  },
  autoReply: {
    type: String,
    description: 'Auto-reply message for new inquiries'
  }
}, { _id: false });

/**
 * Shipping Zone Sub-document
 */
const ShippingZoneSchema = new Schema({
  zone: {
    type: String,
    required: true,
    description: 'Zone name e.g., "Kigali", "Nationwide"'
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    description: 'Shipping price in smallest currency unit'
  },
  estimatedDays: {
    type: Number,
    required: true,
    min: 1,
    description: 'Estimated delivery time in days'
  }
}, { _id: false });

// ============================================
// MAIN SELLER SCHEMA
// ============================================

/**
 * ISeller Interface
 * TypeScript interface for Seller Document
 */
export interface ISeller extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  store: {
    name: string;
    slug: string;
    logo?: string;
    banner?: string;
    bio?: string;
    categories: string[];
    location: {
      city: string;
      country: string;
      coords?: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
      };
    };
    customUrl?: string;
  };
  tier: 'standard' | 'silver' | 'gold' | 'pro';
  feeRate: number;
  kycStatus: 'none' | 'pending' | 'verified' | 'rejected';
  kycDocs?: string[];
  verifiedAt?: Date;
  stats: {
    totalRevenue: number;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    disputeRate: number;
    avgRating: number;
    reviewCount: number;
    avgResponseTimeMin: number;
    followerCount: number;
    productCount: number;
  };
  wallet: {
    available: number;
    pending: number;
    held: number;
    currency: string;
    totalWithdrawn: number;
  };
  payoutMethods: Array<{
    type: 'mobile_money' | 'bank';
    provider?: string;
    number?: string;
    bankName?: string;
    accountNumber?: string;
    isPrimary: boolean;
  }>;
  policies: {
    shipping: string;
    returns: string;
    autoReply?: string;
  };
  shippingZones: Array<{
    zone: string;
    price: number;
    estimatedDays: number;
  }>;
  businessHours: Record<string, string | null>;
  onboardingStep: string;
  suspendedAt?: Date;
  suspendReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Seller Schema Definition
 */
export const SellerSchema = new Schema<ISeller>(
  {
    // ========================================
    // CORE FIELDS
    // ========================================
    
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
      description: 'Reference to users collection'
    },

    // ========================================
    // STORE INFORMATION
    // ========================================
    
    store: {
      type: StoreSchema,
      required: true,
      description: 'Store information'
    },

    // ========================================
    // TIER & FEES
    // ========================================
    
    tier: {
      type: String,
      enum: {
        values: ['standard', 'silver', 'gold', 'pro'],
        message: 'Tier must be standard, silver, gold, or pro'
      },
      default: 'standard',
      description: 'Seller tier level'
    },
    feeRate: {
      type: Number,
      default: 0.03,
      min: 0,
      max: 1,
      description: 'Platform fee rate (0.03 = 3%)'
    },

    // ========================================
    // KYC FIELDS
    // ========================================
    
    kycStatus: {
      type: String,
      enum: {
        values: ['none', 'pending', 'verified', 'rejected'],
        message: 'Invalid KYC status'
      },
      default: 'none',
      description: 'Know Your Customer verification status'
    },
    kycDocs: [{
      type: String,
      description: 'URLs to KYC documents'
    }],
    verifiedAt: {
      type: Date,
      description: 'Timestamp when seller was verified'
    },

    // ========================================
    // STATISTICS
    // ========================================
    
    stats: {
      type: SellerStatsSchema,
      default: () => ({
        totalRevenue: 0,
        totalOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        disputeRate: 0,
        avgRating: 0,
        reviewCount: 0,
        avgResponseTimeMin: 0,
        followerCount: 0,
        productCount: 0
      }),
      description: 'Denormalized seller statistics'
    },

    // ========================================
    // WALLET
    // ========================================
    
    wallet: {
      type: SellerWalletSchema,
      default: () => ({
        available: 0,
        pending: 0,
        held: 0,
        currency: 'RWF',
        totalWithdrawn: 0
      }),
      description: 'Seller wallet for payouts'
    },

    // ========================================
    // PAYOUT METHODS
    // ========================================
    
    payoutMethods: [{
      type: PayoutMethodSchema,
      description: 'Array of payout method options'
    }],

    // ========================================
    // POLICIES
    // ========================================
    
    policies: {
      type: SellerPoliciesSchema,
      default: () => ({
        shipping: '',
        returns: ''
      }),
      description: 'Store policies'
    },

    // ========================================
    // SHIPPING ZONES
    // ========================================
    
    shippingZones: [{
      type: ShippingZoneSchema,
      description: 'Available shipping zones'
    }],

    // ========================================
    // BUSINESS HOURS
    // ========================================
    
    businessHours: {
      type: Map,
      of: String,
      description: 'Weekly business hours (day -> time range or null)'
    },

    // ========================================
    // ONBOARDING
    // ========================================
    
    onboardingStep: {
      type: String,
      default: 'started',
      description: 'Tracks signup funnel step'
    },

    // ========================================
    // SUSPENSION
    // ========================================
    
    suspendedAt: {
      type: Date,
      description: 'Timestamp when seller was suspended (null if active)'
    },
    suspendReason: {
      type: String,
      description: 'Reason for suspension'
    }
  },
  {
    // ========================================
    // SCHEMA OPTIONS
    // ========================================
    timestamps: true,
    collection: 'sellers',
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        // Add virtual fields to JSON
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

// Unique userId index
SellerSchema.index({ userId: 1 }, { unique: true, name: 'userId_unique' });

// Unique store slug index
SellerSchema.index({ 'store.slug': 1 }, { unique: true, name: 'store_slug_unique' });

// Geo index for location queries
SellerSchema.index({ 'store.location.coords': '2dsphere' }, { name: 'location_2dsphere' });

// Tier index for filtering
SellerSchema.index({ tier: 1 }, { name: 'tier_idx' });

// Rating index for leaderboards
SellerSchema.index({ 'stats.avgRating': -1 }, { name: 'avg_rating_idx' });

// Stats indexes
SellerSchema.index({ 'stats.totalRevenue': -1 }, { name: 'total_revenue_idx' });
SellerSchema.index({ 'stats.productCount': -1 }, { name: 'product_count_idx' });

// Created at index
SellerSchema.index({ createdAt: -1 }, { name: 'created_at_idx' });

// KYC status index
SellerSchema.index({ kycStatus: 1 }, { name: 'kyc_status_idx' });

// ============================================
// VIRTUALS
// ============================================

/**
 * Virtual for store URL
 */
SellerSchema.virtual('storeUrl').get(function() {
  return `/store/${this.store.slug}`;
});

/**
 * Virtual for is verified
 */
SellerSchema.virtual('isVerified').get(function() {
  return this.kycStatus === 'verified' && !!this.verifiedAt;
});

/**
 * Virtual for is suspended
 */
SellerSchema.virtual('isSuspended').get(function() {
  return !!this.suspendedAt;
});

/**
 * Virtual for total wallet balance
 */
SellerSchema.virtual('totalBalance').get(function() {
  return this.wallet.available + this.wallet.pending + this.wallet.held;
});

/**
 * Virtual for primary payout method
 */
SellerSchema.virtual('primaryPayoutMethod').get(function() {
  return this.payoutMethods.find(pm => pm.isPrimary) || this.payoutMethods[0];
});

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find seller by user ID
 */
SellerSchema.statics.findByUserId = function(userId: mongoose.Types.ObjectId | string) {
  return this.findOne({ userId });
};

/**
 * Find seller by store slug
 */
SellerSchema.statics.findBySlug = function(slug: string) {
  return this.findOne({ 'store.slug': slug });
};

/**
 * Get top rated sellers
 */
SellerSchema.statics.getTopRated = function(limit: number = 10) {
  return this.find({ kycStatus: 'verified', suspendedAt: null })
    .sort({ 'stats.avgRating': -1 })
    .limit(limit);
};

/**
 * Get sellers by tier
 */
SellerSchema.statics.findByTier = function(tier: string) {
  return this.find({ tier, kycStatus: 'verified' });
};

/**
 * Get nearby sellers (geo query)
 */
SellerSchema.statics.findNearby = function(coordinates: [number, number], maxDistanceMeters: number = 50000) {
  return this.find({
    'store.location.coords': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: maxDistanceMeters
      }
    }
  });
};

/**
 * Get seller leaderboard by revenue
 */
SellerSchema.statics.getTopByRevenue = function(limit: number = 10) {
  return this.find({ kycStatus: 'verified', suspendedAt: null })
    .sort({ 'stats.totalRevenue': -1 })
    .limit(limit);
};

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Check if seller is active
 */
SellerSchema.methods.isActive = function(): boolean {
  return !this.suspendedAt && this.kycStatus === 'verified';
};

/**
 * Update statistics
 */
SellerSchema.methods.updateStats = function(updates: Partial<ISeller['stats']>) {
  Object.assign(this.stats, updates);
  return this.save();
};

/**
 * Add to wallet
 */
SellerSchema.methods.addToWallet = function(amount: number, type: 'available' | 'pending' | 'held') {
  this.wallet[type] += amount;
  return this.save();
};

/**
 * Deduct from wallet
 */
SellerSchema.methods.deductFromWallet = async function(amount: number): Promise<boolean> {
  if (this.wallet.available >= amount) {
    this.wallet.available -= amount;
    await this.save();
    return true;
  }
  return false;
};

/**
 * Update rating
 */
SellerSchema.methods.updateRating = function(newRating: number) {
  const totalRating = this.stats.avgRating * this.stats.reviewCount + newRating;
  this.stats.reviewCount += 1;
  this.stats.avgRating = totalRating / this.stats.reviewCount;
  return this.save();
};

/**
 * Suspend seller
 */
SellerSchema.methods.suspend = function(reason: string) {
  this.suspendedAt = new Date();
  this.suspendReason = reason;
  return this.save();
};

/**
 * Unsuspend seller
 */
SellerSchema.methods.unsuspend = function() {
  this.suspendedAt = undefined;
  this.suspendReason = undefined;
  return this.save();
};

/**
 * Add payout method
 */
SellerSchema.methods.addPayoutMethod = function(method: ISeller['payoutMethods'][0]) {
  // If this is primary, unset other primaries
  if (method.isPrimary) {
    this.payoutMethods.forEach(pm => pm.isPrimary = false);
  }
  this.payoutMethods.push(method);
  return this.save();
};

/**
 * Get shipping price for a zone
 */
SellerSchema.methods.getShippingPrice = function(zone: string): number | null {
  const shippingZone = this.shippingZones.find(sz => sz.zone === zone);
  return shippingZone?.price ?? null;
};

// ============================================
// EXPORT MODEL
// ============================================

export const Seller: Model<ISeller> = mongoose.models.Seller || mongoose.model<ISeller>('Seller', SellerSchema);

export default Seller;
