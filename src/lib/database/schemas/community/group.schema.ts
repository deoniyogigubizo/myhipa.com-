import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Group Collection Schema (Community)
 *
 * Community groups for discussions.
 *
 * @field name - Group name
 * @field slug - URL-safe group identifier
 * @field description - Group description
 * @field banner - Group banner image URL
 * @field icon - Group icon URL
 * @field type - Group type (public, private, seller_only)
 * @field category - Group category
 * @field location - Group location
 * @field adminId - Group admin user ID
 * @field moderators - Array of moderator user IDs
 * @field stats - Group statistics
 * @field rules - Group rules
 * @field pinnedPostIds - Pinned post IDs
 * @field status - Group status
 */

// Group Type Enum
export type GroupType = "public" | "private" | "seller_only";

// ============================================
// SUB-SCHEMAS
// ============================================

/**
 * Group Location Sub-document
 */
const GroupLocationSchema = new Schema(
  {
    city: {
      type: String,
      required: true,
      description: "City name",
    },
    country: {
      type: String,
      required: true,
      description: "ISO 3166-1 alpha-2 country code",
    },
  },
  { _id: false },
);

/**
 * Group Stats Sub-document
 */
const GroupStatsSchema = new Schema(
  {
    memberCount: {
      type: Number,
      default: 0,
      min: 0,
      description: "Total number of members",
    },
    postCount: {
      type: Number,
      default: 0,
      min: 0,
      description: "Total number of posts",
    },
    weeklyActive: {
      type: Number,
      default: 0,
      min: 0,
      description: "Weekly active members",
    },
  },
  { _id: false },
);

// ============================================
// MAIN GROUP SCHEMA
// ============================================

/**
 * IGroup Interface
 * TypeScript interface for Group Document
 */
export interface IGroup extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  banner?: string;
  icon?: string;
  type: GroupType;
  category?: string;
  location?: {
    city: string;
    country: string;
  };
  adminId: mongoose.Types.ObjectId;
  moderators: mongoose.Types.ObjectId[];
  stats: {
    memberCount: number;
    postCount: number;
    weeklyActive: number;
  };
  rules: string[];
  pinnedPostIds: mongoose.Types.ObjectId[];
  status: "active" | "inactive" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Group Schema Definition
 */
export const GroupSchema = new Schema<IGroup>(
  {
    // ========================================
    // CORE FIELDS
    // ========================================

    name: {
      type: String,
      required: [true, "Group name is required"],
      maxlength: 100,
      description: "Group name",
    },

    slug: {
      type: String,
      required: [true, "Group slug is required"],
      unique: true,
      lowercase: true,
      description: "URL-safe group identifier",
    },

    description: {
      type: String,
      maxlength: 500,
      description: "Group description",
    },

    banner: {
      type: String,
      description: "Group banner image URL",
    },

    icon: {
      type: String,
      description: "Group icon URL",
    },

    // ========================================
    // TYPE & CATEGORY
    // ========================================

    type: {
      type: String,
      enum: {
        values: ["public", "private", "seller_only"],
        message: "Invalid group type",
      },
      default: "public",
      description: "Group visibility type",
    },

    category: {
      type: String,
      description: "Group category",
    },

    location: {
      type: GroupLocationSchema,
      description: "Group location",
    },

    // ========================================
    // ADMIN & MODERATORS
    // ========================================

    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Admin ID is required"],
      description: "Group admin user",
    },

    moderators: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        description: "Array of moderator user IDs",
      },
    ],

    // ========================================
    // STATS
    // ========================================

    stats: {
      type: GroupStatsSchema,
      default: () => ({
        memberCount: 0,
        postCount: 0,
        weeklyActive: 0,
      }),
      description: "Group statistics",
    },

    // ========================================
    // RULES
    // ========================================

    rules: [
      {
        type: String,
        description: "Group rules",
      },
    ],

    // ========================================
    // PINNED POSTS
    // ========================================

    pinnedPostIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "posts",
        description: "Pinned post IDs",
      },
    ],

    // ========================================
    // STATUS
    // ========================================

    status: {
      type: String,
      enum: {
        values: ["active", "inactive", "archived"],
        message: "Invalid group status",
      },
      default: "active",
      description: "Group status",
    },
  },
  {
    // ========================================
    // SCHEMA OPTIONS
    // ========================================
    timestamps: true,
    collection: "groups",
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        (ret as any).id = ret._id;
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

// Slug unique index
GroupSchema.index({ slug: 1 }, { unique: true, name: "slug_unique" });

// Type index
GroupSchema.index({ type: 1 }, { name: "type_idx" });

// Category index
GroupSchema.index({ category: 1 }, { name: "category_idx" });

// Status index
GroupSchema.index({ status: 1 }, { name: "status_idx" });

// Admin ID index
GroupSchema.index({ adminId: 1 }, { name: "admin_id_idx" });

// Location index
GroupSchema.index(
  { "location.city": 1, "location.country": 1 },
  { name: "location_idx" },
);

// Created at index
GroupSchema.index({ createdAt: -1 }, { name: "created_at_idx" });

// ============================================
// VIRTUALS
// ============================================

/**
 * Virtual for group URL
 */
GroupSchema.virtual("url").get(function () {
  return `/community/group/${this.slug}`;
});

/**
 * Virtual for is public
 */
GroupSchema.virtual("isPublic").get(function () {
  return this.type === "public";
});

/**
 * Virtual for member count
 */
GroupSchema.virtual("memberCount").get(function () {
  return this.stats?.memberCount || 0;
});

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find group by slug
 */
GroupSchema.statics.findBySlug = function (slug: string) {
  return this.findOne({ slug });
};

/**
 * Find groups by type
 */
GroupSchema.statics.findByType = function (type: GroupType) {
  return this.find({ type, status: "active" }).sort({
    "stats.memberCount": -1,
  });
};

/**
 * Find groups by category
 */
GroupSchema.statics.findByCategory = function (category: string) {
  return this.find({ category, status: "active" }).sort({
    "stats.memberCount": -1,
  });
};

/**
 * Find public groups
 */
GroupSchema.statics.findPublic = function (limit: number = 20) {
  return this.find({ type: "public", status: "active" })
    .sort({ "stats.memberCount": -1 })
    .limit(limit);
};

/**
 * Search groups
 */
GroupSchema.statics.search = function (query: string) {
  return this.find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ],
    status: "active",
  });
};

