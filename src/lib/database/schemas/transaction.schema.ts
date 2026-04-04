import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Transaction Collection Schema
 *
 * The financial ledger. One per order. Never deleted — permanent audit trail.
 *
 * @field orderId - Reference to orders collection (1:1 relationship)
 * @field buyerId - Reference to users collection
 * @field sellerId - Reference to sellers collection
 * @field amount - Transaction amount
 * @field hipaFee - Platform fee
 * @field sellerPayout - Amount to be paid to seller
 * @field currency - Currency code
 * @field escrow - Escrow status and timing
 * @field dispute - Dispute information
 * @field payoutBatch - Reference to payout batch
 * @field chargebackRisk - Chargeback risk flag
 */

// ============================================
// SUB-SCHEMAS
// ============================================

/**
 * Escrow Status Sub-document
 */
const EscrowStatusSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["held", "released", "refunded", "partial"],
      default: "held",
      description: "Current escrow status",
    },
    heldAt: {
      type: Date,
      description: "When funds were moved to escrow",
    },
    releasedAt: {
      type: Date,
      description: "When funds were released",
    },
    releaseType: {
      type: String,
      enum: ["buyer_confirm", "auto_release", "admin", "partial"],
      description: "How funds were released",
    },
  },
  { _id: false },
);

/**
 * Dispute Info Sub-document
 */
const DisputeInfoSchema = new Schema(
  {
    raised: {
      type: Boolean,
      default: false,
      description: "Whether a dispute was raised",
    },
    raisedAt: {
      type: Date,
      description: "When dispute was raised",
    },
    reason: {
      type: String,
      enum: [
        "not_received",
        "not_as_described",
        "damaged",
        "wrong_item",
        "other",
      ],
      description: "Reason for dispute",
    },
    evidence: [
      {
        type: String,
        description: "URLs to evidence files",
      },
    ],
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      description: "Admin who resolved the dispute",
    },
    resolution: {
      type: String,
      enum: ["refund_buyer", "release_seller", "partial_refund", "cancelled"],
      description: "Resolution type",
    },
    buyerRefund: {
      type: Number,
      default: 0,
      description: "Amount refunded to buyer",
    },
    sellerReceived: {
      type: Number,
      default: 0,
      description: "Amount received by seller",
    },
    resolvedAt: {
      type: Date,
      description: "When dispute was resolved",
    },
  },
  { _id: false },
);

// ============================================
// MAIN TRANSACTION SCHEMA
// ============================================

/**
 * ITransaction Interface
 * TypeScript interface for Transaction Document
 */
export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  amount: number;
  hipaFee: number;
  sellerPayout: number;
  currency: string;
  escrow: {
    status: "held" | "released" | "refunded" | "partial";
    heldAt?: Date;
    releasedAt?: Date;
    releaseType?: "buyer_confirm" | "auto_release" | "admin" | "partial";
  };
  dispute: {
    raised: boolean;
    raisedAt?: Date;
    reason?:
      | "not_received"
      | "not_as_described"
      | "damaged"
      | "wrong_item"
      | "other";
    evidence?: string[];
    adminId?: mongoose.Types.ObjectId;
    resolution?:
      | "refund_buyer"
      | "release_seller"
      | "partial_refund"
      | "cancelled";
    buyerRefund?: number;
    sellerReceived?: number;
    resolvedAt?: Date;
  };
  blockchain?: {
    createTxHash?: string;
    releaseTxHash?: string;
    disputeTxHash?: string;
    resolveTxHash?: string;
    network?: string;
    contractAddress?: string;
    verificationUrl?: string;
  };
  payoutBatch?: string;
  chargebackRisk: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transaction Schema Definition
 */
