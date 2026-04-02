import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Product Collection Schema
 * 
 * The catalog. One document per product, variants embedded.
 * 
 * DENORMALIZATION STRATEGY:
 * - stats fields (avgRating, reviewCount, totalSold) are pre-computed by background jobs every 15 minutes
 * - seller name and rating are embedded for fast search results page (zero joins)
 * - Financial data (pricing) stays as source of truth - no denormalization
 * 
 * @field sellerId - Reference to sellers collection
 * @field title - Product title
 * @field slug - URL-safe product identifier
 * @field description - Rich text/HTML product description
 * @field category - Product category hierarchy
 * @field media - Array of product images/videos
 * @field pricing - Product pricing (base, compareAt, bulk pricing)
 * @field variants - Product variants (color, storage, etc.)
 * @field inventory - Inventory tracking
 * @field shipping - Shipping information
 * @field seo - SEO metadata
 * @field stats - Denormalized product statistics (pre-computed)
 * @field tags - Product tags for search
 * @field condition - Product condition (new, used, refurbished)
 * @field status - Product status (draft, active, paused, archived)
 * @field embeddingVector - AI vector for similarity search
 * @field aiSuggestedPrice - AI suggested price
 */

// ============================================
// SUB-SCHEMAS
// ============================================

/**
 * Product Category Sub-document
 */
const ProductCategorySchema = new Schema({
  primary: {
    type: String,
    required: true,
    description: 'Primary category e.g., "electronics"'
  },
  secondary: {
    type: String,
    description: 'Secondary category e.g., "smartphones"'
  },
  tertiary: {
    type: String,
    description: 'Tertiary category e.g., "android"'
  },
  path: [{
    type: String,
    description: 'Full category path e.g., ["electronics", "smartphones", "android"]'
  }]
}, { _id: false });

/**
 * Product Media Sub-document
 */
const ProductMediaSchema = new Schema({
  url: {
    type: String,
    required: true,
    description: 'URL to media file'
  },
  type: {
    type: String,
    enum: ['image', 'video', 'video_360'],
    default: 'image',
    description: 'Media type'
  },
  isPrimary: {
    type: Boolean,
    default: false,
    description: 'Whether this is the primary product image'
  },
  order: {
    type: Number,
    default: 0,
    description: 'Display order'
  }
}, { _id: false });

/**
 * Bulk Pricing Sub-document
 */
const BulkPricingSchema = new Schema({
  minQty: {
    type: Number,
    required: true,
    min: 1,
    description: 'Minimum quantity for this pricing tier'
  },
  discountPct: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    description: 'Discount percentage'
  }
}, { _id: false });

/**
 * Product Pricing Sub-document
 */
const ProductPricingSchema = new Schema({
  base: {
    type: Number,
    required: true,
    min: 0,
    description: 'Base price in smallest currency unit (RWF centimes)'
  },
  compareAt: {
    type: Number,
    description: 'Original price for strikethrough display'
  },
  currency: {
    type: String,
    default: 'RWF',
    description: 'Currency code'
  },
  bulkPricing: [{
    type: BulkPricingSchema,
    description: 'Bulk pricing tiers'
  }]
}, { _id: false });

/**
 * Product Variant Sub-document
 */
const ProductVariantSchema = new Schema({
  name: {
    type: String,
    required: true,
    description: 'Variant display name e.g., "Black / 128GB"'
  },
  attributes: {
    type: Map,
    of: String,
    description: 'Variant attributes e.g., { color: "Black", storage: "128GB" }'
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    description: 'Variant price in smallest currency unit'
  },
  stock: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Available stock for this variant'
  },
  sku: {
    type: String,
    description: 'Stock keeping unit'
  },
  barcode: {
    type: String,
    description: 'Barcode/UPC/EAN'
  }
}, { _id: true }); // Enable _id for variants

/**
 * Product Inventory Sub-document
 */
const ProductInventorySchema = new Schema({
  totalStock: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Total available stock across all variants'
  },
  lowStockThreshold: {
    type: Number,
    default: 3,
    min: 0,
    description: 'Threshold for low stock alerts'
  },
  trackInventory: {
    type: Boolean,
    default: true,
    description: 'Whether to track inventory'
  },
  allowBackorder: {
    type: Boolean,
    default: false,
    description: 'Allow ordering when out of stock'
  }
}, { _id: false });

/**
 * Product Dimensions Sub-document
 */
const DimensionsSchema = new Schema({
  l: {
    type: Number,
    description: 'Length in cm'
  },
  w: {
    type: Number,
    description: 'Width in cm'
  },
  h: {
    type: Number,
    description: 'Height in cm'
  }
}, { _id: false });

