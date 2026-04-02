import mongoose, { Schema, Document, Model } from "mongoose";
import type {
  IUserEvent,
  HipaEventType,
  EventEntityType,
  DeviceType,
  IUserProfileAI,
  IAdImpression,
  IAdClick,
  IChatbotSession,
  IFraudSignal,
} from "@/types/ai";

// ============================================
// USER EVENTS SCHEMA (Part 1 - Signal Collection)
// ============================================

export interface IUserEventDocument extends Omit<IUserEvent, "_id">, Document {}

const EventEntitySchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        "product",
        "seller",
        "post",
        "review",
        "search",
        "ad",
        "category",
      ] as EventEntityType[],
      required: true,
    },
    id: {
      type: Schema.Types.ObjectId,
      required: true,
    },
  },
  { _id: false },
);

const EventContextSchema = new Schema(
  {
    page: { type: String, required: true },
    query: String,
    position: Number,
    source: {
      type: String,
      enum: ["search", "feed", "recommendation", "ad", "direct"],
    },
  },
  { _id: false },
);

const EventLocationSchema = new Schema(
  {
    city: { type: String, required: true },
    country: { type: String, required: true },
    coords: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: "2dsphere",
      },
    },
  },
  { _id: false },
);

const UserEventSchema = new Schema<IUserEventDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    event: {
      type: String,
      enum: [
        "product_view",
        "product_click",
        "add_to_cart",
        "remove_from_cart",
        "purchase",
        "search_query",
        "search_no_results",
        "search_result_click",
        "seller_view",
        "seller_follow",
        "post_view",
        "post_like",
        "post_share",
        "review_read",
        "wishlist_add",
        "wishlist_remove",
        "ad_impression",
        "ad_click",
        "ad_conversion",
        "session_start",
        "session_end",
      ] as HipaEventType[],
      required: true,
      index: true,
    },
    entity: {
      type: EventEntitySchema,
      required: true,
    },
    context: {
      type: EventContextSchema,
      required: true,
    },
    device: {
      type: String,
      enum: ["mobile", "tablet", "desktop"] as DeviceType[],
      default: "mobile",
    },
    location: {
      type: EventLocationSchema,
      required: true,
    },
    ts: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: false,
    timeseries: {
      timeField: "ts",
      metaField: "event",
      granularity: "hours",
    },
  },
);

// Indexes for common query patterns
UserEventSchema.index({ userId: 1, event: 1, ts: -1 });
UserEventSchema.index({ "entity.type": 1, "entity.id": 1, ts: -1 });
UserEventSchema.index({ sessionId: 1, ts: 1 });
UserEventSchema.index({ event: 1, ts: -1 });

// TTL index - keep raw events for 90 days
UserEventSchema.index({ ts: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const UserEvent =
  (mongoose.models.UserEvent as Model<IUserEventDocument>) ||
  mongoose.model<IUserEventDocument>("UserEvent", UserEventSchema);

// ============================================
// USER PROFILES AI SCHEMA (Part 2)
// ============================================

export interface IUserProfileAIDocument
  extends Omit<IUserProfileAI, "_id">, Document {}

const UserProfileAISchema = new Schema<IUserProfileAIDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
    index: true,
  },
  embeddingVector: {
    type: [Number],
    required: true,
    select: false, // Don't include in regular queries for privacy
  },
  topCategories: [String],
  topBrands: [String],
  priceRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
  },
  interestSegments: [String],
  lookalikes: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  coldStart: {
    type: Boolean,
    default: true,
  },
  trendingCategories: [String],
  trendingProducts: [
    {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
});

UserProfileAISchema.index({ interestSegments: 1 });
UserProfileAISchema.index({ topCategories: 1 });
UserProfileAISchema.index({ coldStart: 1 });

export const UserProfileAI =
  (mongoose.models.UserProfileAI as Model<IUserProfileAIDocument>) ||
  mongoose.model<IUserProfileAIDocument>("UserProfileAI", UserProfileAISchema);

// ============================================
// AD IMPRESSIONS SCHEMA (Part 6)
// ============================================

export interface IAdImpressionDocument
  extends Omit<IAdImpression, "_id">, Document {}

