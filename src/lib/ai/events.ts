import { ObjectId } from 'mongodb';
import connectDB from '@/lib/database/mongodb';
import { UserEvent, UserProfileAI } from '@/lib/database/schemas/ai.schema';
import type { 
  IUserEvent, 
  HipaEventType, 
  IEventEntity, 
  IEventContext, 
  IEventLocation,
  DeviceType 
} from '@/types/ai';
import { generateProductEmbedding, computeUserEmbedding } from './embedding';
import { Product } from '@/lib/database/schemas/product.schema';

// ============================================
// EVENT TRACKING SERVICE (Part 1 - Signal Collection)
// ============================================

/**
 * Create a new user event - logs to fast write store (Redis stream → MongoDB)
 */
export async function trackEvent(
  eventData: {
    userId?: ObjectId | null;
    sessionId: string;
    event: HipaEventType;
    entity: IEventEntity;
    context: IEventContext;
    device?: DeviceType;
    location: IEventLocation;
    metadata?: Record<string, unknown>;
  }
): Promise<IUserEvent> {
  await connectDB();

  const event = {
    userId: eventData.userId || null,
    sessionId: eventData.sessionId,
    event: eventData.event,
    entity: eventData.entity,
    context: eventData.context,
    device: eventData.device || 'mobile',
    location: eventData.location,
    ts: new Date(),
    metadata: eventData.metadata || {}
  } as Partial<IUserEvent>;

  const createdEvent = await UserEvent.create(event);

  // Trigger async processing based on event type
  processEventAsync(createdEvent).catch(console.error);

  return createdEvent;
}

/**
 * Process events asynchronously for downstream systems
 */
async function processEventAsync(event: IUserEvent): Promise<void> {
  // Update user profile AI for relevant events
  if (event.userId && ['product_view', 'add_to_cart', 'purchase'].includes(event.event)) {
    await updateUserProfileOnEvent(event.userId, event);
  }

  // Generate product embedding if needed
  if (event.event === 'product_view' && event.entity.type === 'product') {
    await ensureProductEmbedding(event.entity.id);
  }
}

/**
 * Ensure a product has an embedding vector
 */
async function ensureProductEmbedding(productId: ObjectId): Promise<void> {
  const product = await Product.findById(productId).select('title description category tags');
  
  if (!product) return;

  // Check if embedding already exists (would be stored in separate collection)
  // For now, we'll generate on-demand and could cache it
  try {
    const embedding = await generateProductEmbedding({
      title: product.title,
      description: product.description,
      category: product.category,
      tags: product.tags || []
    });
    
    // In production, store in ProductEmbedding collection
    // await ProductEmbedding.updateOne(
    //   { productId },
    //   { $set: { embeddingVector: embedding, generatedAt: new Date() } },
    //   { upsert: true }
    // );
    
    // Update product document with embedding (if using MongoDB vector search)
    await Product.updateOne(
      { _id: productId },
      { $set: { embeddingVector: embedding } }
    );
  } catch (error) {
    console.error('Error generating product embedding:', error);
  }
}

/**
 * Update user profile AI based on event
 */
async function updateUserProfileOnEvent(
  userId: ObjectId,
  event: IUserEvent
): Promise<void> {
  // This is a simplified version - full implementation would 
  // aggregate all user events to rebuild the profile
  try {
    let profile = await UserProfileAI.findOne({ userId });
    
    if (!profile) {
      profile = await UserProfileAI.create({
        userId,
        embeddingVector: new Array(1536).fill(0),
        topCategories: [],
        topBrands: [],
        priceRange: { min: 0, max: 0 },
        interestSegments: [],
        lookalikes: [],
        coldStart: true,
        lastUpdated: new Date()
      });
    }

    // Update category preferences
    if (event.entity.type === 'product') {
      // Would fetch product category and update profile
      // This is a placeholder
    }

    // Mark profile as needing update
    profile.lastUpdated = new Date();
    await profile.save();
  } catch (error) {
    console.error('Error updating user profile:', error);
  }
}

/**
 * Get session events for a session
 */