/**
 * Product Shipping Sub-document
 */
const ProductShippingSchema = new Schema({
  weight: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Weight in kg'
  },
  dimensions: {
    type: DimensionsSchema,
    description: 'Package dimensions'
  },
  requiresShipping: {
    type: Boolean,
    default: true,
    description: 'Whether product requires shipping'
  },
  digitalDownload: {
    type: Boolean,
    default: false,
    description: 'Whether product is a digital download'
  }
}, { _id: false });

/**
 * Product SEO Sub-document
 */
const ProductSeoSchema = new Schema({
  metaTitle: {
    type: String,
    maxlength: 70,
    description: 'SEO meta title'
  },
  metaDescription: {
    type: String,
    maxlength: 160,
    description: 'SEO meta description'
  },
  customSlug: {
    type: String,
    description: 'Custom URL slug override'
  }
}, { _id: false });

/**
 * Product Statistics Sub-document
 * Denormalized for performance
 */
const ProductStatsSchema = new Schema({
  views: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Number of product views'
  },
  addedToCart: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Number of times added to cart'
  },
  purchased: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Number of times purchased'
  },
  conversionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 1,
    description: 'Ratio of purchases to views'
  },
  avgRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
    description: 'Average rating from reviews'
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Number of reviews'
  },
  wishlistCount: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Number of users who added to wishlist'
  }
}, { _id: false });

// ============================================
// MAIN PRODUCT SCHEMA
// ============================================

/**
 * IProduct Interface
 * TypeScript interface for Product Document
 */
export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  category: {
    primary: string;
    secondary?: string;
    tertiary?: string;
    path: string[];
  };
  media: Array<{
    url: string;
    type: 'image' | 'video' | 'video_360';
    isPrimary: boolean;
    order: number;
  }>;
  pricing: {
    base: number;
    compareAt?: number;
    currency: string;
    bulkPricing: Array<{
      minQty: number;
      discountPct: number;
    }>;
  };
  variants: Array<{
    _id: mongoose.Types.ObjectId;
    name: string;
    attributes: Map<string, string>;
    price: number;
    stock: number;
    sku?: string;
    barcode?: string;
  }>;
  inventory: {
    totalStock: number;
    lowStockThreshold: number;
    trackInventory: boolean;
    allowBackorder: boolean;
  };
  shipping: {
    weight: number;
    dimensions?: {
      l: number;
      w: number;
      h: number;
    };
    requiresShipping: boolean;
    digitalDownload: boolean;
  };
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    customSlug?: string;
  };
  stats: {
    views: number;
    addedToCart: number;
    purchased: number;
    conversionRate: number;
    avgRating: number;
    reviewCount: number;
    wishlistCount: number;
  };
  tags: string[];
  condition: 'new' | 'used' | 'refurbished';
  status: 'draft' | 'active' | 'paused' | 'archived';
  embeddingVector?: number[];
  aiSuggestedPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product Schema Definition
 */
