import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Order Collection Schema
 *
 * One order = one checkout session. Can contain multiple products from one seller.
 * Multi-seller cart = multiple orders created simultaneously.
 *
 * DENORMALIZATION STRATEGY:
 * - items embed product title + image for fast order history page (zero joins)
 * - Financial data (pricing, payment) stays as source of truth - never denormalized
 * - Status and statusHistory track all changes for disputes
 *
 * @field orderNumber - Human-readable unique order identifier (e.g., ORD-2026-00142)
 * @field buyerId - Reference to users collection
 * @field sellerId - Reference to sellers collection
 * @field items - Array of order items (denormalized: title, image)
 * @field pricing - Order pricing breakdown (source of truth)
 * @field delivery - Delivery information and address
 * @field status - Current order status
 * @field statusHistory - History of status changes
 * @field sellerShipDeadline - Deadline for seller to ship
 * @field disputeWindowEnd - End of dispute window
 * @field autoReleaseAt - When funds will be auto-released
 * @field payment - Payment details (source of truth)
 * @field notes - Buyer and seller notes
 *
 * Status Flow: pending_payment → payment_held → seller_processing → in_delivery → dispute_window → completed / disputed / cancelled / refunded
 */

// Order Status Enum
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

// ============================================
// SUB-SCHEMAS
// ============================================

/**
 * Order Item Sub-document
 */
const OrderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "products",
      required: true,
      description: "Reference to product",
    },
    variantId: {
      type: Schema.Types.ObjectId,
      description: "Reference to product variant (if applicable)",
    },
    title: {
      type: String,
      required: true,
      description: "Product title at time of purchase",
    },
    image: {
      type: String,
      description: "Product image URL at time of purchase",
    },
    qty: {
      type: Number,
      required: true,
      min: 1,
      description: "Quantity ordered",
    },
    unitPrice: {
      type: Number,
      required: true,
      description: "Unit price in smallest currency unit",
    },
    lineTotal: {
      type: Number,
      required: true,
      description: "Line total (unitPrice * qty)",
    },
  },
  { _id: false },
);

/**
 * Delivery Address Sub-document
 */
const DeliveryAddressSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      description: "Recipient full name",
    },
    phone: {
      type: String,
      required: true,
      description: "Recipient phone number",
    },
    street: {
      type: String,
      required: true,
      description: "Street address",
    },
    city: {
      type: String,
      required: true,
      description: "City",
    },
    country: {
      type: String,
      required: true,
      description: "ISO 3166-1 alpha-2 country code",
    },
    notes: {
      type: String,
      description: "Delivery notes",
    },
  },
  { _id: false },
);

/**
 * Tracking Info Sub-document
 */
const TrackingInfoSchema = new Schema(
  {
    number: {
      type: String,
      description: "Tracking number",
    },
    courier: {
      type: String,
      description: "Courier company name",
    },
    proofUrl: {
      type: String,
      description: "URL to delivery proof image",
    },
    uploadedAt: {
      type: Date,
      description: "When tracking info was uploaded",
    },
  },
  { _id: false },
);

/**
 * Order Delivery Sub-document
 */
const OrderDeliverySchema = new Schema(
  {
    method: {
      type: String,
      default: "standard",
      description: "Delivery method (standard, express, etc.)",
    },
    address: {
      type: DeliveryAddressSchema,
      required: true,
      description: "Delivery address",
    },
    estimatedDate: {
      type: Date,
      description: "Estimated delivery date",
    },
    tracking: {
      type: TrackingInfoSchema,
      description: "Tracking information",
    },
  },
  { _id: false },
);

/**
 * Order Pricing Sub-document
 */
const OrderPricingSchema = new Schema(
  {
    subtotal: {
      type: Number,
      required: true,
      description: "Sum of all line totals",
    },
    shippingFee: {
      type: Number,
      default: 0,
      description: "Shipping fee",
    },
    discount: {
      type: Number,
      default: 0,
      description: "Discount amount",
    },
    couponCode: {
      type: String,
      description: "Applied coupon code",
    },
    total: {
      type: Number,
      required: true,
      description: "Final total",
    },
    currency: {
      type: String,
      default: "RWF",
      description: "Currency code",
    },
    hipaFee: {
      type: Number,
      required: true,
      description: "Platform fee (e.g., 3% of total)",
    },
    sellerPayout: {
      type: Number,
      required: true,
      description: "Amount to be paid out to seller",
    },
  },
  { _id: false },
);

