import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import connectDB from "@/lib/database/mongodb";
import { FraudSignal, UserEvent } from "@/lib/database/schemas/ai.schema";
import { Review } from "@/lib/database/schemas/review.schema";
import { Order } from "@/lib/database/schemas/order.schema";
import { User, Seller } from "@/lib/database/schemas";
import type {
  IFraudSignal,
  IFakeReviewSignal,
  IDisputeAbuseSignal,
  ISellerFraudSignal,
  IAccountTakeoverSignal,
} from "@/types/ai";

// ============================================
// FRAUD DETECTION SERVICE (Part 11)
// ============================================

/**
 * Analyze a review for fraud indicators
 */
export async function analyzeReviewForFraud(
  reviewId: ObjectId,
): Promise<IFakeReviewSignal> {
  await connectDB();

  const review = await Review.findById(reviewId);
  if (!review) {
    return {
      reviewId,
      signals: {
        postedWithinMinutesOfPurchase: false,
        genericVagueText: false,
        reviewerCreatedSameDay: false,
        sameIPMultipleReviews: false,
        suspiciousPattern: false,
      },
      confidence: 0,
    };
  }

  const signals: IFakeReviewSignal["signals"] = {
    postedWithinMinutesOfPurchase: false,
    genericVagueText: false,
    reviewerCreatedSameDay: false,
    sameIPMultipleReviews: false,
    suspiciousPattern: false,
  };

  // Check 1: Posted within minutes of purchase
  if (review.createdAt && review.orderId) {
    const order = await Order.findById(review.orderId)
      .select("createdAt")
      .lean();
    if (order) {
      const minutesDiff =
        (review.createdAt.getTime() - order.createdAt.getTime()) / (1000 * 60);
      signals.postedWithinMinutesOfPurchase = minutesDiff < 5;
    }
  }

  // Check 2: Generic vague text
  const genericPhrases = [
    "good",
    "great",
    "nice",
    "ok",
    "okay",
    "not bad",
    "product is good",
    "very good",
    "awesome",
  ];
  const reviewText = review.body?.toLowerCase() || "";
  const isGeneric = genericPhrases.some((phrase) =>
    reviewText.includes(phrase),
  );
  signals.genericVagueText = isGeneric && reviewText.length < 50;

  // Check 3: Reviewer account created same day
  const reviewer = await User.findById(review.buyerId)
    .select("createdAt")
    .lean();
  if (reviewer && review.createdAt) {
    const sameDay =
      reviewer.createdAt.toDateString() === review.createdAt.toDateString();
    signals.reviewerCreatedSameDay = sameDay;
  }

  // Check 4: Same IP as multiple reviews
  // Would need IP tracking in reviews - placeholder
  signals.sameIPMultipleReviews = false;

  // Check 5: Suspicious pattern (would use ML in production)
  signals.suspiciousPattern =
    signals.postedWithinMinutesOfPurchase && signals.genericVagueText;

  // Calculate confidence
  const signalCount = Object.values(signals).filter(Boolean).length;
  const confidence = signalCount * 0.2;

  return {
    reviewId,
    signals,
    confidence,
  };
}

/**
 * Flag suspicious review
 */
export async function flagSuspiciousReview(
  reviewId: ObjectId,
  signal: IFakeReviewSignal,
): Promise<void> {
  if (signal.confidence < 0.4) return;

  await connectDB();

  const severity =
    signal.confidence >= 0.8
      ? "critical"
      : signal.confidence >= 0.6
        ? "high"
        : signal.confidence >= 0.4
          ? "medium"
          : "low";

  await FraudSignal.create({
    type: "fake_review",
    severity,
    entity: { type: "review", id: reviewId },
    evidence: { signals: signal.signals },
    confidence: signal.confidence,
    recommendedAction:
      signal.confidence >= 0.8
        ? "ban"
        : signal.confidence >= 0.6
          ? "suspend"
          : signal.confidence >= 0.4
            ? "flag"
            : "watch",
    createdAt: new Date(),
  });
}

/**
 * Analyze user for dispute abuse
 */
export async function analyzeDisputeAbuse(
  userId: ObjectId,
): Promise<IDisputeAbuseSignal> {
  await connectDB();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get user's orders
  const orders = await Order.find({
    buyerId: new mongoose.Types.ObjectId(userId),
    createdAt: { $gte: thirtyDaysAgo },
  }).lean();

  const totalOrders = orders.length;

  // Get disputes
  const disputedOrders = await Order.find({
    buyerId: new mongoose.Types.ObjectId(userId),
    status: "disputed",
    createdAt: { $gte: thirtyDaysAgo },
  }).lean();

  const totalDisputes = disputedOrders.length;
  const disputeRate = totalOrders > 0 ? totalDisputes / totalOrders : 0;

  // Check tracking mismatch (simplified)
  const trackingMismatch = false; // Would check tracking data

  return {
    userId,
    totalDisputes,
    totalOrders,
    disputeRate,
    trackingMismatch,
  };
}

/**
 * Analyze seller for fraud indicators
 */