export const ProductSchema = new Schema<IProduct>(
  {
    // ========================================
    // CORE FIELDS
    // ========================================
    
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'sellers',
      required: [true, 'Seller ID is required'],
      index: true,
      description: 'Reference to sellers collection'
    },

    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      description: 'Product title'
    },

    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      unique: true,
      lowercase: true,
      description: 'URL-safe product identifier'
    },

    description: {
      type: String,
      required: [true, 'Product description is required'],
      description: 'Rich text / HTML product description'
    },

    // ========================================
    // CATEGORY
    // ========================================
    
    category: {
      type: ProductCategorySchema,
      required: true,
      description: 'Product category hierarchy'
    },

    // ========================================
    // MEDIA
    // ========================================
    
    media: [{
      type: ProductMediaSchema,
      description: 'Product images and videos'
    }],

    // ========================================
    // PRICING
    // ========================================
    
    pricing: {
      type: ProductPricingSchema,
      required: true,
      description: 'Product pricing information'
    },

    // ========================================
    // VARIANTS
    // ========================================
    
    variants: [{
      type: ProductVariantSchema,
      description: 'Product variants (color, storage, etc.)'
    }],

    // ========================================
    // INVENTORY
    // ========================================
    
    inventory: {
      type: ProductInventorySchema,
      default: () => ({
        totalStock: 0,
        lowStockThreshold: 3,
        trackInventory: true,
        allowBackorder: false
      }),
      description: 'Inventory tracking settings'
    },

    // ========================================
    // SHIPPING
    // ========================================
    
    shipping: {
      type: ProductShippingSchema,
      default: () => ({
        weight: 0,
        requiresShipping: true,
        digitalDownload: false
      }),
      description: 'Shipping information'
    },

    // ========================================
    // SEO
    // ========================================
    
    seo: {
      type: ProductSeoSchema,
      description: 'SEO metadata'
    },

    // ========================================
    // STATISTICS
    // ========================================
    
    stats: {
      type: ProductStatsSchema,
      default: () => ({
        views: 0,
        addedToCart: 0,
        purchased: 0,
        conversionRate: 0,
        avgRating: 0,
        reviewCount: 0,
        wishlistCount: 0
      }),
      description: 'Denormalized product statistics'
    },

    // ========================================
    // TAGS & CONDITION
    // ========================================
    
    tags: [{
      type: String,
      description: 'Product tags for search'
    }],

    condition: {
      type: String,
      enum: {
        values: ['new', 'used', 'refurbished'],
        message: 'Condition must be new, used, or refurbished'
      },
      default: 'new',
      description: 'Product condition'
    },

    // ========================================
    // STATUS
    // ========================================
    
    status: {
      type: String,
      enum: {
        values: ['draft', 'active', 'paused', 'archived'],
        message: 'Invalid product status'
      },
      default: 'draft',
      index: true,
      description: 'Product status'
    },

    // ========================================
    // AI FIELDS
    // ========================================
    
    embeddingVector: [{
      type: Number,
      description: '1536-dimensional embedding vector for similarity search'
    }],

    aiSuggestedPrice: {
      type: Number,
      description: 'AI suggested price based on market analysis'
    }
  },
  {
    // ========================================
    // SCHEMA OPTIONS
    // ========================================
    timestamps: true,
    collection: 'products',
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

// Seller and status compound index
ProductSchema.index({ sellerId: 1, status: 1 }, { name: 'seller_status_idx' });

// Category path index
ProductSchema.index({ 'category.path': 1 }, { name: 'category_path_idx' });

// Status with pricing and rating compound index
ProductSchema.index(
  { status: 1, 'pricing.base': 1, 'stats.avgRating': -1 },
  { name: 'status_price_rating_idx' }
);

// CRITICAL: Product search - Compound index covering most common filtered + sorted search query
// Pattern: { category.path: 1, status: 1, pricing.base: 1, stats.avgRating: -1 }
ProductSchema.index(
  { 'category.path': 1, status: 1, 'pricing.base': 1, 'stats.avgRating': -1 },
  { name: 'product_search_compound_idx' }
);

// Tags multikey index
ProductSchema.index({ tags: 1 }, { name: 'tags_idx' });

// Full-text search index
ProductSchema.index(
  { title: 'text', description: 'text', tags: 'text' },
  {
    name: 'fulltext_idx',
    default_language: 'english',
    weights: { title: 10, tags: 5, description: 1 }
  }
);

// Price range index
ProductSchema.index({ 'pricing.base': 1 }, { name: 'price_idx' });

// Rating index
ProductSchema.index({ 'stats.avgRating': -1 }, { name: 'rating_idx' });

// Created at index
ProductSchema.index({ createdAt: -1 }, { name: 'created_at_idx' });

// ============================================
// VIRTUALS
// ============================================

/**
 * Virtual for product URL
 */
ProductSchema.virtual('url').get(function() {
  return `/product/${this.slug}`;
});

/**
 * Virtual for primary image
 */
ProductSchema.virtual('primaryImage').get(function() {
  const primary = this.media?.find(m => m.isPrimary);
  return primary?.url || this.media?.[0]?.url;
});

/**
 * Virtual for current price (considering variants)
 */
ProductSchema.virtual('currentPrice').get(function() {
  if (this.variants?.length > 0) {
    return Math.min(...this.variants.map(v => v.price));
  }
  return this.pricing?.base || 0;
});

/**
 * Virtual for original price
 */
ProductSchema.virtual('originalPrice').get(function() {
  return this.pricing?.compareAt || this.pricing?.base || 0;
});

/**
 * Virtual for discount percentage
 */
ProductSchema.virtual('discountPercent').get(function() {
  if (this.pricing?.compareAt && this.pricing?.base) {
    return Math.round((1 - this.pricing.base / this.pricing.compareAt) * 100);
  }
  return 0;
});

/**
 * Virtual for is in stock
 */
ProductSchema.virtual('inStock').get(function() {
  if (!this.inventory?.trackInventory) return true;
  return (this.inventory?.totalStock || 0) > 0 || this.inventory?.allowBackorder;
});

/**
 * Virtual for is low stock
 */
ProductSchema.virtual('isLowStock').get(function() {
  if (!this.inventory?.trackInventory) return false;
  const stock = this.inventory?.totalStock || 0;
  const threshold = this.inventory?.lowStockThreshold || 3;
  return stock > 0 && stock <= threshold;
});

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find product by slug
 */
ProductSchema.statics.findBySlug = function(slug: string) {
  return this.findOne({ slug });
};

/**
 * Find products by seller
 */
ProductSchema.statics.findBySeller = function(sellerId: mongoose.Types.ObjectId | string, options?: any) {
  return this.find({ sellerId }, null, options);
};

/**
 * Find active products
 */
ProductSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

/**
 * Find products by category
 */
ProductSchema.statics.findByCategory = function(categoryPath: string) {
  return this.find({ 'category.path': categoryPath, status: 'active' });
};

/**
 * Find products in price range
 */
ProductSchema.statics.findInPriceRange = function(minPrice: number, maxPrice: number) {
  return this.find({
    status: 'active',
    'pricing.base': { $gte: minPrice, $lte: maxPrice }
  });
};

/**
 * Find top rated products
 */
ProductSchema.statics.findTopRated = function(limit: number = 10) {
  return this.find({ status: 'active' })
    .sort({ 'stats.avgRating': -1 })
    .limit(limit);
};

/**
 * Find similar products (using embedding vector)
 */
ProductSchema.statics.findSimilar = function(embedding: number[], limit: number = 10) {
  return this.find({
    status: 'active',
    embeddingVector: { $exists: true }
  })
    .limit(limit);
};

/**
 * Search products
 */
ProductSchema.statics.search = function(query: string, options?: any) {
  return this.find(
    { $text: { $search: query }, status: 'active' },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(options?.limit || 20);
};

/**
 * Get products by tags
 */
ProductSchema.statics.findByTags = function(tags: string[], matchAll: boolean = false) {
  const query = matchAll
    ? { $all: tags }
    : { $in: tags };
  return this.find({ tags: query, status: 'active' });
};

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Increment view count
 */
ProductSchema.methods.incrementViews = function() {
  this.stats.views += 1;
  return this.save();
};

/**
 * Increment cart additions
 */
ProductSchema.methods.incrementCartAdds = function() {
  this.stats.addedToCart += 1;
  return this.save();
};

/**
 * Record purchase
 */
ProductSchema.methods.recordPurchase = function(quantity: number = 1) {
  this.stats.purchased += quantity;
  this.stats.conversionRate = this.stats.purchased / this.stats.views || 0;
  return this.save();
};

/**
 * Update rating
 */
ProductSchema.methods.updateRating = function(newRating: number) {
  const totalRating = this.stats.avgRating * this.stats.reviewCount + newRating;
  this.stats.reviewCount += 1;
  this.stats.avgRating = totalRating / this.stats.reviewCount;
  return this.save();
};

/**
 * Update stock
 */
ProductSchema.methods.updateStock = function(variantId: mongoose.Types.ObjectId | string, quantity: number) {
  const variant = this.variants.id(variantId);
  if (variant) {
    variant.stock += quantity;
    // Recalculate total stock
    this.inventory.totalStock = this.variants.reduce((sum, v) => sum + v.stock, 0);
  }
  return this.save();
};

/**
 * Activate product
 */
ProductSchema.methods.activate = function() {
  this.status = 'active';
  return this.save();
};

/**
 * Pause product
 */
ProductSchema.methods.pause = function() {
  this.status = 'paused';
  return this.save();
};

/**
 * Archive product
 */
ProductSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

/**
 * Add to wishlist count
 */
ProductSchema.methods.incrementWishlist = function() {
  this.stats.wishlistCount += 1;
  return this.save();
};

/**
 * Remove from wishlist count
 */
ProductSchema.methods.decrementWishlist = function() {
  this.stats.wishlistCount = Math.max(0, this.stats.wishlistCount - 1);
  return this.save();
};

/**
 * Get price for quantity
 */
ProductSchema.methods.getPriceForQuantity = function(quantity: number): number {
  const basePrice = this.pricing.base;
  
  // Check bulk pricing
  if (this.pricing.bulkPricing?.length > 0) {
    const applicableTier = this.pricing.bulkPricing
      .sort((a, b) => b.minQty - a.minQty)
      .find(tier => quantity >= tier.minQty);
    
    if (applicableTier) {
      return basePrice * (1 - applicableTier.discountPct / 100);
    }
  }
  
  return basePrice;
};

// ============================================
// EXPORT MODEL
// ============================================

export const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