/**
 * Get popular groups
 */
GroupSchema.statics.getPopular = function (limit: number = 10) {
  return this.find({ status: "active" })
    .sort({ "stats.memberCount": -1 })
    .limit(limit);
};

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Add moderator
 */
GroupSchema.methods.addModerator = function (userId: mongoose.Types.ObjectId) {
  if (!this.moderators.includes(userId)) {
    this.moderators.push(userId);
  }
  return this.save();
};

/**
 * Remove moderator
 */
GroupSchema.methods.removeModerator = function (
  userId: mongoose.Types.ObjectId,
) {
  const index = this.moderators.indexOf(userId);
  if (index > -1) {
    this.moderators.splice(index, 1);
  }
  return this.save();
};

/**
 * Check if user is admin
 */
GroupSchema.methods.isAdmin = function (
  userId: mongoose.Types.ObjectId,
): boolean {
  return this.adminId.toString() === userId.toString();
};

/**
 * Check if user is moderator
 */
GroupSchema.methods.isModerator = function (
  userId: mongoose.Types.ObjectId,
): boolean {
  return this.moderators.some((m) => m.toString() === userId.toString());
};

/**
 * Pin post
 */
GroupSchema.methods.pinPost = function (postId: mongoose.Types.ObjectId) {
  if (!this.pinnedPostIds.includes(postId)) {
    this.pinnedPostIds.push(postId);
  }
  return this.save();
};

/**
 * Unpin post
 */
GroupSchema.methods.unpinPost = function (postId: mongoose.Types.ObjectId) {
  const index = this.pinnedPostIds.indexOf(postId);
  if (index > -1) {
    this.pinnedPostIds.splice(index, 1);
  }
  return this.save();
};

/**
 * Increment member count
 */
GroupSchema.methods.incrementMembers = function () {
  this.stats.memberCount += 1;
  return this.save();
};

/**
 * Decrement member count
 */
GroupSchema.methods.decrementMembers = function () {
  this.stats.memberCount = Math.max(0, this.stats.memberCount - 1);
  return this.save();
};

/**
 * Increment post count
 */
GroupSchema.methods.incrementPosts = function () {
  this.stats.postCount += 1;
  return this.save();
};

/**
 * Archive group
 */
GroupSchema.methods.archive = function () {
  this.status = "archived";
  return this.save();
};

/**
 * Activate group
 */
GroupSchema.methods.activate = function () {
  this.status = "active";
  return this.save();
};

// ============================================
// EXPORT MODEL
// ============================================

export const Group: Model<IGroup> =
  (mongoose.models.Group as Model<IGroup>) ||
  mongoose.model<IGroup>("Group", GroupSchema);

export default Group;
