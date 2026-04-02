import mongoose, { Schema, Document } from "mongoose";

// ============================================
// BADGE DEFINITIONS
// ============================================

export type BadgeCategory =
  | "engagement" // Likes, comments, shares
  | "sales" // Purchase-related badges
  | "contribution" // Community contributions
  | "trust" // Verification, KYC
  | "special" // Limited/seasonal badges
  | "milestone"; // Streaks & counts

export interface IBadgeDefinition extends Document {
  _id: mongoose.Types.ObjectId;
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  points: number;
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  criteria: {
    type:
      | "points"
      | "purchases"
      | "sales"
      | "reviews"
      | "questions"
      | "answers"
      | "posts"
      | "followers"
      | "streak"
      | "referrals";
    operator: "gte" | "eq" | "lte";
    value: number;
  };
  rarity: number; // 0-100, lower = more rare
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

const BadgeDefinitionSchema = new Schema<IBadgeDefinition>(
  {
    badgeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "engagement",
        "sales",
        "contribution",
        "trust",
        "special",
        "milestone",
      ],
      required: true,
    },
    points: { type: Number, default: 0 },
    tier: {
      type: String,
      enum: ["bronze", "silver", "gold", "platinum", "diamond"],
      default: "bronze",
    },
    criteria: {
      type: {
        type: String,
        enum: [
          "points",
          "purchases",
          "sales",
          "reviews",
          "questions",
          "answers",
          "posts",
          "followers",
          "streak",
          "referrals",
        ],
      },
      operator: { type: String, enum: ["gte", "eq", "lte"] },
      value: { type: Number },
    },
    rarity: { type: Number, default: 50, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
    expiresAt: Date,
  },
  {
    timestamps: true,
  },
);

// ============================================
// USER REPUTATION
// ============================================

export type UserLevel =
  | "newcomer" // 0-49 points
  | "active_member" // 50-199 points
  | "trusted_contributor" // 200-499 points
  | "community_leader" // 500-999 points
  | "hipa_pro"; // 1000+ points

export interface IUserReputation extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  points: number;
  level: UserLevel;
  streak: {
    current: number;
    longest: number;
    lastActivityAt: Date;
  };
  badges: Array<{
    badgeId: string;
    earnedAt: Date;
    earnedFrom: "auto" | "manual";
  }>;
  stats: {
    totalPosts: number;
    totalComments: number;
    totalQuestions: number;
    totalAnswers: number;
    totalReviews: number;
    totalLikesReceived: number;
    totalUpvotesReceived: number;
    productsPurchased: number;
    productsSold: number;
    followersCount: number;
    followingCount: number;
    referralCount: number;
  };
  pointsHistory: Array<{
    points: number;
    action: string;
    description: string;
    createdAt: Date;
  }>;
  achievements: Array<{
    achievementId: string;
    unlockedAt: Date;
    progress: number;
    target: number;
  }>;
  weeklyRank: number;
  monthlyRank: number;
  allTimeRank: number;
  lastCalculatedAt: Date;
}

