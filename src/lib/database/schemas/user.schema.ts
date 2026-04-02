import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * User Collection Schema
 *
 * The master identity record. Every human on the platform has one user document.
 *
 * @field email - Unique user email (indexed, required)
 * @field passwordHash - Bcrypt hashed password
 * @field phone - Unique phone number with country code
 * @field role - User role: buyer, seller, both, or admin
 * @field profile - User profile information
 * @field reputation - User reputation and trust score
 * @field wallet - User wallet for platform currency
 * @field auth - Authentication related fields
 * @field preferences - User preferences and settings
 * @field kycStatus - Know Your Customer verification status
 * @field deletedAt - Soft delete timestamp
 */

// ============================================
// SUB-SCHEMAS
// ============================================

/**
 * User Profile Sub-document
 * Contains public profile information
 */
const UserLocationSchema = new Schema(
  {
    city: {
      type: String,
      required: true,
      description: 'City name e.g., "Kigali", "Nairobi"',
    },
    country: {
      type: String,
      required: true,
      description: 'ISO 3166-1 alpha-2 country code e.g., "RW", "KE"',
    },
  },
  { _id: false },
);

const UserProfileSchema = new Schema(
  {
    displayName: {
      type: String,
      required: false, // Made optional for backward compatibility with legacy data
      description: "Public display name shown to other users",
    },
    avatar: {
      type: String,
      description: "URL to avatar image stored in CDN",
    },
    bio: {
      type: String,
      maxlength: 500,
      description: "Short user biography",
    },
    location: {
      type: UserLocationSchema,
      description: "User location (city and country)",
    },
    language: {
      type: String,
      default: "en",
      description: "Preferred language code (en, fr, sw, etc.)",
    },
  },
  { _id: false },
);

/**
 * User Reputation Sub-document
 * Tracks user reputation score, level, and badges
 */
const UserReputationSchema = new Schema(
  {
    score: {
      type: Number,
      default: 0,
      min: 0,
      description: "Reputation score (calculated from various activities)",
    },
    level: {
      type: String,
      enum: ["newcomer", "active", "trusted", "leader", "pro"],
      default: "newcomer",
      description: "Reputation level based on score thresholds",
    },
    badges: [
      {
        type: String,
        description:
          'Array of badge identifiers e.g., ["early_adopter", "top_reviewer"]',
      },
    ],
    disputesFiled: {
      type: Number,
      default: 0,
      min: 0,
      description: "Number of disputes user has filed against others",
    },
    disputesLost: {
      type: Number,
      default: 0,
      min: 0,
      description: "Number of disputes user has lost",
    },
  },
  { _id: false },
);

/**
 * User Wallet Sub-document
 * Platform wallet for storing balance and handling refunds
 */
const UserWalletSchema = new Schema(
  {
    balance: {
      type: Number,
      default: 0,
      min: 0,
      description: "Available balance in smallest currency unit (RWF centimes)",
    },
    currency: {
      type: String,
      default: "RWF",
      description: "Currency code (RWF, KES, USD, etc.)",
    },
    pendingRefunds: {
      type: Number,
      default: 0,
      min: 0,
      description: "Amount of pending refunds in smallest currency unit",
    },
  },
  { _id: false },
);

/**
 * User Authentication Sub-document
 * Authentication and security related fields
 */
const UserAuthSchema = new Schema(
  {
    emailVerified: {
      type: Boolean,
      default: false,
      description: "Whether email has been verified",
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
      description: "Whether 2FA is enabled for this account",
    },
    lastLogin: {
      type: Date,
      description: "Timestamp of most recent login",
    },
    loginProvider: {
      type: String,
      enum: ["email", "google", "apple"],
      default: "email",
      description: "Method used for authentication",
    },
  },
  { _id: false },
);

/**
 * User Notifications Preferences Sub-document
 */
const NotificationPreferencesSchema = new Schema(
  {
    email: {
      type: Boolean,
      default: true,
      description: "Receive email notifications",
    },
    push: {
      type: Boolean,
      default: true,
      description: "Receive push notifications",
    },
    sms: {
      type: Boolean,
      default: false,
      description: "Receive SMS notifications",
    },
  },
  { _id: false },
);