const AdImpressionSchema = new Schema<IAdImpressionDocument>({
  campaignId: {
    type: Schema.Types.ObjectId,
    ref: "AdCampaign",
    required: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null,
    index: true,
  },
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  adRank: {
    type: Number,
    required: true,
  },
  qualityScore: {
    type: Number,
    required: true,
  },
  actualCPC: {
    type: Number,
    required: true,
  },
  position: {
    type: Number,
    required: true,
  },
  ts: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

AdImpressionSchema.index({ campaignId: 1, ts: -1 });
AdImpressionSchema.index({ userId: 1, ts: -1 });

export const AdImpression =
  (mongoose.models.AdImpression as Model<IAdImpressionDocument>) ||
  mongoose.model<IAdImpressionDocument>("AdImpression", AdImpressionSchema);

// ============================================
// AD CLICKS SCHEMA (Part 6)
// ============================================

export interface IAdClickDocument extends Omit<IAdClick, "_id">, Document {}

const AdClickSchema = new Schema<IAdClickDocument>({
  impressionId: {
    type: Schema.Types.ObjectId,
    ref: "AdImpression",
    required: true,
    index: true,
  },
  campaignId: {
    type: Schema.Types.ObjectId,
    ref: "AdCampaign",
    required: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null,
    index: true,
  },
  ts: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

AdClickSchema.index({ campaignId: 1, ts: -1 });
AdClickSchema.index({ userId: 1, ts: -1 });

export const AdClick =
  (mongoose.models.AdClick as Model<IAdClickDocument>) ||
  mongoose.model<IAdClickDocument>("AdClick", AdClickSchema);

// ============================================
// CHATBOT SESSION SCHEMA (Part 10)
// ============================================

export interface IChatbotSessionDocument
  extends Omit<IChatbotSession, "_id">, Document {}

const ChatbotMessageSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    ts: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const ChatbotSessionSchema = new Schema<IChatbotSessionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },
    messages: [ChatbotMessageSchema],
    resolved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

ChatbotSessionSchema.index({ userId: 1, storeId: 1 });
ChatbotSessionSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: 24 * 60 * 60 },
); // 24 hours

export const ChatbotSession =
  (mongoose.models.ChatbotSession as Model<IChatbotSessionDocument>) ||
  mongoose.model<IChatbotSessionDocument>(
    "ChatbotSession",
    ChatbotSessionSchema,
  );

// ============================================
// FRAUD SIGNALS SCHEMA (Part 11)
// ============================================

export interface IFraudSignalDocument
  extends Omit<IFraudSignal, "_id">, Document {}

const FraudSignalSchema = new Schema<IFraudSignalDocument>(
  {
    type: {
      type: String,
      enum: [
        "fake_review",
        "dispute_abuse",
        "seller_fraud",
        "account_takeover",
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
      index: true,
    },
    entity: {
      type: {
        type: String,
        enum: ["user", "seller", "order", "review"],
        required: true,
      },
      id: {
        type: Schema.Types.ObjectId,
        required: true,
      },
    },
    evidence: {
      type: Schema.Types.Mixed,
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    recommendedAction: {
      type: String,
      enum: ["watch", "flag", "suspend", "ban"],
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

FraudSignalSchema.index({ "entity.type": 1, "entity.id": 1 });
FraudSignalSchema.index({ severity: 1, createdAt: -1 });
FraudSignalSchema.index({ recommendedAction: 1 });

export const FraudSignal =
  (mongoose.models.FraudSignal as Model<IFraudSignalDocument>) ||
  mongoose.model<IFraudSignalDocument>("FraudSignal", FraudSignalSchema);

// ============================================
// PRODUCT EMBEDDINGS SCHEMA (Part 2)
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface IProductEmbeddingDocument extends Document {
  productId: Schema.Types.ObjectId;
  embeddingVector: number[];
  generatedAt: Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any;
}

const ProductEmbeddingSchema = new Schema<IProductEmbeddingDocument>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
    unique: true,
    index: true,
  },
  embeddingVector: {
    type: [Number],
    required: true,
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
  model: {
    type: String,
    enum: ["openai-embedding-3-small", "local-model"],
    default: "openai-embedding-3-small",
  },
});

ProductEmbeddingSchema.index({ embeddingVector: "2dsphere" }); // For vector search

export const ProductEmbedding =
  (mongoose.models.ProductEmbedding as Model<IProductEmbeddingDocument>) ||
  mongoose.model<IProductEmbeddingDocument>(
    "ProductEmbedding",
    ProductEmbeddingSchema,
  );