const UserReputationSchema = new Schema<IUserReputation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    points: { type: Number, default: 0 },
    level: {
      type: String,
      enum: [
        "newcomer",
        "active_member",
        "trusted_contributor",
        "community_leader",
        "hipa_pro",
      ],
      default: "newcomer",
    },
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActivityAt: { type: Date, default: Date.now },
    },
    badges: [
      {
        badgeId: { type: String, required: true },
        earnedAt: { type: Date, default: Date.now },
        earnedFrom: { type: String, enum: ["auto", "manual"], default: "auto" },
      },
    ],
    stats: {
      totalPosts: { type: Number, default: 0 },
      totalComments: { type: Number, default: 0 },
      totalQuestions: { type: Number, default: 0 },
      totalAnswers: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
      totalLikesReceived: { type: Number, default: 0 },
      totalUpvotesReceived: { type: Number, default: 0 },
      productsPurchased: { type: Number, default: 0 },
      productsSold: { type: Number, default: 0 },
      followersCount: { type: Number, default: 0 },
      followingCount: { type: Number, default: 0 },
      referralCount: { type: Number, default: 0 },
    },
    pointsHistory: [
      {
        points: { type: Number, required: true },
        action: { type: String, required: true },
        description: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    achievements: [
      {
        achievementId: String,
        unlockedAt: { type: Date, default: Date.now },
        progress: { type: Number, default: 0 },
        target: { type: Number },
      },
    ],
    weeklyRank: { type: Number, default: 0 },
    monthlyRank: { type: Number, default: 0 },
    allTimeRank: { type: Number, default: 0 },
    lastCalculatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

// Index removed - unique is already defined in the field
UserReputationSchema.index({ points: -1 });
UserReputationSchema.index({ level: 1 });
UserReputationSchema.index({ "streak.current": -1 });

// ============================================
// MODERATION REPORT
// ============================================

export type ReportType =
  | "post"
  | "comment"
  | "question"
  | "answer"
  | "user"
  | "product"
  | "seller"
  | "group";
export type ReportReason =
  | "spam"
  | "harassment"
  | "inappropriate_content"
  | "misinformation"
  | "scam_fraud"
  | "fake_review"
  | "price_gouging"
  | "prohibited_item"
  | "intellectual_property"
  | "other";

export type ReportStatus =
  | "pending"
  | "under_review"
  | "resolved"
  | "dismissed"
  | "escalated";

export interface IModerationReport extends Document {
  _id: mongoose.Types.ObjectId;
  reportId: string;
  reporter: {
    userId: mongoose.Types.ObjectId;
    name: string;
    email: string;
  };
  type: ReportType;
  targetId: mongoose.Types.ObjectId;
  reason: ReportReason;
  description: string;
  evidence?: Array<{
    type: "image" | "video" | "link";
    url: string;
    description?: string;
  }>;
  status: ReportStatus;
  severity: "low" | "medium" | "high" | "critical";
  assignedTo?: mongoose.Types.ObjectId;
  resolution?: {
    action: "deleted" | "warned" | "suspended" | "banned" | "no_action";
    notes: string;
    resolvedBy: mongoose.Types.ObjectId;
    resolvedAt: Date;
  };
  aiFlags?: Array<{
    flag: string;
    confidence: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ModerationReportSchema = new Schema<IModerationReport>(
  {
    reportId: { type: String, required: true, unique: true },
    reporter: {
      userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
      email: { type: String, required: true },
    },
    type: {
      type: String,
      enum: [
        "post",
        "comment",
        "question",
        "answer",
        "user",
        "product",
        "seller",
        "group",
      ],
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reason: {
      type: String,
      enum: [
        "spam",
        "harassment",
        "inappropriate_content",
        "misinformation",
        "scam_fraud",
        "fake_review",
        "price_gouging",
        "prohibited_item",
        "intellectual_property",
        "other",
      ],
      required: true,
    },
    description: { type: String, required: true },
    evidence: [
      {
        type: { type: String, enum: ["image", "video", "link"] },
        url: String,
        description: String,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "under_review", "resolved", "dismissed", "escalated"],
      default: "pending",
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    resolution: {
      action: {
        type: String,
        enum: ["deleted", "warned", "suspended", "banned", "no_action"],
      },
      notes: String,
      resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
      resolvedAt: { type: Date },
    },
    aiFlags: [
      {
        flag: String,
        confidence: { type: Number, min: 0, max: 1 },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Index removed - unique is already defined in the field
ModerationReportSchema.index({ status: 1, createdAt: -1 });
ModerationReportSchema.index({ targetId: 1, type: 1 });

// ============================================
// USER WARNINGS & STRIKES
// ============================================

export interface IUserStrike extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  strikeNumber: number;
  reason: string;
  description: string;
  penalty: "warning" | "suspension" | "ban";
  duration?: number; // days
  expiresAt?: Date;
  issuedBy: mongoose.Types.ObjectId;
  relatedReportId?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  expiresAtDate?: Date;
}

const UserStrikeSchema = new Schema<IUserStrike>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    strikeNumber: { type: Number, required: true },
    reason: { type: String, required: true },
    description: String,
    penalty: {
      type: String,
      enum: ["warning", "suspension", "ban"],
      required: true,
    },
    duration: Number,
    issuedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    relatedReportId: { type: Schema.Types.ObjectId, ref: "ModerationReport" },
    isActive: { type: Boolean, default: true },
    expiresAtDate: Date,
  },
  {
    timestamps: true,
  },
);

UserStrikeSchema.index({ userId: 1, isActive: 1 });
UserStrikeSchema.index({ expiresAtDate: 1 });

// ============================================
// CONTENT FLAGS (Auto-moderation)
// ============================================

export interface IContentFlag extends Document {
  _id: mongoose.Types.ObjectId;
  contentType: "post" | "comment" | "question" | "answer" | "review";
  contentId: mongoose.Types.ObjectId;
  flags: Array<{
    type: string;
    confidence: number;
    triggeredAt: Date;
  }>;
  autoAction: "approve" | "queue" | "reject";
  manualReviewRequired: boolean;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  finalDecision?: "approve" | "reject" | "escalate";
  notes?: string;
  createdAt: Date;
}

const ContentFlagSchema = new Schema<IContentFlag>(
  {
    contentType: {
      type: String,
      enum: ["post", "comment", "question", "answer", "review"],
      required: true,
    },
    contentId: { type: Schema.Types.ObjectId, required: true },
    flags: [
      {
        type: { type: String, required: true },
        confidence: { type: Number, min: 0, max: 1 },
        triggeredAt: { type: Date, default: Date.now },
      },
    ],
    autoAction: {
      type: String,
      enum: ["approve", "queue", "reject"],
      default: "queue",
    },
    manualReviewRequired: { type: Boolean, default: false },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    finalDecision: {
      type: String,
      enum: ["approve", "reject", "escalate"],
    },
    notes: String,
  },
  {
    timestamps: true,
  },
);

ContentFlagSchema.index({ contentType: 1, contentId: 1 });
ContentFlagSchema.index({ autoAction: 1, manualReviewRequired: 1 });

// ============================================
// LEADERBOARD
// ============================================

export interface ILeaderboardEntry extends Document {
  _id: mongoose.Types.ObjectId;
  period: "weekly" | "monthly" | "all_time";
  userId: mongoose.Types.ObjectId;
  userName: string;
  userAvatar?: string;
  userLevel: UserLevel;
  points: number;
  rank: number;
  metrics: {
    posts: number;
    comments: number;
    likes: number;
    answers: number;
  };
  calculatedAt: Date;
}

const LeaderboardEntrySchema = new Schema<ILeaderboardEntry>(
  {
    period: {
      type: String,
      enum: ["weekly", "monthly", "all_time"],
      required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userAvatar: String,
    userLevel: {
      type: String,
      enum: [
        "newcomer",
        "active_member",
        "trusted_contributor",
        "community_leader",
        "hipa_pro",
      ],
    },
    points: { type: Number, required: true },
    rank: { type: Number, required: true },
    metrics: {
      posts: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      answers: { type: Number, default: 0 },
    },
    calculatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

LeaderboardEntrySchema.index({ period: 1, rank: 1 });
LeaderboardEntrySchema.index({ period: 1, calculatedAt: -1 });

// ============================================
// EXPORTS
// ============================================

export const BadgeDefinition =
  mongoose.models.BadgeDefinition ||
  mongoose.model<IBadgeDefinition>("BadgeDefinition", BadgeDefinitionSchema);
export const UserReputation =
  mongoose.models.UserReputation ||
  mongoose.model<IUserReputation>("UserReputation", UserReputationSchema);
export const ModerationReport =
  mongoose.models.ModerationReport ||
  mongoose.model<IModerationReport>("ModerationReport", ModerationReportSchema);
export const UserStrike =
  mongoose.models.UserStrike ||
  mongoose.model<IUserStrike>("UserStrike", UserStrikeSchema);
export const ContentFlag =
  mongoose.models.ContentFlag ||
  mongoose.model<IContentFlag>("ContentFlag", ContentFlagSchema);
export const LeaderboardEntry =
  mongoose.models.LeaderboardEntry ||
  mongoose.model<ILeaderboardEntry>("LeaderboardEntry", LeaderboardEntrySchema);

// Schema exports already handled above
// export const BadgeDefinitionSchema = BadgeDefinition.schema;
// export const UserReputationSchema = UserReputation.schema;
// export const ModerationReportSchema = ModerationReport.schema;
// export const UserStrikeSchema = UserStrike.schema;
// export const ContentFlagSchema = ContentFlag.schema;
// export const LeaderboardEntrySchema = LeaderboardEntry.schema;

// ============================================
// POINTS SYSTEM CONFIGURATION
// ============================================

export const POINTS_CONFIG = {
  // Community Actions
  CREATE_POST: 10,
  CREATE_POST_IN_GROUP: 15,
  CREATE_QUESTION: 20,
  CREATE_ANSWER: 15,
  ANSWER_ACCEPTED: 50,
  WRITE_REVIEW: 25,
  SHARE_PRODUCT: 5,
  SHARE_POST: 3,

  // Interactions (received)
  RECEIVE_LIKE: 2,
  RECEIVE_UPVOTE: 5,
  RECEIVE_COMMENT: 3,
  REVIEW_RECEIVED_HELPUL: 10,

  // Engagement (given)
  LIKE_POST: 1,
  UPVOTE_ANSWER: 1,
  COMMENT: 2,
  FOLLOW_USER: 1,

  // Social
  GAIN_FOLLOWER: 3,

  // Commerce
  COMPLETE_PURCHASE: 20,
  COMPLETE_SALE: 30,
  VERIFIED_PURCHASE_REVIEW: 40,

  // Bonuses
  DAILY_LOGIN: 5,
  FIRST_POST_WEEK: 25,
  STREAK_BONUS: 0, // Calculated dynamically

  // Penalties (negative)
  POST_DELETED: -15,
  RECEIVE_REPORT: -20,
  RECEIVE_WARNING: -50,
};

// Dynamic streak bonus calculation
export function calculateStreakBonus(streak: number): number {
  return Math.min(streak * 2, 50);
}

// Level thresholds
export const LEVEL_THRESHOLDS = {
  newcomer: 0,
  active_member: 50,
  trusted_contributor: 200,
  community_leader: 500,
  hipa_pro: 1000,
};
