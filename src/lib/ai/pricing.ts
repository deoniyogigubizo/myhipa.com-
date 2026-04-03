import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import connectDB from "@/lib/database/mongodb";
import { Product } from "@/lib/database/schemas/product.schema";
import { UserEvent } from "@/lib/database/schemas/ai.schema";
import { generateProductEmbedding, cosineSimilarity } from "./embedding";
import type { IPricingSuggestion, IDemandForecast } from "@/types/ai";

// ============================================
// DYNAMIC PRICING SERVICE (Part 5)
// ============================================

/**
 * Get pricing suggestion for a product
 */
export async function getPricingSuggestion(
  productId: ObjectId,
): Promise<IPricingSuggestion | null> {
  await connectDB();

  const product = await Product.findById(productId);
  if (!product) return null;

  // Find comparable products
  const comparables = await findComparableProducts(product);

  if (comparables.length === 0) {
    return {
      productId,
      currentPrice: product.pricing.base,
      suggestedPrice: product.pricing.base,
      priceRange: {
        p25: product.pricing.base,
        median: product.pricing.base,
        p75: product.pricing.base,
      },
      competitors: 0,
      confidence: 0,
      factors: ["Not enough market data"],
    };
  }

  // Calculate price distribution
  const prices = comparables.map((p) => p.pricing.base).sort((a, b) => a - b);
  const p25 = prices[Math.floor(prices.length * 0.25)];
  const median = prices[Math.floor(prices.length * 0.5)];
  const p75 = prices[Math.floor(prices.length * 0.75)];

  // Get seller's historical conversion rates
  const conversionRates = await getSellerConversionRates(product.sellerId);

  // Get demand signals
  const demandSignals = await getCategoryDemandSignal(product.category.primary);

  // Calculate suggested price
  let suggestedPrice = median;
  const factors: string[] = [];

  // Adjust based on seller's conversion rate
  if (conversionRates.lowPriceHigherConversion) {
    suggestedPrice = median * 0.9;
    factors.push("Lower prices historically convert better for you");
  }

  // Adjust based on demand
  if (demandSignals.trend === "rising") {
    suggestedPrice = Math.max(suggestedPrice, median * 1.05);
    factors.push("Demand is rising in this category");
  } else if (demandSignals.trend === "falling") {
    suggestedPrice = Math.min(suggestedPrice, median * 0.95);
    factors.push("Demand is declining - consider competitive pricing");
  }

  // Check stock levels
  if (product.inventory.totalStock < 5) {
    factors.push("Low stock - consider premium pricing");
  }

  // Calculate confidence based on number of comparables
  const confidence = Math.min(1, comparables.length / 20);

  return {
    productId,
    currentPrice: product.pricing.base,
    suggestedPrice: Math.round(suggestedPrice / 100) * 100, // Round to nearest 100 RWF
    priceRange: { p25, median, p75 },
    competitors: comparables.length,
    confidence,
    factors,
  };
}

/**
 * Find comparable products using vector similarity
 */
async function findComparableProducts(
  product: typeof Product.prototype,
): Promise<(typeof Product.prototype)[]> {
  // Get products in same category
  const candidates = await Product.find({
    _id: { $ne: product._id },
    status: "active",
    "category.primary": product.category.primary,
    "inventory.totalStock": { $gt: 0 },
  })
    .limit(100)
    .lean();

  // If product has embedding, use vector similarity
  if (product.embeddingVector) {
    return candidates
      .filter((c) => c.embeddingVector)
      .map((c) => ({
        ...c,
        similarity: cosineSimilarity(
          product.embeddingVector!,
          c.embeddingVector!,
        ),
      }))
      .filter((c) => c.similarity > 0.7)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 20) as unknown as (typeof Product.prototype)[];
  }

  // Fallback: filter by title similarity
  const productWords = new Set(
    (product.title as string).toLowerCase().split(" "),
  );
  return candidates
    .map((c) => {
      const candidateWords = new Set(
        (c.title as string).toLowerCase().split(" "),
      );
      const intersection = ([...productWords] as string[]).filter((w) =>
        candidateWords.has(w),
      );
      return { ...c, overlap: intersection.length };
    })
    .filter((c) => c.overlap >= 2)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 20) as unknown as (typeof Product.prototype)[];
}

/**
 * Get seller's historical conversion rates at different price points
 */
async function getSellerConversionRates(
  sellerId: ObjectId,
): Promise<{ lowPriceHigherConversion: boolean }> {
  // Aggregate purchase events for this seller
  // In production, this would analyze actual conversion data

  // Placeholder: assume lower prices convert better
  return { lowPriceHigherConversion: true };
}

/**
 * Get demand signal for a category
 */
