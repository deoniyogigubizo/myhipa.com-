import { ObjectId } from 'mongodb';
import type { IProduct, IUser } from '@/types';

// ============================================
// EMBEDDING SERVICE (Part 2)
// ============================================

// Embedding dimension for OpenAI text-embedding-3-small
export const EMBEDDING_DIMENSION = 1536;

/**
 * Generate embedding for a product using OpenAI API
 * Uses text-embedding-3-small model
 */
export async function generateProductEmbedding(
  product: Pick<IProduct, 'title' | 'description' | 'category' | 'tags'>
): Promise<number[]> {
  const text = buildProductText(product);
  
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating product embedding:', error);
    // Return zero vector as fallback
    return new Array(EMBEDDING_DIMENSION).fill(0);
  }
}

/**
 * Generate embedding for a search query or text
 */
export async function generateTextEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating text embedding:', error);
    return new Array(EMBEDDING_DIMENSION).fill(0);
  }
}

/**
 * Generate embedding for an image using CLIP via OpenAI Vision
 * This is a placeholder - in production you'd use CLIP or a vision model
 */
export async function generateImageEmbedding(imageUrl: string): Promise<number[]> {
  // In production, this would use CLIP or GPT-4 Vision
  // For now, return a placeholder
  console.log('Generating image embedding for:', imageUrl);
  return new Array(EMBEDDING_DIMENSION).fill(0);
}

/**
 * Build text representation of a product for embedding
 */
function buildProductText(product: Pick<IProduct, 'title' | 'description' | 'category' | 'tags'>): string {
  const parts = [
    product.title,
    product.description,
    product.category.primary,
    product.category.secondary || '',
    product.category.tertiary || '',
    ...(product.tags || [])
  ];
  
  return parts.filter(Boolean).join(' ');
}

/**
 * Compute cosine similarity between two vectors
 * Returns value between -1 and 1
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same dimension');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dotProduct += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Compute dot product of two vectors
 */
export function dotProduct(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same dimension');
  }

  return a.reduce((sum, val, i) => sum + val * (b[i] ?? 0), 0);
}

/**
 * Normalize a vector to unit length
 */
export function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector;
  return vector.map(val => val / magnitude);
}

/**
 * Average multiple vectors with optional recency weighting
 */
export function averageVectors(
  vectors: number[][],
  weights?: number[]
): number[] {
  if (vectors.length === 0) {
    return new Array(EMBEDDING_DIMENSION).fill(0);
  }

  const dim = vectors[0]?.length ?? EMBEDDING_DIMENSION;
  const result = new Array(dim).fill(0);
  
  if (weights) {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    for (let i = 0; i < vectors.length; i++) {
      const weight = (weights[i] ?? 1) / totalWeight;
      for (let j = 0; j < dim; j++) {
        result[j] += (vectors[i]?.[j] ?? 0) * weight;
      }
    }
  } else {
    const count = vectors.length;
    for (let i = 0; i < vectors.length; i++) {
      for (let j = 0; j < dim; j++) {
        result[j] += (vectors[i]?.[j] ?? 0) / count;
      }
    }
  }

  return result;
}

/**
 * Find approximate nearest neighbors using brute force with cosine similarity
 * In production, use MongoDB Atlas Vector Search or Pinecone
 */
export function findNearestNeighbors(
  queryVector: number[],
  candidateVectors: { id: string | ObjectId; vector: number[] }[],
  k: number = 10
): { id: string | ObjectId; score: number }[] {
  const similarities = candidateVectors.map(candidate => ({
    id: candidate.id,
    score: cosineSimilarity(queryVector, candidate.vector)
  }));

  // Sort by similarity descending
  similarities.sort((a, b) => b.score - a.score);

  return similarities.slice(0, k);
}

/**
 * Generate a user embedding from their interaction history
 * Weights recency: more recent interactions have higher weight
 */
export function computeUserEmbedding(
  viewedProducts: { embedding: number[]; timestamp: Date; weight: number }[],
  cartedProducts: { embedding: number[]; timestamp: Date; weight: number }[],
  purchasedProducts: { embedding: number[]; timestamp: Date; weight: number }[]
): number[] {
  // Weights: purchased > carted > viewed
  const VIEW_WEIGHT = 1;
  const CART_WEIGHT = 2;
  const PURCHASE_WEIGHT = 3;

  const allInteractions = [
    ...viewedProducts.map(p => ({ ...p, weight: p.weight * VIEW_WEIGHT })),
    ...cartedProducts.map(p => ({ ...p, weight: p.weight * CART_WEIGHT })),
    ...purchasedProducts.map(p => ({ ...p, weight: p.weight * PURCHASE_WEIGHT }))
  ];

  if (allInteractions.length === 0) {
    return new Array(EMBEDDING_DIMENSION).fill(0);
  }

  // Sort by timestamp (most recent first)
  allInteractions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Apply recency decay (more recent = higher weight)
  const now = Date.now();
  const recencyWeights = allInteractions.map(p => {
    const hoursAgo = (now - p.timestamp.getTime()) / (1000 * 60 * 60);
    return 1 / (1 + hoursAgo * 0.1);  // Decay formula from Part 3
  });

  // Combine interaction weights with recency weights
  const finalWeights = allInteractions.map((p, i) => p.weight * (recencyWeights[i] ?? 1));

  return averageVectors(
    allInteractions.map(p => p.embedding),
    finalWeights
  );
}
