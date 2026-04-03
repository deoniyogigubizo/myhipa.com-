import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import connectDB from "@/lib/database/mongodb";
import { Product } from "@/lib/database/schemas/product.schema";
import {
  generateTextEmbedding,
  generateImageEmbedding,
  cosineSimilarity,
} from "./embedding";
import type {
  IQueryUnderstanding,
  ISearchResult,
  IVisualSearchResult,
} from "@/types/ai";

// ============================================
// SEARCH AI SERVICE (Part 4)
// ============================================

/**
 * Layer 1: Keyword matching using MongoDB Atlas Search
 * This is the fast, always-on keyword search
 */
export async function keywordSearch(
  query: string,
  options: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
    location?: string;
    limit?: number;
  } = {},
): Promise<ISearchResult[]> {
  await connectDB();

  const searchQuery: Record<string, unknown> = {
    status: "active",
    $text: { $search: query },
  };

  // Apply filters
  if (options.category) {
    searchQuery["category.primary"] = options.category;
  }
  if (options.minPrice !== undefined) {
    searchQuery["pricing.base"] = { $gte: options.minPrice };
  }
  if (options.maxPrice !== undefined) {
    searchQuery["pricing.base"] = { $lte: options.maxPrice };
  }
  if (options.brand) {
    searchQuery["tags"] = options.brand;
  }

  const limit = options.limit || 50;

  const products = await Product.find(searchQuery)
    .sort({ score: { $meta: "textScore" } })
    .limit(limit)
    .lean();

  return products.map((p) => ({
    itemId: p._id,
    itemType: "product" as const,
    keywordScore: (p as unknown as { score?: number }).score || 0.5,
    semanticScore: 0,
    sellerTrustScore: 0.5,
    adBoostScore: 0,
    finalScore: 0,
  }));
}

/**
 * Layer 2: Semantic search using vector embeddings
 * Used when keyword search returns few results or query is natural language
 */
export async function semanticSearch(
  query: string,
  options: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
    location?: string;
    userEmbedding?: number[];
    limit?: number;
  } = {},
): Promise<ISearchResult[]> {
  await connectDB();

  // Generate query embedding
  const queryEmbedding = await generateTextEmbedding(query);

  // Build filter
  const filter: Record<string, unknown> = {
    status: "active",
    embeddingVector: { $exists: true, $ne: [] },
  };

  if (options.category) {
    filter["category.primary"] = options.category;
  }
  if (options.minPrice !== undefined) {
    filter["pricing.base"] = { $gte: options.minPrice };
  }
  if (options.maxPrice !== undefined) {
    filter["pricing.base"] = { $lte: options.maxPrice };
  }
  if (options.brand) {
    filter["tags"] = options.brand;
  }

  // In production, use MongoDB Atlas Vector Search:
  // $vectorSearch with index "product_embeddings"
  // For now, we'll do a simplified in-memory approach

  const limit = options.limit || 50;
  const numCandidates = options.limit ? options.limit * 10 : 200;

  const products = await Product.find(filter).limit(numCandidates).lean();

  // Calculate semantic scores
  const results: ISearchResult[] = products
    .map((p) => {
      let semanticScore = 0;
      if (p.embeddingVector && queryEmbedding) {
        semanticScore = cosineSimilarity(queryEmbedding, p.embeddingVector);
        // Normalize to 0-1
        semanticScore = (semanticScore + 1) / 2;
      }
      return {
        itemId: p._id,
        itemType: "product" as const,
        keywordScore: 0,
        semanticScore,
        sellerTrustScore: 0.5,
        adBoostScore: 0,
        finalScore: 0,
      };
    })
    .sort((a, b) => b.semanticScore - a.semanticScore)
    .slice(0, limit);

  return results;
}

/**
 * Layer 3: Query understanding using LLM
 * Extracts structured filters from natural language queries
 */
