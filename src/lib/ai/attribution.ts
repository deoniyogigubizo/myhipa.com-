import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import connectDB from "@/lib/database/mongodb";
import {
  AdImpression,
  AdClick,
  UserEvent,
} from "@/lib/database/schemas/ai.schema";
import { Order } from "@/lib/database/schemas/order.schema";
import type {
  IAttributionEntry,
  IROASReport,
  AttributionModel,
} from "@/types/ai";

// ============================================
// ATTRIBUTION & ROAS MEASUREMENT (Part 9)
// ============================================

const CLICK_ATTRIBUTION_WINDOW = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
const VIEW_ATTRIBUTION_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in ms

/**
 * Attribute an order to ad campaigns
 */
export async function attributeOrder(
  orderId: ObjectId,
  buyerId: ObjectId,
  model: AttributionModel = "position_based",
): Promise<IAttributionEntry[]> {
  await connectDB();

  // Get the order
  const order = await Order.findById(orderId);
  if (!order) return [];

  // Get all touchpoints (impressions and clicks) for this user
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const touchpoints = await getUserTouchpoints(buyerId, thirtyDaysAgo);

  if (touchpoints.length === 0) return [];

  // Filter to within attribution window
  const orderTime = order.createdAt.getTime();

  const validTouchpoints = touchpoints.filter((t) => {
    const timeDiff = orderTime - t.ts.getTime();

    if (t.type === "click") {
      return timeDiff > 0 && timeDiff <= CLICK_ATTRIBUTION_WINDOW;
    } else {
      return timeDiff > 0 && timeDiff <= VIEW_ATTRIBUTION_WINDOW;
    }
  });

  if (validTouchpoints.length === 0) return [];

  // Calculate credit based on attribution model
  const credits = calculateAttributionCredits(validTouchpoints, model);

  // Create attribution entries
  const entries: IAttributionEntry[] = [];

  for (const [campaignId, credit] of Object.entries(credits)) {
    const campaignTouchpoints = validTouchpoints.filter(
      (t) => t.campaignId?.toString() === campaignId,
    );

    const touchpointCredits = credit / campaignTouchpoints.length;

    entries.push({
      orderId,
      campaignId: new ObjectId(campaignId),
      userId: buyerId,
      credit,
      model,
      touchpoints: campaignTouchpoints.map((t) => ({
        campaignId: t.campaignId!,
        type: t.type,
        ts: t.ts,
        credit: touchpointCredits,
      })),
    });
  }

  return entries;
}

/**
 * Get all ad touchpoints for a user
 */
async function getUserTouchpoints(
  userId: ObjectId,
  since: Date,
): Promise<
  {
    campaignId?: ObjectId;
    type: "impression" | "click";
    ts: Date;
  }[]
> {
  const [impressions, clicks] = await Promise.all([
    AdImpression.find({ userId, ts: { $gte: since } })
      .select("campaignId ts")
      .lean(),
    AdClick.find({ userId, ts: { $gte: since } })
      .select("campaignId ts")
      .lean(),
  ]);

  const touchpoints: {
    campaignId?: ObjectId;
    type: "impression" | "click";
    ts: Date;
  }[] = [];

  for (const imp of impressions) {
    touchpoints.push({
      campaignId: imp.campaignId,
      type: "impression",
      ts: imp.ts,
    });
  }

  for (const click of clicks) {
    touchpoints.push({
      campaignId: click.campaignId,
      type: "click",
      ts: click.ts,
    });
  }

  return touchpoints.sort((a, b) => b.ts.getTime() - a.ts.getTime());
}

/**
 * Calculate attribution credits based on model
 */
