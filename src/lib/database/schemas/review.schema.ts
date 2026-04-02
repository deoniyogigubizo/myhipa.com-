import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Review Collection Schema
 *
 * Product and seller reviews from buyers.
 *
 * @field productId - Reference to products collection
 * @field sellerId - Reference to sellers collection
 * @field buyerId - Reference to users collection
 * @field orderId - Reference to orders collection (prevents duplicate reviews per purchase)
 * @field rating - Rating value (1-5)
 * @field title - Review title
 * @field body - Review content
 * @field media - Review images/videos
 * @field verified - Whether review is from a confirmed purchase
 * @field helpful - Upvote count
 * @field notHelpful - Downvote count
 * @field sellerReply - Seller's reply to review
 * @field status - Review status (pending, published, flagged, removed)
 * @field flagCount - Number of times review was flagged
 */

// ============================================
// SUB-SCHEMAS
// ============================================

/**
 * Review Media Sub-document
 */
const ReviewMediaSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
      description: "URL to media file",
    },
    type: {
      type: String,
      enum: ["image", "video"],
      default: "image",
      description: "Media type",
    },
  },
  { _id: false },
);

/**
 * Seller Reply Sub-document
 */
const SellerReplySchema = new Schema(
  {
    body: {
      type: String,
      required: true,
      maxlength: 1000,
      description: "Seller reply content",
    },
    repliedAt: {
      type: Date,
      default: Date.now,
      description: "When seller replied",
    },
  },
  { _id: false },
);

// ============================================
// MAIN REVIEW SCHEMA
// ============================================

/**
 * IReview Interface
 * TypeScript interface for Review Document
 */
export interface IReview extends Document {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  rating: number;
  title: string;
  body?: string;
  media?: Array<{
    url: string;
    type: "image" | "video";
  }>;
  verified: boolean;
  helpful: number;
  notHelpful: number;
  sellerReply?: {
    body: string;
    repliedAt: Date;
  };
  status: "pending" | "published" | "flagged" | "removed";
  flagCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Review Schema Definition
 */
export const ReviewSchema = new Schema<IReview>(
  {
    // ========================================
    // CORE FIELDS
    // ========================================

    productId: {
      type: Schema.Types.ObjectId,
      ref: "products",
      required: [true, "Product ID is required"],
      description: "Reference to product",
    },

    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "sellers",
      required: [true, "Seller ID is required"],
      description: "Reference to seller",
    },

    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: [true, "Buyer ID is required"],
      description: "Reference to buyer (user)",
    },

    orderId: {
      type: Schema.Types.ObjectId,
      ref: "orders",
      required: [true, "Order ID is required"],
      description:
        "Reference to order (prevents duplicate reviews per purchase)",
    },