export async function understandQuery(
  query: string,
  location?: string,
): Promise<IQueryUnderstanding> {
  // Use GPT-4o-mini for cheap, fast query parsing
  const systemPrompt = `You are a query understanding assistant for an e-commerce marketplace in Rwanda.
Extract structured filters from user queries.

Rules:
- Extract brand names as "brand"
- Extract category as "category" 
- Extract price constraints as "minPrice" or "maxPrice" (in RWF)
- Extract location as "location"
- Extract product attributes as "attributes" (e.g., "good battery", "large screen")
- Keywords should be the main product search terms
- Intent should be: "browse", "search", "compare", "buy", or "research"

Example: "samsung phone under 400k with good battery kigali"
Output:
{
  "keywords": "samsung phone",
  "filters": {
    "brand": "Samsung",
    "category": "smartphones",
    "maxPrice": 400000,
    "attributes": ["good battery"],
    "location": "Kigali"
  },
  "intent": "buy"
}

Example: "cheap laptop for college"
Output:
{
  "keywords": "laptop",
  "filters": {
    "category": "laptops",
    "attributes": ["student", "budget"]
  },
  "intent": "buy"
}

Now process this query: "${query}"${location ? ` (user is in ${location})` : ""}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "{}";

    // Parse JSON from response
    const parsed = JSON.parse(content);

    return {
      keywords: parsed.keywords || query,
      filters: {
        brand: parsed.filters?.brand,
        category: parsed.filters?.category,
        maxPrice: parsed.filters?.maxPrice,
        minPrice: parsed.filters?.minPrice,
        attributes: parsed.filters?.attributes,
        location: parsed.filters?.location || location,
      },
      intent: parsed.intent || "search",
      originalQuery: query,
    };
  } catch (error) {
    console.error("Error understanding query:", error);
    // Fallback to basic parsing
    return {
      keywords: query,
      filters: { location: location || undefined },
      intent: "search",
      originalQuery: query,
    };
  }
}

/**
 * Combined search - runs all layers and blends results
 */
export async function unifiedSearch(
  query: string,
  options: {
    userId?: ObjectId | null;
    location?: string;
    category?: string;
    limit?: number;
    useSemantic?: boolean;
  } = {},
): Promise<ISearchResult[]> {
  const limit = options.limit || 20;

  // First, try to understand the query
  const queryUnderstanding = await understandQuery(query, options.location);

  // Layer 1: Keyword search (always runs)
  let keywordResults = await keywordSearch(queryUnderstanding.keywords, {
    category: options.category || queryUnderstanding.filters.category,
    minPrice: queryUnderstanding.filters.minPrice,
    maxPrice: queryUnderstanding.filters.maxPrice,
    brand: queryUnderstanding.filters.brand,
    location: queryUnderstanding.filters.location,
    limit,
  });

  let semanticResults: ISearchResult[] = [];

  // Layer 2: Semantic search (runs if keyword returns < 10 results or query is complex)
  if (
    options.useSemantic ||
    keywordResults.length < 10 ||
    isComplexQuery(query)
  ) {
    semanticResults = await semanticSearch(query, {
      category:
        options.category || queryUnderstanding.filters.category || undefined,
      minPrice: queryUnderstanding.filters.minPrice,
      maxPrice: queryUnderstanding.filters.maxPrice,
      brand: queryUnderstanding.filters.brand,
      location: queryUnderstanding.filters.location || undefined,
      limit,
    });
  }

  // Blend results
  const blendedResults = blendSearchResults(
    keywordResults,
    semanticResults,
    keywordResults.length >= 10,
  );

  // Add seller trust scores
  await enrichWithSellerTrust(blendedResults);

  // Apply ad boost (would check active campaigns)
  // await applyAdBoost(blendedResults);

  return blendedResults.slice(0, limit);
}

/**
 * Check if query is complex enough to warrant semantic search
 */
function isComplexQuery(query: string): boolean {
  const complexIndicators = [
    "under",
    "around",
    "between",
    "cheap",
    "affordable",
    "best",
    "good",
    "with",
    "for",
    "recommend",
    "similar",
    "like",
  ];
  const words = query.toLowerCase().split(" ");
  return words.some((w) => complexIndicators.includes(w));
}

/**
 * Blend keyword and semantic results
 */
function blendSearchResults(
  keywordResults: ISearchResult[],
  semanticResults: ISearchResult[],
  keywordSufficient: boolean,
): ISearchResult[] {
  const WEIGHTS = {
    keyword: 0.5,
    semantic: 0.5,
  };

  // If keyword search returned enough results, weight it more
  if (keywordSufficient) {
    WEIGHTS.keyword = 0.7;
    WEIGHTS.semantic = 0.3;
  }

  // Create a map of all unique items
  const itemMap = new Map<string, ISearchResult>();

  // Add keyword results
  for (const result of keywordResults) {
    const key = result.itemId.toString();
    itemMap.set(key, {
      ...result,
      keywordScore: result.keywordScore * WEIGHTS.keyword,
      semanticScore: 0,
      finalScore: 0,
    });
  }

  // Add/merge semantic results
  for (const result of semanticResults) {
    const key = result.itemId.toString();
    const existing = itemMap.get(key);

    if (existing) {
      // Merge scores
      existing.semanticScore = result.semanticScore * WEIGHTS.semantic;
    } else {
      itemMap.set(key, {
        ...result,
        keywordScore: 0,
        semanticScore: result.semanticScore * WEIGHTS.semantic,
      });
    }
  }

  // Calculate final scores
  const results = Array.from(itemMap.values()).map((r) => ({
    ...r,
    finalScore:
      r.keywordScore + r.semanticScore + r.sellerTrustScore + r.adBoostScore,
  }));

  // Sort by final score
  results.sort((a, b) => b.finalScore - a.finalScore);

  return results;
}

/**
 * Enrich results with seller trust scores
 */
async function enrichWithSellerTrust(results: ISearchResult[]): Promise<void> {
  await connectDB();

  const { Seller } = await import("@/lib/database/schemas/seller.schema");

  const productIds = results.map((r) => r.itemId);
  const products = await Product.find({
    _id: { $in: productIds.map((id) => new mongoose.Types.ObjectId(id)) },
  })
    .select("sellerId")
    .lean();

  const sellerIds = [...new Set(products.map((p) => p.sellerId))];
  const sellers = await Seller.find({
    _id: { $in: sellerIds.map((id) => new mongoose.Types.ObjectId(id)) },
  })
    .select("stats kycStatus")
    .lean();

  const sellerTrustMap = new Map(
    sellers.map((s) => [
      s._id.toString(),
      Math.min(
        1,
        0.3 +
          (s.stats?.avgRating || 0) / 10 +
          (s.kycStatus === "verified" ? 0.2 : 0),
      ),
    ]),
  );

  for (const product of products) {
    const result = results.find((r) => r.itemId.equals(product._id));
    if (result) {
      result.sellerTrustScore =
        sellerTrustMap.get(product.sellerId.toString()) || 0.3;
      result.finalScore += result.sellerTrustScore * 0.1; // 10% weight for seller trust
    }
  }
}

/**
 * Visual search - find products similar to an image
 */
export async function visualSearch(
  imageUrl: string,
  options: {
    category?: string;
    limit?: number;
  } = {},
): Promise<IVisualSearchResult> {
  // Generate embedding from image
  const imageEmbedding = await generateImageEmbedding(imageUrl);

  // Describe the image using vision model
  const description = await describeImage(imageUrl);

  // Search using the image embedding
  const results = await semanticSearch(description, {
    category: options.category || undefined,
    limit: options.limit || 20,
  });

  return {
    description,
    products: results,
  };
}

/**
 * Describe an image using vision model
 */
async function describeImage(imageUrl: string): Promise<string> {
  // In production, use GPT-4 Vision or CLIP
  // This is a placeholder
  console.log("Describing image:", imageUrl);
  return "product";
}

/**
 * Voice search - transcribe and process speech
 */
export async function voiceSearch(
  audioBlob: Blob,
  options: {
    language?: string;
  } = {},
): Promise<IQueryUnderstanding> {
  // Use Web Speech API for transcription (client-side)
  // This would be called from the frontend

  // For server-side, you'd use a speech-to-text service
  // Placeholder: return basic understanding
  return {
    keywords: "",
    filters: {},
    intent: "search",
    originalQuery: "",
  };
}

/**
 * Get search suggestions based on partial query
 */
export async function getSearchSuggestions(
  partialQuery: string,
  limit: number = 5,
): Promise<string[]> {
  await connectDB();

  // Get popular search queries from events (would aggregate)
  // For now, return some suggestions based on prefix

  const popularQueries = [
    "samsung phone",
    "tecno phone",
    "iphone",
    "laptop",
    "air fryer",
    "blender",
    "television",
    "wireless earbuds",
    "smart watch",
    "power bank",
  ];

  const lowerQuery = partialQuery.toLowerCase();
  return popularQueries
    .filter((q) => q.toLowerCase().startsWith(lowerQuery))
    .slice(0, limit);
}
