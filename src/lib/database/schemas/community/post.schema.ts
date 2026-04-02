import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Post Collection Schema (Community)
 *
 * Community posts in the feed.
 *
 * @field authorId - Reference to users collection
 * @field groupId - Reference to groups (null = public feed)
 * @field sellerId - If posted by a seller store
 * @field type - Post type (text, product_share, review_share, deal, question, ama)
 * @field content - Post content (text, media, productId, deal info)
 * @field engagement - Engagement metrics (likes, comments, shares, views)
 * @field pinned - Whether post is pinned
 * @field boosted - Whether post is boosted (ad campaign)
 * @field boostCampaignId - Reference to boost campaign
 * @field status - Post status (draft, published, flagged, removed)
 * @field flagCount - Number of times post was flagged
 * @field reportReasons - Reasons for reporting
 */

// Post Type Enum
export type PostType =
  | "text"
  | "product_share"
  | "review_share"
  | "deal"
  | "question"
  | "ama";

// ============================================
// SUB-SCHEMAS
// ============================================

/**
 * Post Media Sub-document
 */
const PostMediaSchema = new Schema(
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
 * Post Content Sub-document
 */
const PostContentSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
      maxlength: 5000,
      description: "Post text content",
    },
    media: [
      {
        type: PostMediaSchema,
        description: "Post images/videos",
      },
    ],
    productId: {
      type: Schema.Types.ObjectId,
      ref: "products",
      description: "Reference to product (if type=product_share)",
    },
    dealDiscount: {
      type: Number,
      min: 0,
      max: 100,
      description: "Discount percentage (if type=deal)",
    },
    dealEndsAt: {
      type: Date,
      description: "Deal end date (if type=deal)",
    },
  },
  { _id: false },
);

/**
 * Post Engagement Sub-document
 */
const PostEngagementSchema = new Schema(
  {
    likes: {
      type: Number,
      default: 0,
      min: 0,
      description: "Number of likes",
    },
    likedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "users",
        description: "Users who liked (capped at 1000)",
      },
    ],
    commentCount: {
      type: Number,
      default: 0,
      min: 0,
      description: "Number of comments",
    },
    shareCount: {
      type: Number,
      default: 0,
      min: 0,
      description: "Number of shares",
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
      description: "Number of views",
    },
  },
  { _id: false },
);

// ============================================
// MAIN POST SCHEMA
// ============================================

/**
 * IPost Interface
 * TypeScript interface for Post Document
 */
export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId;
  sellerId?: mongoose.Types.ObjectId;
  type: PostType;
  content: {
    text: string;
    media?: Array<{
      url: string;
      type: "image" | "video";
    }>;
    productId?: mongoose.Types.ObjectId;
    dealDiscount?: number;
    dealEndsAt?: Date;
  };
  engagement: {
    likes: number;
    likedBy: mongoose.Types.ObjectId[];
    commentCount: number;
    shareCount: number;
    viewCount: number;
  };
  pinned: boolean;
  boosted: boolean;
  boostCampaignId?: string;
  status: "draft" | "published" | "flagged" | "removed";
  flagCount: number;
  reportReasons: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Post Schema Definition
 */