export async function analyzeSellerFraud(
  sellerId: ObjectId,
): Promise<ISellerFraudSignal> {
  await connectDB();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get seller
  const seller = await Seller.findById(sellerId).lean();

  // Check 1: High order volume in first week
  const firstWeekOrders = await Order.countDocuments({
    sellerId: new mongoose.Types.ObjectId(sellerId),
    createdAt: { $gte: sevenDaysAgo },
  });

  const highVolumeFirstWeek = firstWeekOrders > 50; // Threshold

  // Check 2: Multiple accounts from same device/IP
  // Would need device/IP tracking - placeholder
  const multipleAccountsSameDevice = false;

  // Check 3: Large payout before dispute window closes
  const { Transaction } =
    await import("@/lib/database/schemas/transaction.schema");
  const recentPayouts = await Transaction.find({
    sellerId: new mongoose.Types.ObjectId(sellerId),
    escrow: { status: "released" },
    createdAt: { $gte: thirtyDaysAgo },
  }).lean();

  const totalPayout = recentPayouts.reduce(
    (sum, t) => sum + (t.sellerPayout || 0),
    0,
  );
  const largePayoutBeforeDisputeWindow = totalPayout > 500000; // 500k RWF

  // Check 4: Poor delivery proof quality
  // Would check delivery proof images - placeholder
  const poorDeliveryProof = false;

  return {
    sellerId,
    signals: {
      highVolumeFirstWeek,
      multipleAccountsSameDevice,
      largePayoutBeforeDisputeWindow,
      poorDeliveryProof,
    },
  };
}

/**
 * Detect account takeover
 */
export async function detectAccountTakeover(
  userId: ObjectId,
  loginData: {
    deviceId?: string;
    ipAddress?: string;
    location?: { city: string; country: string };
  },
): Promise<IAccountTakeoverSignal> {
  await connectDB();

  // Get user's recent login history
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentLogins = await UserEvent.find({
    userId,
    event: "session_start",
    ts: { $gte: sevenDaysAgo },
  })
    .select("metadata.ts metadata.deviceId metadata.ipAddress")
    .lean();

  const knownDevices = new Set(
    recentLogins
      .map(
        (l) =>
          (l as unknown as { metadata?: { deviceId?: string } })?.metadata
            ?.deviceId,
      )
      .filter(Boolean),
  );
  const knownIPs = new Set(
    recentLogins
      .map(
        (l) =>
          (l as unknown as { metadata?: { ipAddress?: string } })?.metadata
            ?.ipAddress,
      )
      .filter(Boolean),
  );

  // Check for new device
  const newDevice = loginData.deviceId
    ? !knownDevices.has(loginData.deviceId)
    : false;

  // Check for new location
  const newLocation = false; // Would compare with historical locations

  // Check for bulk listing changes
  // Would check for rapid changes to listings
  const bulkListingChanges = false;

  // Check for large withdrawal
  // Would check recent transactions
  const largeWithdrawal = false;

  const signals = {
    newDevice,
    newLocation,
    bulkListingChanges,
    largeWithdrawal,
  };

  const verificationRequired =
    (newDevice && newLocation) || bulkListingChanges || largeWithdrawal;

  return {
    userId,
    signals,
    verificationRequired,
  };
}

/**
 * Run fraud detection check on new review
 */
export async function checkNewReview(reviewId: ObjectId): Promise<void> {
  const analysis = await analyzeReviewForFraud(reviewId);

  if (analysis.confidence >= 0.4) {
    await flagSuspiciousReview(reviewId, analysis);
  }
}

/**
 * Get all fraud signals for admin review
 */
export async function getFraudSignals(
  options: {
    type?: string;
    severity?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<IFraudSignal[]> {
  await connectDB();

  const query: Record<string, unknown> = {};

  if (options.type) {
    query.type = options.type;
  }
  if (options.severity) {
    query.severity = options.severity;
  }

  return FraudSignal.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .skip(options.offset || 0)
    .lean();
}

/**
 * Take action on fraud signal
 */
export async function takeFraudAction(
  signalId: ObjectId,
  action: "watch" | "flag" | "suspend" | "ban",
): Promise<void> {
  await connectDB();

  const signal = await FraudSignal.findById(signalId);
  if (!signal) return;

  // Update signal status
  await FraudSignal.updateOne(
    { _id: new mongoose.Types.ObjectId(signalId) },
    { $set: { status: action } },
  );

  // Take action based on entity type
  if (action === "suspend" || action === "ban") {
    if (signal.entity.type === "user") {
      // Would suspend/ban user account
      console.log(`Would suspend/ban user: ${signal.entity.id}`);
    } else if (signal.entity.type === "seller") {
      // Would suspend/ban seller
      console.log(`Would suspend/ban seller: ${signal.entity.id}`);
    } else if (signal.entity.type === "review") {
      // Would remove review
      await Review.updateOne(
        { _id: new mongoose.Types.ObjectId(signal.entity.id) },
        { $set: { status: "flagged" } },
      );
    }
  }
}