/**
 * User Preferences Sub-document
 * User settings and saved data
 */
const UserPreferencesSchema = new Schema(
  {
    notifications: {
      type: NotificationPreferencesSchema,
      default: () => ({}),
      description: "Notification channel preferences",
    },
    savedSearches: [
      {
        type: String,
        description: "User saved search queries",
      },
    ],
    wishlist: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
        description: "Array of product IDs in user wishlist",
      },
    ],
    followedSellers: [
      {
        type: Schema.Types.ObjectId,
        ref: "Seller",
        description: "Array of seller IDs user follows",
      },
    ],
  },
  { _id: false },
);

// ============================================
// MAIN USER SCHEMA
// ============================================

/**
 * IUser Interface
 * TypeScript interface for User Document
 */
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  password?: string; // Backward compatibility for legacy data
  name?: string; // Backward compatibility for legacy data
  phone: string;
  role: "buyer" | "seller" | "both" | "admin" | "super_admin";
  profile: {
    displayName: string;
    avatar?: string;
    bio?: string;
    location: {
      city: string;
      country: string;
    };
    language: string;
  };
  reputation: {
    score: number;
    level: "newcomer" | "active" | "trusted" | "leader" | "pro";
    badges: string[];
    disputesFiled: number;
    disputesLost: number;
  };
  wallet: {
    balance: number;
    currency: string;
    pendingRefunds: number;
  };
  auth: {
    emailVerified: boolean;
    twoFactorEnabled: boolean;
    lastLogin?: Date;
    loginProvider: "email" | "google" | "apple";
  };
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    savedSearches: string[];
    wishlist: mongoose.Types.ObjectId[];
    followedSellers: mongoose.Types.ObjectId[];
  };
  kycStatus: "none" | "pending" | "verified" | "rejected";
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * User Schema Definition
 */
export const UserSchema = new Schema<IUser>(
  {
    // ========================================
    // CORE IDENTITY FIELDS
    // ========================================

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      description: "Unique user email address",
    },

    passwordHash: {
      type: String,
      required: false, // Made optional for backward compatibility with legacy data
      description: "Bcrypt hashed password",
    },

    password: {
      type: String,
      description: "Legacy password field for backward compatibility",
    },

    name: {
      type: String,
      description: "Legacy name field for backward compatibility",
    },

    phone: {
      type: String,
      sparse: true,
      unique: true,
      description:
        "International phone number with country code e.g., +250788000000",
    },

    role: {
      type: String,
      enum: {
        values: ["buyer", "seller", "both", "admin", "super_admin"],
        message: "Role must be buyer, seller, both, admin, or super_admin",
      },
      default: "buyer",
      description: "User role determines platform permissions",
    },

    // ========================================
    // PROFILE FIELDS
    // ========================================

    profile: {
      type: UserProfileSchema,
      required: false, // Made optional for backward compatibility with legacy data
      description: "Public profile information",
    },

    // ========================================
    // REPUTATION FIELDS
    // ========================================

    reputation: {
      type: UserReputationSchema,
      default: () => ({
        score: 0,
        level: "newcomer",
        badges: [],
        disputesFiled: 0,
        disputesLost: 0,
      }),
      description: "User reputation and trust metrics",
    },

    // ========================================
    // WALLET FIELDS
    // ========================================

    wallet: {
      type: UserWalletSchema,
      default: () => ({
        balance: 0,
        currency: "RWF",
        pendingRefunds: 0,
      }),
      description: "Platform wallet for user balance",
    },

    // ========================================
    // AUTHENTICATION FIELDS
    // ========================================

    auth: {
      type: UserAuthSchema,
      default: () => ({
        emailVerified: false,
        twoFactorEnabled: false,
        loginProvider: "email",
      }),
      description: "Authentication and security settings",
    },

    // ========================================
    // PREFERENCES FIELDS
    // ========================================

    preferences: {
      type: UserPreferencesSchema,
      default: () => ({
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
        savedSearches: [],
        wishlist: [],
        followedSellers: [],
      }),
      description: "User preferences and saved data",
    },

    // ========================================
    // KYC FIELDS
    // ========================================

    kycStatus: {
      type: String,
      enum: {
        values: ["none", "pending", "verified", "rejected"],
        message: "Invalid KYC status",
      },
      default: "none",
      description: "Know Your Customer verification status",
    },

    // ========================================
    // SOFT DELETE FIELD
    // ========================================

    deletedAt: {
      type: Date,
      description: "Soft delete timestamp (null if not deleted)",
    },
  },
  {
    // ========================================
    // SCHEMA OPTIONS
    // ========================================
    timestamps: true, // Automatically add createdAt and updatedAt
    collection: "users",
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // Remove sensitive fields from JSON output
        delete ret.passwordHash;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  },
);