    // ========================================
    // RATING & CONTENT
    // ========================================

    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
      description: "Rating value (1-5)",
    },

    title: {
      type: String,
      required: [true, "Review title is required"],
      maxlength: 200,
      description: "Review title",
    },

    body: {
      type: String,
      maxlength: 2000,
      description: "Review content",
    },

    media: [
      {
        type: ReviewMediaSchema,
        description: "Review images/videos",
      },
    ],

    // ========================================
    // VERIFICATION
    // ========================================

    verified: {
      type: Boolean,
      default: false,
      description: "True only if order confirmed completed",
    },

    // ========================================
    // HELPFUL VOTES
    // ========================================

    helpful: {
      type: Number,
      default: 0,
      min: 0,
      description: "Upvote count",
    },

    notHelpful: {
      type: Number,
      default: 0,
      min: 0,
      description: "Downvote count",
    },

    // ========================================
    // SELLER REPLY
    // ========================================

    sellerReply: {
      type: SellerReplySchema,
      description: "Seller reply to review",
    },

    // ========================================
    // STATUS
    // ========================================

    status: {
      type: String,
      enum: {
        values: ["pending", "published", "flagged", "removed"],
        message: "Invalid review status",
      },
      default: "pending",
      description: "Review status",
    },

    flagCount: {
      type: Number,
      default: 0,
      min: 0,
      description: "Number of times review was flagged",
    },
  },
  {
    // ========================================
    // SCHEMA OPTIONS
    // ========================================
    timestamps: true,
    collection: "reviews",
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// ============================================
// INDEXES
// ============================================

// Product ID index
ReviewSchema.index({ productId: 1 }, { name: "product_id_idx" });

// Seller ID index
ReviewSchema.index({ sellerId: 1 }, { name: "seller_id_idx" });

// Buyer ID index
ReviewSchema.index({ buyerId: 1 }, { name: "buyer_id_idx" });

// Order ID unique index (one review per order)
ReviewSchema.index({ orderId: 1 }, { unique: true, name: "order_id_unique" });

// Rating index
ReviewSchema.index({ rating: -1 }, { name: "rating_idx" });

// Status index
ReviewSchema.index({ status: 1 }, { name: "status_idx" });

// Helpful votes index
ReviewSchema.index({ helpful: -1 }, { name: "helpful_idx" });

// Created at index
ReviewSchema.index({ createdAt: -1 }, { name: "created_at_idx" });

// Compound index for product reviews
ReviewSchema.index(
  { productId: 1, status: 1, rating: -1 },
  { name: "product_status_rating_idx" },
);

// ============================================
// VIRTUALS
// ============================================

/**
 * Virtual for review URL
 */
ReviewSchema.virtual("url").get(function () {
  return `/reviews/${this._id}`;
});

/**
 * Virtual for helpful ratio
 */
ReviewSchema.virtual("helpfulRatio").get(function () {
  const total = this.helpful + this.notHelpful;
  if (total === 0) return 0;
  return this.helpful / total;
});

/**
 * Virtual for is published
 */
ReviewSchema.virtual("isPublished").get(function () {
  return this.status === "published";
});

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find reviews by product
 */
ReviewSchema.statics.findByProduct = function (
  productId: mongoose.Types.ObjectId | string,
) {
  return this.find({ productId, status: "published" }).sort({ createdAt: -1 });
};

/**
 * Find reviews by seller
 */
ReviewSchema.statics.findBySeller = function (
  sellerId: mongoose.Types.ObjectId | string,
) {
  return this.find({ sellerId, status: "published" }).sort({ createdAt: -1 });
};

/**
 * Find review by order
 */
ReviewSchema.statics.findByOrder = function (
  orderId: mongoose.Types.ObjectId | string,
) {
  return this.findOne({ orderId });
};

/**
 * Get product average rating
 */
ReviewSchema.statics.getProductAverageRating = async function (
  productId: mongoose.Types.ObjectId | string,
): Promise<{ avgRating: number; reviewCount: number }> {
  const result = await this.aggregate([
    {
      $match: {
        productId: new mongoose.Types.ObjectId(productId as string),
        status: "published",
      },
    },
    {
      $group: {
        _id: "$productId",
        avgRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);
  return result[0]
    ? {
        avgRating: Math.round(result[0].avgRating * 10) / 10,
        reviewCount: result[0].reviewCount,
      }
    : { avgRating: 0, reviewCount: 0 };
};

/**
 * Get seller average rating
 */
ReviewSchema.statics.getSellerAverageRating = async function (
  sellerId: mongoose.Types.ObjectId | string,
): Promise<{ avgRating: number; reviewCount: number }> {
  const result = await this.aggregate([
    {
      $match: {
        sellerId: new mongoose.Types.ObjectId(sellerId as string),
        status: "published",
      },
    },
    {
      $group: {
        _id: "$sellerId",
        avgRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);
  return result[0]
    ? {
        avgRating: Math.round(result[0].avgRating * 10) / 10,
        reviewCount: result[0].reviewCount,
      }
    : { avgRating: 0, reviewCount: 0 };
};

/**
 * Check if user can review (has completed order)
 */
ReviewSchema.statics.canUserReview = async function (
  buyerId: string,
  productId: string,
  orderId: string,
): Promise<boolean> {
  const existing = await this.findOne({ buyerId, productId, orderId });
  return !existing;
};

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Mark as published
 */
ReviewSchema.methods.publish = function () {
  this.status = "published";
  return this.save();
};

/**
 * Mark as flagged
 */
ReviewSchema.methods.flag = function () {
  this.flagCount += 1;
  if (this.flagCount >= 3) {
    this.status = "flagged";
  }
  return this.save();
};

/**
 * Remove review
 */
ReviewSchema.methods.softRemove = function (this: any) {
  this.status = "removed";
  return this.save();
};

/**
 * Mark as verified
 */
ReviewSchema.methods.verify = function () {
  this.verified = true;
  return this.save();
};

/**
 * Add seller reply
 */
ReviewSchema.methods.addSellerReply = function (reply: string) {
  this.sellerReply = {
    body: reply,
    repliedAt: new Date(),
  };
  return this.save();
};

/**
 * Mark as helpful
 */
ReviewSchema.methods.markHelpful = function () {
  this.helpful += 1;
  return this.save();
};

/**
 * Mark as not helpful
 */
ReviewSchema.methods.markNotHelpful = function () {
  this.notHelpful += 1;
  return this.save();
};

// ============================================
// EXPORT MODEL
// ============================================

export const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