function calculateAttributionCredits(
  touchpoints: {
    campaignId?: ObjectId;
    type: "impression" | "click";
    ts: Date;
  }[],
  model: AttributionModel,
): Record<string, number> {
  const credits: Record<string, number> = {};

  // Get unique campaigns
  const campaigns = [
    ...new Set(
      touchpoints.map((t) => t.campaignId?.toString()).filter(Boolean),
    ),
  ];

  switch (model) {
    case "first_touch":
      // 100% credit to first touch
      const first = touchpoints[0];
      if (first?.campaignId) {
        credits[first.campaignId.toString()] = 1;
      }
      break;

    case "last_touch":
      // 100% credit to last touch
      const last = touchpoints[touchpoints.length - 1];
      if (last?.campaignId) {
        credits[last.campaignId.toString()] = 1;
      }
      break;

    case "linear":
      // Equal credit to all touchpoints
      for (const campaign of campaigns) {
        if (campaign) {
          credits[campaign] = 1 / campaigns.length;
        }
      }
      break;

    case "time_decay":
      // More credit to recent touchpoints
      const decayFactor = 0.5; // Decay factor
      let totalWeight = 0;

      for (const tp of touchpoints) {
        const campaign = tp.campaignId?.toString();
        if (!campaign) continue;

        const position = touchpoints.indexOf(tp);
        const weight = Math.pow(decayFactor, position);

        credits[campaign] = (credits[campaign] || 0) + weight;
        totalWeight += weight;
      }

      // Normalize
      if (totalWeight > 0) {
        for (const campaign of campaigns) {
          if (campaign && credits[campaign]) {
            credits[campaign] /= totalWeight;
          }
        }
      }
      break;

    case "position_based":
      // 40% first, 40% last, 20% middle
      if (touchpoints.length === 1) {
        const firstTp = touchpoints[0];
        const campaign = firstTp?.campaignId?.toString();
        if (campaign) credits[campaign] = 1;
      } else if (touchpoints.length === 2) {
        for (const tp of touchpoints) {
          const campaign = tp.campaignId?.toString();
          if (campaign) credits[campaign] = 0.5;
        }
      } else {
        const firstTp = touchpoints[0];
        const lastTp = touchpoints[touchpoints.length - 1];
        const first = firstTp?.campaignId?.toString();
        const last = lastTp?.campaignId?.toString();

        if (first) credits[first] = 0.4;
        if (last) credits[last] = 0.4;

        const middleCampaigns = touchpoints.slice(1, -1);
        if (middleCampaigns.length > 0) {
          const middleCredit = 0.2 / middleCampaigns.length;
          for (const tp of middleCampaigns) {
            const campaign = tp.campaignId?.toString();
            if (campaign)
              credits[campaign] = (credits[campaign] || 0) + middleCredit;
          }
        }
      }
      break;
  }

  // Apply view-through discount (0.3x for impressions)
  for (const tp of touchpoints) {
    if (tp.type === "impression") {
      const campaign = tp.campaignId?.toString();
      if (campaign && credits[campaign]) {
        credits[campaign] *= 0.3;
      }
    }
  }

  return credits;
}

/**
 * Calculate ROAS for a campaign
 */
export async function calculateCampaignROAS(
  campaignId: ObjectId,
  period: { start: Date; end: Date },
): Promise<IROASReport> {
  await connectDB();

  // Get attributed orders
  const attributedOrders = await getAttributedOrders(campaignId, period);

  // Calculate total revenue
  const orderIds = attributedOrders.map(
    (a) => new mongoose.Types.ObjectId(a.orderId),
  );
  const orders = await Order.find({ _id: { $in: orderIds } }).lean();

  const revenue = orders.reduce((sum, o) => sum + o.pricing.total, 0);

  // Get ad spend
  const impressions = await AdImpression.find({
    campaignId,
    ts: { $gte: period.start, $lte: period.end },
  }).lean();

  const clicks = await AdClick.find({
    campaignId,
    ts: { $gte: period.start, $lte: period.end },
  }).lean();

  const spend = impressions.reduce((sum, i) => sum + (i.actualCPC || 0), 0);

  const totalImpressions = impressions.length;
  const totalClicks = clicks.length;
  const conversions = attributedOrders.length;

  return {
    campaignId,
    revenue,
    spend: Math.round(spend * 100) / 100,
    roas: spend > 0 ? revenue / spend : 0,
    impressions: totalImpressions,
    clicks: totalClicks,
    conversions,
    ctr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
    conversionRate: totalClicks > 0 ? conversions / totalClicks : 0,
    avgCPC: totalClicks > 0 ? spend / totalClicks : 0,
    period,
  };
}

/**
 * Get orders attributed to a campaign
 */
async function getAttributedOrders(
  campaignId: ObjectId,
  period: { start: Date; end: Date },
): Promise<{ orderId: ObjectId; credit: number }[]> {
  // In production, would query an attribution table
  // For now, query orders and re-attribute

  const orders = await Order.find({
    status: "completed",
    createdAt: { $gte: period.start, $lte: period.end },
  })
    .select("_id buyerId createdAt")
    .lean();

  const attributedOrders: { orderId: ObjectId; credit: number }[] = [];

  for (const order of orders) {
    const attribution = await attributeOrder(
      order._id,
      order.buyerId,
      "position_based",
    );
    const campaignAttribution = attribution.find((a) =>
      a.campaignId.equals(campaignId),
    );

    if (campaignAttribution) {
      attributedOrders.push({
        orderId: order._id,
        credit: campaignAttribution.credit,
      });
    }
  }

  return attributedOrders;
}

/**
 * Get multi-touch attribution for an order
 */
export async function getMultiTouchAttribution(
  orderId: ObjectId,
): Promise<IAttributionEntry[]> {
  await connectDB();

  const order = await Order.findById(orderId);
  if (!order) return [];

  return attributeOrder(orderId, order.buyerId, "position_based");
}

/**
 * Aggregate ROAS across multiple campaigns
 */
export async function getAggregatedROAS(
  campaignIds: ObjectId[],
  period: { start: Date; end: Date },
): Promise<IROASReport[]> {
  const reports: IROASReport[] = [];

  for (const campaignId of campaignIds) {
    const report = await calculateCampaignROAS(campaignId, period);
    reports.push(report);
  }

  return reports;
}