export async function getSessionEvents(sessionId: string): Promise<IUserEvent[]> {
  await connectDB();
  return UserEvent.find({ sessionId }).sort({ ts: 1 }).lean();
}

/**
 * Get user events within a time range
 */
export async function getUserEvents(
  userId: ObjectId,
  options: {
    eventTypes?: HipaEventType[];
    entityTypes?: string[];
    since?: Date;
    limit?: number;
  } = {}
): Promise<IUserEvent[]> {
  await connectDB();

  const query: Record<string, unknown> = { userId };
  
  if (options.eventTypes?.length) {
    query.event = { $in: options.eventTypes };
  }
  
  if (options.entityTypes?.length) {
    query['entity.type'] = { $in: options.entityTypes };
  }
  
  if (options.since) {
    query.ts = { $gte: options.since };
  }

  return UserEvent.find(query)
    .sort({ ts: -1 })
    .limit(options.limit || 100)
    .lean();
}

/**
 * Get user's product interaction history for embedding computation
 */
export async function getUserProductHistory(userId: ObjectId): Promise<{
  viewed: { productId: ObjectId; timestamp: Date; embedding?: number[] }[];
  carted: { productId: ObjectId; timestamp: Date; embedding?: number[] }[];
  purchased: { productId: ObjectId; timestamp: Date; embedding?: number[] }[];
}> {
  const viewed = await UserEvent.find({
    userId,
    event: 'product_view',
    'entity.type': 'product'
  })
  .sort({ ts: -1 })
  .limit(100)
  .lean();

  const carted = await UserEvent.find({
    userId,
    event: 'add_to_cart',
    'entity.type': 'product'
  })
  .sort({ ts: -1 })
  .limit(50)
  .lean();

  const purchased = await UserEvent.find({
    userId,
    event: 'purchase',
    'entity.type': 'product'
  })
  .sort({ ts: -1 })
  .limit(50)
  .lean();

  return {
    viewed: viewed.map(e => ({ productId: e.entity.id, timestamp: e.ts })),
    carted: carted.map(e => ({ productId: e.entity.id, timestamp: e.ts })),
    purchased: purchased.map(e => ({ productId: e.entity.id, timestamp: e.ts }))
  };
}

/**
 * Rebuild user embedding from scratch
 */
export async function rebuildUserEmbedding(userId: ObjectId): Promise<number[]> {
  await connectDB();

  const history = await getUserProductHistory(userId);
  
  // Get embeddings for all products
  const getEmbeddings = async (productIds: ObjectId[]) => {
    const products = await Product.find({ _id: { $in: productIds } })
      .select('embeddingVector')
      .lean();
    
    return products.map(p => ({
      embedding: p.embeddingVector || new Array(1536).fill(0),
      timestamp: history.viewed.find(h => h.productId.equals(p._id))?.timestamp || new Date()
    }));
  };

  const viewedEmbeddings = await getEmbeddings(history.viewed.map(v => v.productId));
  const cartedEmbeddings = await getEmbeddings(history.carted.map(c => c.productId));
  const purchasedEmbeddings = await getEmbeddings(history.purchased.map(p => p.productId));

  const userEmbedding = computeUserEmbedding(
    viewedEmbeddings.map((e, i) => ({ 
      embedding: e.embedding, 
      timestamp: e.timestamp,
      weight: 1 
    })),
    cartedEmbeddings.map((e, i) => ({ 
      embedding: e.embedding, 
      timestamp: e.timestamp,
      weight: 2 
    })),
    purchasedEmbeddings.map((e, i) => ({ 
      embedding: e.embedding, 
      timestamp: e.timestamp,
      weight: 3 
    }))
  );

  // Update user profile with new embedding
  await UserProfileAI.updateOne(
    { userId },
    { 
      $set: { 
        embeddingVector: userEmbedding,
        coldStart: false,
        lastUpdated: new Date()
      }
    },
    { upsert: true }
  );

  return userEmbedding;
}

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Parse device type from user agent
 */
export function parseDeviceType(userAgent: string | undefined): DeviceType {
  if (!userAgent) return 'mobile';
  
  const ua = userAgent.toLowerCase();
  if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'mobile';
  return 'desktop';
}