/**
 * Status History Entry Sub-document
 */
const StatusHistoryEntrySchema = new Schema(
  {
    status: {
      type: String,
      required: true,
      description: "Status at this point in history",
    },
    at: {
      type: Date,
      default: Date.now,
      description: "When this status was set",
    },
  },
  { _id: false },
);

/**
 * Payment Info Sub-document
 */
const OrderPaymentSchema = new Schema(
  {
    method: {
      type: String,
      enum: ["card", "mobile_money", "wallet", "bank_transfer"],
      required: true,
      description: "Payment method used",
    },
    provider: {
      type: String,
      description: "Payment provider (e.g., MTN, Stripe)",
    },
    gatewayRef: {
      type: String,
      description: "Payment gateway reference",
    },
    paidAt: {
      type: Date,
      description: "When payment was completed",
    },
  },
  { _id: false },
);

/**
 * Order Notes Sub-document
 */
const OrderNotesSchema = new Schema(
  {
    buyer: {
      type: String,
      description: "Notes from buyer",
    },
    sellerInternal: {
      type: String,
      description: "Internal notes from seller",
    },
  },
  { _id: false },
);

// ============================================
// MAIN ORDER SCHEMA
// ============================================

/**
 * IOrder Interface
 * TypeScript interface for Order Document
 */