export const TransactionSchema = new Schema<ITransaction>(
  {
    // ========================================
    // CORE FIELDS
    // ========================================

    orderId: {
      type: Schema.Types.ObjectId,
      ref: "orders",
      required: [true, "Order ID is required"],
      description: "Reference to orders collection (1:1)",
    },

    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Buyer ID is required"],
      description: "Reference to buyer (user)",
    },

    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "sellers",
      required: [true, "Seller ID is required"],
      description: "Reference to seller",
    },

    // ========================================
    // AMOUNT FIELDS
    // ========================================

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: 0,
      description: "Transaction amount in smallest currency unit",
    },

    hipaFee: {
      type: Number,
      required: [true, "Platform fee is required"],
      min: 0,
      description: "Platform fee (e.g., 3% of amount)",
    },

    sellerPayout: {
      type: Number,
      required: [true, "Seller payout is required"],
      min: 0,
      description: "Amount to be paid to seller",
    },

    currency: {
      type: String,
      default: "RWF",
      description: "Currency code",
    },

    // ========================================
    // ESCROW FIELDS
    // ========================================

    escrow: {
      type: EscrowStatusSchema,
      default: () => ({
        status: "held",
      }),
      description: "Escrow status and timing",
    },

    // ========================================
    // DISPUTE FIELDS
    // ========================================

    dispute: {
      type: DisputeInfoSchema,
      default: () => ({
        raised: false,
      }),
      description: "Dispute information",
    },

    // ========================================
    // BLOCKCHAIN FIELDS
    // ========================================

    blockchain: {
      createTxHash: {
        type: String,
        description: "Blockchain tx hash when escrow was created",
      },
      releaseTxHash: {
        type: String,
        description: "Blockchain tx hash when escrow was released",
      },
      disputeTxHash: {
        type: String,
        description: "Blockchain tx hash when dispute was raised",
      },
      resolveTxHash: {
        type: String,
        description: "Blockchain tx hash when dispute was resolved",
      },
      network: {
        type: String,
        default: "polygon",
        description: "Blockchain network",
      },
      contractAddress: {
        type: String,
        default: process.env.ESCROW_CONTRACT_ADDRESS,
        description: "Smart contract address",
      },
      verificationUrl: {
        type: String,
        description: "URL to verify transaction on blockchain explorer",
      },
    },

    // ========================================
    // PAYOUT FIELDS
    // ========================================

    payoutBatch: {
      type: String,
      description:
        "Reference to payout batch (set when included in a payout run)",
    },

    // ========================================
    // RISK FIELDS
    // ========================================

    chargebackRisk: {
      type: Boolean,
      default: false,
      description: "Chargeback risk flag",
    },
  },
  {
    // ========================================
    // SCHEMA OPTIONS
    // ========================================
    timestamps: true,
    collection: "transactions",
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

// Unique order ID index (1:1 relationship)
TransactionSchema.index(
  { orderId: 1 },
  { unique: true, name: "order_id_unique" },
);

// Buyer ID index
TransactionSchema.index({ buyerId: 1 }, { name: "buyer_id_idx" });

// Seller ID index
TransactionSchema.index({ sellerId: 1 }, { name: "seller_id_idx" });

// Escrow status index
TransactionSchema.index({ "escrow.status": 1 }, { name: "escrow_status_idx" });

// Dispute raised index
TransactionSchema.index(
  { "dispute.raised": 1 },
  { name: "dispute_raised_idx" },
);

// Payout batch index
TransactionSchema.index({ payoutBatch: 1 }, { name: "payout_batch_idx" });

// Chargeback risk index
TransactionSchema.index({ chargebackRisk: 1 }, { name: "chargeback_risk_idx" });

// Created at index
TransactionSchema.index({ createdAt: -1 }, { name: "created_at_idx" });

// ============================================
// VIRTUALS
// ============================================

/**
 * Virtual for transaction URL
 */
TransactionSchema.virtual("url").get(function () {
  return `/transactions/${this._id}`;
});

/**
 * Virtual for is escrow released
 */
TransactionSchema.virtual("isEscrowReleased").get(function () {
  return this.escrow?.status === "released";
});

/**
 * Virtual for is disputed
 */
TransactionSchema.virtual("isDisputed").get(function () {
  return this.dispute?.raised === true;
});

/**
 * Virtual for is resolved
 */
TransactionSchema.virtual("isResolved").get(function () {
  return this.dispute?.resolvedAt !== undefined;
});

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find transaction by order ID
 */
TransactionSchema.statics.findByOrderId = function (
  orderId: mongoose.Types.ObjectId | string,
) {
  return this.findOne({ orderId });
};

/**
 * Find transactions by buyer
 */
TransactionSchema.statics.findByBuyer = function (
  buyerId: mongoose.Types.ObjectId | string,
) {
  return this.find({ buyerId }).sort({ createdAt: -1 });
};

/**
 * Find transactions by seller
 */
TransactionSchema.statics.findBySeller = function (
  sellerId: mongoose.Types.ObjectId | string,
) {
  return this.find({ sellerId }).sort({ createdAt: -1 });
};

/**
 * Find transactions in escrow
 */
TransactionSchema.statics.findInEscrow = function () {
  return this.find({ "escrow.status": "held" });
};

/**
 * Find disputed transactions
 */
TransactionSchema.statics.findDisputed = function () {
  return this.find({ "dispute.raised": true, "dispute.resolvedAt": null });
};

/**
 * Find transactions for payout
 */
TransactionSchema.statics.findForPayout = function (
  sellerId: mongoose.Types.ObjectId | string,
) {
  return this.find({
    sellerId,
    "escrow.status": "held",
    payoutBatch: null,
  });
};

/**
 * Get seller total earnings
 */
TransactionSchema.statics.getSellerTotalEarnings = async function (
  sellerId: mongoose.Types.ObjectId | string,
): Promise<number> {
  const result = await this.aggregate([
    { $match: { sellerId: new mongoose.Types.ObjectId(sellerId as string) } },
    { $group: { _id: null, total: { $sum: "$sellerPayout" } } },
  ]);
  return result[0]?.total || 0;
};

/**
 * Get buyer total spent
 */
TransactionSchema.statics.getBuyerTotalSpent = async function (
  buyerId: mongoose.Types.ObjectId | string,
): Promise<number> {
  const result = await this.aggregate([
    { $match: { buyerId: new mongoose.Types.ObjectId(buyerId as string) } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return result[0]?.total || 0;
};

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Hold funds in escrow
 */
TransactionSchema.methods.holdInEscrow = function () {
  this.escrow.status = "held";
  this.escrow.heldAt = new Date();
  return this.save();
};

/**
 * Release funds from escrow
 */
TransactionSchema.methods.releaseFromEscrow = function (
  releaseType: "buyer_confirm" | "auto_release" | "admin",
) {
  this.escrow.status = "released";
  this.escrow.releasedAt = new Date();
  this.escrow.releaseType = releaseType;
  return this.save();
};

/**
 * Raise a dispute
 */
TransactionSchema.methods.raiseDispute = function (
  reason: string,
  evidence: string[] = [],
) {
  this.dispute.raised = true;
  this.dispute.raisedAt = new Date();
  this.dispute.reason = reason as any;
  this.dispute.evidence = evidence;
  return this.save();
};

/**
 * Resolve dispute
 */
TransactionSchema.methods.resolveDispute = function (
  adminId: mongoose.Types.ObjectId,
  resolution:
    | "refund_buyer"
    | "release_seller"
    | "partial_refund"
    | "cancelled",
  buyerRefund: number,
  sellerReceived: number,
) {
  this.dispute.adminId = adminId;
  this.dispute.resolution = resolution;
  this.dispute.buyerRefund = buyerRefund;
  this.dispute.sellerReceived = sellerReceived;
  this.dispute.resolvedAt = new Date();

  // Update escrow status based on resolution
  if (resolution === "refund_buyer") {
    this.escrow.status = "refunded";
  } else if (resolution === "release_seller") {
    this.escrow.status = "released";
    this.escrow.releasedAt = new Date();
    this.escrow.releaseType = "admin";
  } else if (resolution === "partial_refund") {
    this.escrow.status = "partial";
  }

  return this.save();
};

/**
 * Add to payout batch
 */
TransactionSchema.methods.addToPayoutBatch = function (batchId: string) {
  this.payoutBatch = batchId;
  return this.save();
};

/**
 * Mark chargeback risk
 */
TransactionSchema.methods.markChargebackRisk = function (
  risky: boolean = true,
) {
  this.chargebackRisk = risky;
  return this.save();
};

// ============================================
// MIDDLEWARE
// ============================================

// Set escrow heldAt on creation
TransactionSchema.pre("save", function (this: any, next: () => void) {
  if (this.isNew && this.escrow.status === "held" && !this.escrow.heldAt) {
    this.escrow.heldAt = new Date();
  }
  next();
});

// ============================================
// EXPORT MODEL
// ============================================

export const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
