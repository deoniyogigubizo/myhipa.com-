import { ObjectId } from "mongodb";

// Re-export AI types
export * from "./ai";

// ============================================
// USER TYPES
// ============================================

export interface IUserLocation {
  city: string;
  country: string;
}

export interface IUserReputation {
  score: number;
  level:
    | "newcomer"
    | "active_member"
    | "trusted_contributor"
    | "community_leader"
    | "hipa_pro";
  badges: string[];
  disputesFiled: number;
  disputesLost: number;
}

export interface IUserWallet {
  balance: number;
  currency: string;
  pendingRefunds: number;
}

export interface IUserAuth {
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLogin: Date;
  loginProvider: "email" | "google" | "apple";
}

export interface IUserNotifications {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface IUserPreferences {
  notifications: IUserNotifications;
  savedSearches: string[];
  wishlist: ObjectId[];
  followedSellers: ObjectId[];
}

export interface IUser {
  _id: ObjectId;
  email: string;
  passwordHash?: string;
  password?: string; // Backward compatibility for legacy data
  name?: string; // Backward compatibility for legacy data
  phone?: string;
  role: "buyer" | "seller" | "both" | "admin" | "super_admin";
  profile: {
    displayName: string;
    avatar?: string;
    bio?: string;
    location?: IUserLocation;
    language?: string;
  };
  reputation: IUserReputation;
  wallet: IUserWallet;
  auth: IUserAuth;
  preferences: IUserPreferences;
  kycStatus: "none" | "pending" | "verified" | "rejected";
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// ============================================
// SELLER TYPES
// ============================================

export interface ISellerLocation {
  city: string;
  country: string;
  coords?: {
    type: "Point";
    coordinates: [number, number];
  };
}

export interface ISellerStore {
  name: string;
  slug: string;
  logo?: string;
  banner?: string;
  bio?: string;
  categories: string[];
  location: ISellerLocation;
  customUrl?: string;
}

export interface ISellerStats {
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
}

export interface ISellerWallet {
  available: number;
  pending: number;
  held: number;
  currency: string;
  totalWithdrawn: number;
}

export interface IPayoutMethod {
  type: "mobile_money" | "bank";
  provider?: string;
  number?: string;
  accountNumber?: string;
  bankName?: string;
  isPrimary: boolean;
}

export interface ISellerPolicies {
  shipping: string;
  returns: string;
  autoReply?: string;
}

export interface IShippingZone {
  zone: string;
  price: number;
  estimatedDays: number;
}

export interface ISeller {
  _id: ObjectId;
  userId: ObjectId;
  store: ISellerStore;
  tier: "standard" | "silver" | "gold" | "pro";
  feeRate: number;
  kycStatus: "none" | "pending" | "verified" | "rejected";
  kycDocs?: string[];
  verifiedAt?: Date;
  stats: ISellerStats;
  wallet: ISellerWallet;
  payoutMethods: IPayoutMethod[];
  policies: ISellerPolicies;
  shippingZones: IShippingZone[];
  businessHours?: Record<string, string | null>;
  onboardingStep: string;
  suspendedAt?: Date;
  suspendReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// PRODUCT TYPES
// ============================================

export interface IProductMedia {
  url: string;
  type: "image" | "video" | "video_360";
  isPrimary: boolean;
  order: number;
}

export interface IProductCategory {
  primary: string;
  secondary?: string;
  tertiary?: string;
  path: string[];
}

export interface IPricing {
  base: number;
  compareAt?: number;
  currency: string;
  bulkPricing?: {
    minQty: number;
    discountPct: number;
  }[];
}

export interface IProductVariant {
  _id: ObjectId;
  name: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
  sku?: string;
  barcode?: string;
}

export interface IInventory {
  totalStock: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorder: boolean;
}

export interface IShipping {
  weight: number;
  dimensions?: {
    l: number;
    w: number;
    h: number;
  };
  requiresShipping: boolean;
  digitalDownload: boolean;
}

export interface IProductSeo {
  metaTitle?: string;
  metaDescription?: string;
  customSlug?: string;
}

export interface IProductStats {
  views: number;
  addedToCart: number;
  purchased: number;
  conversionRate: number;
  avgRating: number;
  reviewCount: number;
  wishlistCount: number;
}

export interface IProduct {
  _id: ObjectId;
  sellerId: ObjectId;
  title: string;
  slug: string;
  description: string;
  category: IProductCategory;
  media: IProductMedia[];
  pricing: IPricing;
  variants: IProductVariant[];
  inventory: IInventory;
  shipping: IShipping;
  seo?: IProductSeo;
  stats: IProductStats;
  tags: string[];
  condition: "new" | "used" | "refurbished";
  status: "draft" | "active" | "paused" | "archived";
  embeddingVector?: number[];
  aiSuggestedPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// ORDER TYPES
// ============================================

export interface IOrderItem {
  productId: ObjectId;
  variantId?: ObjectId;
  title: string;
  image: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface IOrderPricing {
  subtotal: number;
  shippingFee: number;
  discount: number;
  couponCode?: string;
  total: number;
  currency: string;
  hipaFee: number;
  sellerPayout: number;
}

export interface IDeliveryAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  country: string;
  notes?: string;
}

export interface IOrderTracking {
  number?: string;
  courier?: string;
  proofUrl?: string;
  uploadedAt?: Date;
}

export interface IDelivery {
  method: string;
  address: IDeliveryAddress;
  estimatedDate?: Date;
  tracking?: IOrderTracking;
}

export type OrderStatus =
  | "pending_payment"
  | "payment_held"
  | "seller_processing"
  | "in_delivery"
  | "dispute_window"
  | "completed"
  | "disputed"
  | "cancelled"
  | "refunded";

export interface IOrderStatusHistory {
  status: OrderStatus;
  at: Date;
}

export interface IOrderPayment {
  method: "card" | "mobile_money" | "wallet" | "bank_transfer";
  provider?: string;
  gatewayRef?: string;
  paidAt?: Date;
}

export interface IOrderNotes {
  buyer?: string;
  sellerInternal?: string;
}

export interface IOrder {
  _id: ObjectId;
  orderNumber: string;
  buyerId: ObjectId;
  sellerId: ObjectId;
  items: IOrderItem[];
  pricing: IOrderPricing;
  delivery: IDelivery;
  status: OrderStatus;
  statusHistory: IOrderStatusHistory[];
  sellerShipDeadline?: Date;
  disputeWindowEnd?: Date;
  autoReleaseAt?: Date;
  payment: IOrderPayment;
  notes: IOrderNotes;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// TRANSACTION TYPES
// ============================================

export type EscrowStatus = "held" | "released" | "refunded" | "partial";

export interface IDispute {
  raised: boolean;
  raisedAt?: Date;
  reason?: "not_received" | "not_as_described" | "damaged" | "wrong_item";
  evidence?: string[];
  adminId?: ObjectId;
  resolution?: "refund_buyer" | "release_seller" | "partial";
  buyerRefund?: number;
  sellerReceived?: number;
  resolvedAt?: Date;
}

export interface ITransaction {
  _id: ObjectId;
  orderId: ObjectId;
  buyerId: ObjectId;
  sellerId: ObjectId;
  amount: number;
  hipaFee: number;
  sellerPayout: number;
  currency: string;
  escrow: {
    status: EscrowStatus;
    heldAt?: Date;
    releasedAt?: Date;
    releaseType?: "buyer_confirm" | "auto_release" | "admin";
  };
  dispute: IDispute;
  payoutBatch?: string;
  chargebackRisk: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// COMMUNITY TYPES
// ============================================

export interface IGroupLocation {
  city?: string;
  country?: string;
}

export interface IGroupStats {
  memberCount: number;
  postCount: number;
  weeklyActive: number;
}

export interface IGroup {
  _id: ObjectId;
  name: string;
  slug: string;
  description?: string;
  banner?: string;
  icon?: string;
  type: "public" | "private" | "seller_only";
  category?: string;
  location?: IGroupLocation;
  adminId: ObjectId;
  moderators: ObjectId[];
  stats: IGroupStats;
  rules: string[];
  pinnedPostIds: ObjectId[];
  status: "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

export type PostType =
  | "text"
  | "product_share"
  | "review_share"
  | "deal"
  | "question"
  | "ama";

export interface IPostContent {
  text: string;
  media?: {
    url: string;
    type: "image" | "video";
  }[];
  productId?: ObjectId;
  dealDiscount?: number;
  dealEndsAt?: Date;
}

export interface IPostEngagement {
  likes: number;
  likedBy: ObjectId[];
  commentCount: number;
  shareCount: number;
  viewCount: number;
}

export interface IPost {
  _id: ObjectId;
  authorId: ObjectId;
  groupId?: ObjectId;
  sellerId?: ObjectId;
  type: PostType;
  content: IPostContent;
  engagement: IPostEngagement;
  pinned: boolean;
  boosted: boolean;
  boostCampaignId?: ObjectId;
  status: "draft" | "published" | "flagged" | "removed";
  flagCount: number;
  reportReasons: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// REVIEW TYPES
// ============================================

export interface IReviewSellerReply {
  body: string;
  repliedAt: Date;
}

export interface IReview {
  _id: ObjectId;
  productId: ObjectId;
  sellerId: ObjectId;
  buyerId: ObjectId;
  orderId: ObjectId;
  rating: number;
  title?: string;
  body: string;
  media?: {
    url: string;
    type: "image" | "video";
  }[];
  verified: boolean;
  helpful: number;
  notHelpful: number;
  sellerReply?: IReviewSellerReply;
  status: "pending" | "published" | "flagged" | "removed";
  flagCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// AD CAMPAIGN TYPES
// ============================================

export interface IAdTargeting {
  categories?: string[];
  locations?: string[];
  interests?: string[];
  audienceType: "broad" | "lookalike" | "retarget";
}

export interface IAdCreative {
  type: "sponsored_listing" | "banner" | "post_boost" | "flash_sale";
  productId?: ObjectId;
  headline?: string;
  imageUrl?: string;
}

export interface IAdBudget {
  daily: number;
  total: number;
  spent: number;
  bidType: "cpc" | "cpm";
  bidAmount: number;
}

export interface IAdSchedule {
  startAt: Date;
  endAt?: Date;
  status: "draft" | "active" | "paused" | "completed" | "rejected";
}

export interface IAdPerformance {
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  revenue: number;
  roas: number;
}

export interface IAdCampaign {
  _id: ObjectId;
  sellerId: ObjectId;
  name: string;
  objective: "awareness" | "traffic" | "conversions";
  targeting: IAdTargeting;
  creative: IAdCreative;
  budget: IAdBudget;
  schedule: IAdSchedule;
  performance: IAdPerformance;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType =
  | "new_order"
  | "order_shipped"
  | "escrow_released"
  | "new_review"
  | "new_message"
  | "dispute_update"
  | "follow"
  | "post_like"
  | "post_comment"
  | "low_stock"
  | "payout_complete"
  | "ama_starting";

export interface INotificationRef {
  entity: string;
  id: ObjectId;
}

export interface INotificationChannel {
  sent: boolean;
  read?: boolean;
  readAt?: Date;
}

export interface INotification {
  _id: ObjectId;
  userId: ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  ref: INotificationRef;
  channels: {
    inApp: INotificationChannel;
    email: INotificationChannel;
    push: INotificationChannel;
    sms: INotificationChannel;
  };
  createdAt: Date;
  expiresAt: Date;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  meta?: IPaginationMeta;
  error?: IApiError;
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  cursor?: string;
}

export interface IApiError {
  code: string;
  message: string;
  field?: string;
}

// ============================================
// CART TYPES
// ============================================

export interface ICartItem {
  productId: string;
  slug: string;
  variantId?: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  sellerId: string;
  sellerName: string;
}

export interface ICart {
  items: ICartItem[];
  totalItems: number;
  subtotal: number;
}