export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  items: Array<{
    productId: mongoose.Types.ObjectId;
    variantId?: mongoose.Types.ObjectId;
    title: string;
    image?: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  pricing: {
    subtotal: number;
    shippingFee: number;
    discount: number;
    couponCode?: string;
    total: number;
    currency: string;
    hipaFee: number;
    sellerPayout: number;
  };
  delivery: {
    method: string;
    address: {
      fullName: string;
      phone: string;
      street: string;
      city: string;
      country: string;
      notes?: string;
    };
    estimatedDate?: Date;
    tracking?: {
      number?: string;
      courier?: string;
      proofUrl?: string;
      uploadedAt?: Date;
    };
  };
  status: OrderStatus;
  statusHistory: Array<{
    status: string;
    at: Date;
  }>;
  sellerShipDeadline?: Date;
  disputeWindowEnd?: Date;
  autoReleaseAt?: Date;
  payment: {
    method: "card" | "mobile_money" | "wallet" | "bank_transfer";
    provider?: string;
    gatewayRef?: string;
    paidAt?: Date;
  };
  notes: {
    buyer?: string;
    sellerInternal?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Order Schema Definition
 */
export const OrderSchema = new Schema<IOrder>(
  {
    // ========================================
    // CORE FIELDS
    // ========================================

    orderNumber: {
      type: String,
      required: true,
      unique: true,
      description: "Human-readable order number (e.g., ORD-2026-00142)",
    },

    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Buyer ID is required"],
      index: true,
      description: "Reference to buyer (user)",
    },

    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "sellers",
      required: [true, "Seller ID is required"],
      index: true,
      description: "Reference to seller",
    },

    // ========================================
    // ITEMS
    // ========================================

    items: [
      {
        type: OrderItemSchema,
        required: true,
        description: "Array of products ordered",
      },
    ],

    // ========================================
    // PRICING
    // ========================================

    pricing: {
      type: OrderPricingSchema,
      required: true,
      description: "Order pricing breakdown",
    },

    // ========================================
    // DELIVERY
    // ========================================

    delivery: {
      type: OrderDeliverySchema,
      required: true,
      description: "Delivery information",
    },

    // ========================================
    // STATUS
    // ========================================

    status: {
      type: String,
      enum: {
        values: [
          "pending_payment",
          "payment_held",
          "seller_processing",
          "in_delivery",
          "dispute_window",
          "completed",
          "disputed",
          "cancelled",
          "refunded",
        ],
        message: "Invalid order status",
      },
      default: "pending_payment",
      description: "Current order status",
    },

    statusHistory: [
      {
        type: StatusHistoryEntrySchema,
        description: "History of status changes",
      },
    ],

    // ========================================
    // TIMING
    // ========================================

    sellerShipDeadline: {
      type: Date,
      description: "Deadline for seller to ship the order",
    },

    disputeWindowEnd: {
      type: Date,
      description: "End of dispute window",
    },

    autoReleaseAt: {
      type: Date,
      description: "When funds will be automatically released to seller",
    },

    // ========================================
    // PAYMENT
    // ========================================

    payment: {
      type: OrderPaymentSchema,
      description: "Payment details",
    },

    // ========================================
    // NOTES
    // ========================================

    notes: {
      type: OrderNotesSchema,
      description: "Buyer and seller notes",
    },
  },
  {
    // ========================================
    // SCHEMA OPTIONS
    // ========================================
    timestamps: true,
    collection: "orders",
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

// Buyer and status compound index
OrderSchema.index({ buyerId: 1, status: 1 }, { name: "buyer_status_idx" });

// Seller, status, and date compound index
OrderSchema.index(
  { sellerId: 1, status: 1, createdAt: -1 },
  { name: "seller_status_date_idx" },
);

// Auto release date index (for cron jobs)
OrderSchema.index({ autoReleaseAt: 1 }, { name: "auto_release_idx" });

// Created at index
OrderSchema.index({ createdAt: -1 }, { name: "created_at_idx" });

// Order number unique index
OrderSchema.index(
  { orderNumber: 1 },
  { unique: true, name: "order_number_unique" },
);

// Status index for filtering
OrderSchema.index({ status: 1 }, { name: "status_idx" });

// ============================================
// VIRTUALS
// ============================================

/**
 * Virtual for order URL
 */
OrderSchema.virtual("url").get(function () {
  return `/orders/${this.orderNumber}`;
});

/**
 * Virtual for is paid
 */
OrderSchema.virtual("isPaid").get(function () {
  return !!this.payment?.paidAt;
});

/**
 * Virtual for is completed
 */
OrderSchema.virtual("isCompleted").get(function () {
  return this.status === "completed";
});

/**
 * Virtual for can dispute
 */
OrderSchema.virtual("canDispute").get(function () {
  return (
    this.status === "dispute_window" &&
    this.disputeWindowEnd &&
    this.disputeWindowEnd > new Date()
  );
});

/**
 * Virtual for item count
 */
OrderSchema.virtual("itemCount").get(function () {
  return this.items?.reduce((sum, item) => sum + item.qty, 0) || 0;
});

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find order by order number
 */
OrderSchema.statics.findByOrderNumber = function (orderNumber: string) {
  return this.findOne({ orderNumber });
};

/**
 * Find orders by buyer
 */
OrderSchema.statics.findByBuyer = function (
  buyerId: mongoose.Types.ObjectId | string,
) {
  return this.find({ buyerId }).sort({ createdAt: -1 });
};

/**
 * Find orders by seller
 */
OrderSchema.statics.findBySeller = function (
  sellerId: mongoose.Types.ObjectId | string,
) {
  return this.find({ sellerId }).sort({ createdAt: -1 });
};

/**
 * Find orders by status
 */
OrderSchema.statics.findByStatus = function (status: OrderStatus) {
  return this.find({ status });
};

/**
 * Get orders pending shipment
 */
OrderSchema.statics.getPendingShipment = function () {
  return this.find({
    status: { $in: ["payment_held", "seller_processing"] },
  }).sort({ sellerShipDeadline: 1 });
};

/**
 * Get orders for auto-release (escrow)
 */
OrderSchema.statics.getOrdersForAutoRelease = function () {
  return this.find({
    status: "dispute_window",
    autoReleaseAt: { $lte: new Date() },
  });
};

/**
 * Get orders awaiting payment
 */
OrderSchema.statics.getAwaitingPayment = function () {
  return this.find({
    status: "pending_payment",
    createdAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) }, // Older than 30 min
  });
};

