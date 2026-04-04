import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * GroupMember Collection Schema (Community)
 *
 * Separate collection to store group members - avoids document size limits for large groups.
 *
 * @field groupId - Reference to groups collection
 * @field userId - Reference to users collection
 * @field role - Member role (member, moderator, admin)
 * @field joinedAt - When user joined the group
 */

// Member Role Enum
export type GroupMemberRole = "member" | "moderator" | "admin";

/**
 * IGroupMember Interface
 * TypeScript interface for GroupMember Document
 */
export interface IGroupMember extends Document {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: GroupMemberRole;
  joinedAt: Date;
}

/**
 * GroupMember Schema Definition
 */
export const GroupMemberSchema = new Schema<IGroupMember>(
  {
    // ========================================
    // CORE FIELDS
    // ========================================

    groupId: {
      type: Schema.Types.ObjectId,
      ref: "groups",
      required: [true, "Group ID is required"],
      description: "Reference to group",
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      description: "Reference to user",
    },

    role: {
      type: String,
      enum: {
        values: ["member", "moderator", "admin"],
        message: "Invalid member role",
      },
      default: "member",
      description: "Member role in the group",
    },

    joinedAt: {
      type: Date,
      default: Date.now,
      description: "When user joined the group",
    },
  },
  {
    // ========================================
    // SCHEMA OPTIONS
    // ========================================
    timestamps: false,
    collection: "group_members",
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

// Compound unique index (one membership per user per group)
GroupMemberSchema.index(
  { groupId: 1, userId: 1 },
  { unique: true, name: "group_user_unique" },
);

// User ID index
GroupMemberSchema.index({ userId: 1 }, { name: "user_id_idx" });

// Role index
GroupMemberSchema.index({ groupId: 1, role: 1 }, { name: "group_role_idx" });

// Joined at index
GroupMemberSchema.index({ joinedAt: -1 }, { name: "joined_at_idx" });

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find membership
 */
GroupMemberSchema.statics.findMembership = function (
  groupId: string,
  userId: string,
) {
  return this.findOne({
    groupId: new mongoose.Types.ObjectId(groupId),
    userId: new mongoose.Types.ObjectId(userId),
  });
};

/**
 * Find group members
 */
GroupMemberSchema.statics.findByGroup = function (
  groupId: string,
  options?: { role?: string; limit?: number },
) {
  const query: any = { groupId: new mongoose.Types.ObjectId(groupId) };
  if (options?.role) {
    query.role = options.role;
  }

  return this.find(query)
    .populate("userId", "profile.displayName profile.avatar")
    .sort({ joinedAt: 1 })
    .limit(options?.limit || 100);
};

/**
 * Find user groups
 */
GroupMemberSchema.statics.findByUser = function (userId: string) {
  return this.find({ userId: new mongoose.Types.ObjectId(userId) })
    .populate("groupId", "name slug icon")
    .sort({ joinedAt: -1 });
};

/**
 * Check if user is member
 */
GroupMemberSchema.statics.isMember = async function (
  groupId: string,
  userId: string,
): Promise<boolean> {
  const membership = await this.findOne({
    groupId: new mongoose.Types.ObjectId(groupId),
    userId: new mongoose.Types.ObjectId(userId),
  });
  return !!membership;
};

/**
 * Get member count
 */
GroupMemberSchema.statics.getMemberCount = async function (
  groupId: string,
): Promise<number> {
  return this.countDocuments({ groupId: new mongoose.Types.ObjectId(groupId) });
};

/**
 * Get moderators and admins
 */
GroupMemberSchema.statics.getModerators = function (groupId: string) {
  return this.find({
    groupId: new mongoose.Types.ObjectId(groupId),
    role: { $in: ["moderator", "admin"] },
  }).populate("userId", "profile.displayName profile.avatar");
};

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Make member a moderator
 */
GroupMemberSchema.methods.makeModerator = function () {
  this.role = "moderator";
  return this.save();
};

/**
 * Remove moderator role
 */
GroupMemberSchema.methods.removeModerator = function () {
  this.role = "member";
  return this.save();
};

/**
 * Make member an admin
 */
GroupMemberSchema.methods.makeAdmin = function () {
  this.role = "admin";
  return this.save();
};

/**
 * Check if user is admin
 */
GroupMemberSchema.methods.isAdmin = function (): boolean {
  return this.role === "admin";
};

/**
 * Check if user is moderator
 */
GroupMemberSchema.methods.isModerator = function (): boolean {
  return this.role === "moderator" || this.role === "admin";
};

// ============================================
// EXPORT MODEL
// ============================================

export const GroupMember: Model<IGroupMember> =
  mongoose.models.GroupMember ||
  mongoose.model<IGroupMember>("GroupMember", GroupMemberSchema);

export default GroupMember;