// ============================================
// INDEXES
// ============================================

// Unique email index
UserSchema.index({ email: 1 }, { unique: true, name: "email_unique" });

// Unique phone index (sparse for optional field)
UserSchema.index(
  { phone: 1 },
  { sparse: true, unique: true, name: "phone_unique" },
);

// Role index for filtering
UserSchema.index({ role: 1 }, { name: "role_idx" });

// Reputation score index for leaderboards
UserSchema.index({ "reputation.score": -1 }, { name: "reputation_score_idx" });

// Created at index for sorting
UserSchema.index({ createdAt: -1 }, { name: "created_at_idx" });

// Soft delete filter - only show non-deleted by default
UserSchema.index({ deletedAt: 1 }, { name: "deleted_at_idx" });

// Compound index for user search
UserSchema.index(
  { "profile.displayName": "text", email: "text" },
  { name: "user_search_idx" },
);

// ============================================
// VIRTUALS
// ============================================

/**
 * Virtual for user's full name
 */
UserSchema.virtual("fullName").get(function () {
  return this.profile?.displayName;
});

/**
 * Virtual for checking if user is verified
 */
UserSchema.virtual("isVerified").get(function () {
  return this.auth?.emailVerified && this.kycStatus === "verified";
});

/**
 * Virtual for user's available wallet balance
 */
UserSchema.virtual("availableBalance").get(function () {
  return this.wallet?.balance - this.wallet?.pendingRefunds;
});

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find user by email (case insensitive)
 */
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Find user by phone
 */
UserSchema.statics.findByPhone = function (phone: string) {
  return this.findOne({ phone });
};

/**
 * Get top reputation users
 */
UserSchema.statics.getTopReputation = function (limit: number = 10) {
  return this.find({ deletedAt: null })
    .sort({ "reputation.score": -1 })
    .limit(limit);
};

/**
 * Get users by role
 */
UserSchema.statics.findByRole = function (role: string, options?: any) {
  return this.find({ role, deletedAt: null }, null, options);
};

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Check if user has a specific role
 */
UserSchema.methods.hasRole = function (
  role: "buyer" | "seller" | "both" | "admin",
): boolean {
  return this.role === role || this.role === "both" || this.role === "admin";
};

/**
 * Soft delete user
 */
UserSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  return this.save();
};

/**
 * Restore soft deleted user
 */
UserSchema.methods.restore = function () {
  this.deletedAt = undefined;
  return this.save();
};

/**
 * Update reputation score
 */
UserSchema.methods.updateReputation = function (scoreDelta: number) {
  this.reputation.score += scoreDelta;

  // Update level based on score thresholds
  if (this.reputation.score >= 1000) {
    this.reputation.level = "pro";
  } else if (this.reputation.score >= 500) {
    this.reputation.level = "leader";
  } else if (this.reputation.score >= 200) {
    this.reputation.level = "trusted";
  } else if (this.reputation.score >= 50) {
    this.reputation.level = "active";
  } else {
    this.reputation.level = "newcomer";
  }

  return this.save();
};

/**
 * Add to wallet
 */
UserSchema.methods.addToWallet = function (
  amount: number,
  isRefund: boolean = false,
) {
  if (isRefund) {
    this.wallet.pendingRefunds += amount;
  } else {
    this.wallet.balance += amount;
  }
  return this.save();
};

/**
 * Deduct from wallet
 */
UserSchema.methods.deductFromWallet = async function (
  amount: number,
): Promise<boolean> {
  if (this.wallet.balance >= amount) {
    this.wallet.balance -= amount;
    await this.save();
    return true;
  }
  return false;
};

// ============================================
// EXPORT MODEL
// ============================================

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