export const PostSchema = new Schema<IPost>(
  {
    // ========================================
    // AUTHOR FIELDS
    // ========================================

    authorId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: [true, "Author ID is required"],
      description: "Reference to post author",
    },

    groupId: {
      type: Schema.Types.ObjectId,
      ref: "groups",
      description: "Reference to group (null = public feed)",
    },

    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "sellers",
      description: "If posted by a seller store",
    },

    // ========================================
    // POST TYPE
    // ========================================

    type: {
      type: String,
      enum: {
        values: [
          "text",
          "product_share",
          "review_share",
          "deal",
          "question",
          "ama",
        ],
        message: "Invalid post type",
      },
      required: [true, "Post type is required"],
      description: "Type of post",
    },

    // ========================================
    // CONTENT
    // ========================================

    content: {
      type: PostContentSchema,
      required: true,
      description: "Post content",
    },

    // ========================================
    // ENGAGEMENT
    // ========================================

    engagement: {
      type: PostEngagementSchema,
      default: () => ({
        likes: 0,
        likedBy: [],
        commentCount: 0,
        shareCount: 0,
        viewCount: 0,
      }),
      description: "Engagement metrics",
    },

    // ========================================
    // PINNED & BOOSTED
    // ========================================

    pinned: {
      type: Boolean,
      default: false,
      description: "Whether post is pinned",
    },

    boosted: {
      type: Boolean,
      default: false,
      description: "Whether post is boosted (ad campaign)",
    },

    boostCampaignId: {
      type: String,
      description: "Reference to boost campaign",
    },

    // ========================================
    // STATUS
    // ========================================

    status: {
      type: String,
      enum: {
        values: ["draft", "published", "flagged", "removed"],
        message: "Invalid post status",
      },
      default: "published",
      description: "Post status",
    },

    flagCount: {
      type: Number,
      default: 0,
      min: 0,
      description: "Number of times post was flagged",
    },

    reportReasons: [
      {
        type: String,
        description: "Reasons for reporting",
      },
    ],
  },
  {
    // ========================================
    // SCHEMA OPTIONS
    // ========================================
    timestamps: true,
    collection: "posts",
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

// Author ID index
PostSchema.index({ authorId: 1 }, { name: "author_id_idx" });

// Group ID index
PostSchema.index({ groupId: 1 }, { name: "group_id_idx" });

// Seller ID index
PostSchema.index({ sellerId: 1 }, { name: "seller_id_idx" });

// Post type index
PostSchema.index({ type: 1 }, { name: "type_idx" });

// Status index
PostSchema.index({ status: 1 }, { name: "status_idx" });

// Pinned index
PostSchema.index({ pinned: 1, createdAt: -1 }, { name: "pinned_idx" });

// Boosted index
PostSchema.index({ boosted: 1 }, { name: "boosted_idx" });

// Created at index
PostSchema.index({ createdAt: -1 }, { name: "created_at_idx" });

// Compound index for feed
PostSchema.index(
  { status: 1, groupId: 1, createdAt: -1 },
  { name: "feed_idx" },
);

// Engagement index for trending
PostSchema.index(
  { status: 1, "engagement.likes": -1, "engagement.commentCount": -1 },
  { name: "trending_idx" },
);

// ============================================
// VIRTUALS
// ============================================

/**
 * Virtual for post URL
 */
PostSchema.virtual("url").get(function () {
  return `/community/post/${this._id}`;
});

/**
 * Virtual for is published
 */
PostSchema.virtual("isPublished").get(function () {
  return this.status === "published";
});

/**
 * Virtual for has deal expired
 */
PostSchema.virtual("isDealExpired").get(function () {
  if (this.type === "deal" && this.content.dealEndsAt) {
    return new Date() > this.content.dealEndsAt;
  }
  return false;
});

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find posts by author
 */
PostSchema.statics.findByAuthor = function (
  authorId: mongoose.Types.ObjectId | string,
) {
  return this.find({ authorId, status: "published" }).sort({ createdAt: -1 });
};

/**
 * Find posts in group
 */
PostSchema.statics.findByGroup = function (
  groupId: mongoose.Types.ObjectId | string,
) {
  return this.find({ groupId, status: "published" }).sort({
    pinned: -1,
    createdAt: -1,
  });
};

/**
 * Find public feed
 */
PostSchema.statics.findPublicFeed = function (limit: number = 20) {
  return this.find({
    groupId: null,
    status: "published",
  })
    .sort({ pinned: -1, boosted: -1, createdAt: -1 })
    .limit(limit);
};

/**
 * Find trending posts
 */
PostSchema.statics.findTrending = function (limit: number = 10) {
  return this.find({ status: "published" })
    .sort({ "engagement.likes": -1, "engagement.commentCount": -1 })
    .limit(limit);
};

/**
 * Find boosted posts
 */
PostSchema.statics.findBoosted = function () {
  return this.find({ boosted: true, status: "published" }).sort({
    createdAt: -1,
  });
};

/**
 * Get feed with pagination
 */
PostSchema.statics.getFeed = function (options: {
  groupId?: string;
  limit?: number;
  skip?: number;
}) {
  const query: any = { status: "published" };

  if (options.groupId) {
    query.groupId = new mongoose.Types.ObjectId(options.groupId);
  } else {
    query.groupId = null;
  }

  return this.find(query)
    .sort({ pinned: -1, boosted: -1, createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 20);
};

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Publish post
 */
PostSchema.methods.publish = function () {
  this.status = "published";
  return this.save();
};

/**
 * Pin post
 */
PostSchema.methods.pin = function () {
  this.pinned = true;
  return this.save();
};

/**
 * Unpin post
 */
PostSchema.methods.unpin = function () {
  this.pinned = false;
  return this.save();
};

/**
 * Boost post
 */
PostSchema.methods.boost = function (campaignId: string) {
  this.boosted = true;
  this.boostCampaignId = campaignId;
  return this.save();
};

/**
 * Remove boost
 */
PostSchema.methods.removeBoost = function () {
  this.boosted = false;
  this.boostCampaignId = undefined;
  return this.save();
};

/**
 * Add like
 */
PostSchema.methods.addLike = function (userId: mongoose.Types.ObjectId) {
  if (!this.engagement.likedBy.includes(userId)) {
    this.engagement.likes += 1;
    this.engagement.likedBy.push(userId);
  }
  return this.save();
};

/**
 * Remove like
 */
PostSchema.methods.removeLike = function (userId: mongoose.Types.ObjectId) {
  const index = this.engagement.likedBy.indexOf(userId);
  if (index > -1) {
    this.engagement.likedBy.splice(index, 1);
    this.engagement.likes = Math.max(0, this.engagement.likes - 1);
  }
  return this.save();
};

/**
 * Increment comment count
 */
PostSchema.methods.incrementComments = function () {
  this.engagement.commentCount += 1;
  return this.save();
};

/**
 * Increment share count
 */
PostSchema.methods.incrementShares = function () {
  this.engagement.shareCount += 1;
  return this.save();
};

/**
 * Increment view count
 */
PostSchema.methods.incrementViews = function () {
  this.engagement.viewCount += 1;
  return this.save();
};

/**
 * Flag post
 */
PostSchema.methods.flag = function (reason: string) {
  this.flagCount += 1;
  this.reportReasons.push(reason);
  if (this.flagCount >= 3) {
    this.status = "flagged";
  }
  return this.save();
};

/**
 * Remove post
 */
PostSchema.methods.softRemove = function (this: any) {
  this.status = "removed";
  return this.save();
};

// ============================================
// EXPORT MODEL
// ============================================

export const Post: Model<IPost> =
  mongoose.models.Post || mongoose.model<IPost>("Post", PostSchema);

export default Post;