/**
 * Generate next order number
 */
OrderSchema.statics.generateOrderNumber = async function (): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();

  // Get count of orders this year
  const count = await this.countDocuments({
    orderNumber: { $regex: `^ORD-${year}-` },
  });

  const seq = (count + 1).toString().padStart(6, "0");
  return `ORD-${year}-${seq}`;
};

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Add status to history
 */
OrderSchema.methods.addStatusHistory = function (status: OrderStatus) {
  this.statusHistory.push({
    status,
    at: new Date(),
  });
  return this.save();
};

/**
 * Update status
 */
OrderSchema.methods.updateStatus = function (status: OrderStatus) {
  this.status = status;
  this.addStatusHistory(status);
  return this.save();
};

/**
 * Mark as paid
 */
OrderSchema.methods.markAsPaid = function (
  paymentMethod: string,
  provider?: string,
  gatewayRef?: string,
) {
  this.payment = {
    method: paymentMethod as any,
    provider,
    gatewayRef,
    paidAt: new Date(),
  };
  this.addStatusHistory("payment_held");
  return this.save();
};

/**
 * Mark as shipped
 */
OrderSchema.methods.markAsShipped = function (
  trackingNumber?: string,
  courier?: string,
) {
  this.delivery.tracking = {
    number: trackingNumber,
    courier,
    uploadedAt: new Date(),
  };
  this.addStatusHistory("in_delivery");
  return this.save();
};

/**
 * Mark as delivered
 */
OrderSchema.methods.markAsDelivered = function (proofUrl?: string) {
  if (this.delivery.tracking) {
    this.delivery.tracking.proofUrl = proofUrl;
  }
  this.addStatusHistory("dispute_window");

  // Set dispute window end (3 days from now)
  this.disputeWindowEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  // Set auto-release at end of dispute window
  this.autoReleaseAt = this.disputeWindowEnd;

  return this.save();
};

/**
 * Complete order (after dispute window)
 */
OrderSchema.methods.complete = function () {
  this.addStatusHistory("completed");
  return this.save();
};

/**
 * Cancel order
 */
OrderSchema.methods.cancel = function () {
  this.addStatusHistory("cancelled");
  return this.save();
};

/**
 * Dispute order
 */
OrderSchema.methods.dispute = function () {
  this.addStatusHistory("disputed");
  return this.save();
};

/**
 * Refund order
 */
OrderSchema.methods.refund = function () {
  this.addStatusHistory("refunded");
  return this.save();
};

/**
 * Extend dispute window
 */
OrderSchema.methods.extendDisputeWindow = function (days: number = 3) {
  const newEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  this.disputeWindowEnd = newEnd;
  this.autoReleaseAt = newEnd;
  return this.save();
};

/**
 * Calculate pricing
 */
OrderSchema.methods.calculatePricing = function (sellerFeeRate: number) {
  const subtotal = this.items.reduce((sum, item) => sum + item.lineTotal, 0);
  const total = subtotal + this.pricing.shippingFee - this.pricing.discount;
  const hipaFee = Math.round(total * sellerFeeRate);
  const sellerPayout = total - hipaFee;

  this.pricing.subtotal = subtotal;
  this.pricing.total = total;
  this.pricing.hipaFee = hipaFee;
  this.pricing.sellerPayout = sellerPayout;

  return this;
};

// ============================================
// MIDDLEWARE
// ============================================

// Generate order number on save
OrderSchema.pre("save", async function (this: any, next: () => void) {
  if (this.isNew && !this.orderNumber) {
    this.orderNumber = await (this.constructor as any).generateOrderNumber();
  }

  // Add initial status to history if new
  if (this.isNew && this.statusHistory.length === 0) {
    this.statusHistory.push({
      status: this.status,
      at: new Date(),
    });
  }

  next();
});

// ============================================
// EXPORT
// ============================================

// Status History Schema (for use in main schema)
const StatusHistorySchema = new Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