async function getCategoryDemandSignal(
  category: string,
): Promise<{ trend: "rising" | "falling" | "stable"; volume: number }> {
  // Get search volume for category over past 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const searchCount = await UserEvent.countDocuments({
    event: "search_query",
    "context.query": { $regex: category, $options: "i" },
    ts: { $gte: sevenDaysAgo },
  });

  // Compare to previous 7 days
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const sevenDaysStart = new Date();
  sevenDaysStart.setDate(sevenDaysStart.getDate() - 14);

  const previousSearchCount = await UserEvent.countDocuments({
    event: "search_query",
    "context.query": { $regex: category, $options: "i" },
    ts: { $gte: fourteenDaysAgo, $lt: sevenDaysStart },
  });

  const change =
    previousSearchCount > 0
      ? (searchCount - previousSearchCount) / previousSearchCount
      : 0;

  let trend: "rising" | "falling" | "stable";
  if (change > 0.2) trend = "rising";
  else if (change < -0.2) trend = "falling";
  else trend = "stable";

  return { trend, volume: searchCount };
}

/**
 * Get demand forecast for a category
 */
export async function getDemandForecast(
  category: string,
  daysAhead: number = 30,
): Promise<IDemandForecast> {
  // Get historical data for category
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const purchases = await UserEvent.aggregate([
    {
      $match: {
        event: "purchase",
        ts: { $gte: thirtyDaysAgo },
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "entity.id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $match: {
        "product.category.primary": category,
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$ts" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Simple moving average prediction
  const counts = purchases.map((p) => p.count);
  const avgCount = counts.reduce((a, b) => a + b, 0) / (counts.length || 1);

  // Detect trend
  const recentAvg = counts.slice(-7).reduce((a, b) => a + b, 0) / 7;
  const olderAvg = counts.slice(0, 7).reduce((a, b) => a + b, 0) / 7;

  let trend: "rising" | "falling" | "stable";
  if (recentAvg > olderAvg * 1.1) trend = "rising";
  else if (recentAvg < olderAvg * 0.9) trend = "falling";
  else trend = "stable";

  // Predict future demand
  const predictedDemand = Math.round(
    avgCount *
      (1 + (trend === "rising" ? 0.1 : trend === "falling" ? -0.1 : 0)),
  );

  // Seasonal factors
  const seasonalFactors: IDemandForecast["seasonalFactors"] = [];

  // Check for end-of-month effect (pay day cycles)
  const now = new Date();
  if (now.getDate() >= 25 || now.getDate() <= 5) {
    seasonalFactors.push({
      event: "Pay day cycle",
      impact: 0.35,
      date: new Date().toISOString(),
    });
  }

  // Check for December holiday effect
  const month = now.getMonth();
  if (month === 11) {
    // December
    seasonalFactors.push({
      event: "Holiday season",
      impact: 0.35,
      date: "December",
    });
  }

  // Generate recommendation
  let recommendation = "";
  if (trend === "rising") {
    recommendation = `Demand for ${category} is rising. Consider increasing inventory by 20-30% to capture more sales.`;
  } else if (trend === "falling") {
    recommendation = `Demand is declining. Consider promotions or discounts to maintain sales velocity.`;
  } else {
    recommendation = `Demand is stable. Maintain current inventory levels.`;
  }

  if (seasonalFactors.length > 0) {
    recommendation += ` Note: ${seasonalFactors.map((f) => f.event).join(", ")} typically increases demand.`;
  }

  return {
    category,
    currentDemand: Math.round(recentAvg),
    predictedDemand,
    trend,
    seasonalFactors,
    recommendation,
  };
}

/**
 * Batch generate pricing suggestions for seller's products
 */
export async function batchPricingSuggestions(
  sellerId: ObjectId,
): Promise<IPricingSuggestion[]> {
  await connectDB();

  const products = await Product.find({
    sellerId: new mongoose.Types.ObjectId(sellerId),
    status: { $in: ["active", "paused"] },
  }).lean();

  const suggestions: IPricingSuggestion[] = [];

  for (const product of products) {
    const suggestion = await getPricingSuggestion(product._id);
    if (suggestion) {
      suggestions.push(suggestion);
    }
  }

  return suggestions;
}

/**
 * Update product with AI-suggested price
 */
export async function applySuggestedPrice(
  productId: ObjectId,
  setPrice: boolean = false,
): Promise<boolean> {
  const suggestion = await getPricingSuggestion(productId);

  if (!suggestion || suggestion.confidence < 0.5) {
    return false;
  }

  if (setPrice) {
    await Product.updateOne(
      { _id: new mongoose.Types.ObjectId(productId) },
      {
        $set: {
          "pricing.base": suggestion.suggestedPrice,
          aiSuggestedPrice: suggestion.suggestedPrice,
        },
      },
    );
  } else {
    // Just save the suggestion
    await Product.updateOne(
      { _id: new mongoose.Types.ObjectId(productId) },
      { $set: { aiSuggestedPrice: suggestion.suggestedPrice } },
    );
  }

  return true;
}
