import { ObjectId } from 'mongodb';
import connectDB from '@/lib/database/mongodb';
import { ChatbotSession } from '@/lib/database/schemas/ai.schema';
import { Seller } from '@/lib/database/schemas/seller.schema';
import { Product } from '@/lib/database/schemas/product.schema';
import type { IChatbotContext, IChatbotMessage } from '@/types/ai';

// ============================================
// AI CHATBOT SERVICE (Part 10)
// ============================================

/**
 * Generate response from AI chatbot
 */
export async function generateChatbotResponse(
  storeId: ObjectId,
  userMessage: string,
  userId?: ObjectId | null,
  sessionId?: string
): Promise<{ response: string; sessionId: string }> {
  await connectDB();

  // Get store context
  const storeContext = await getStoreContext(storeId);

  if (!storeContext) {
    return { 
      response: "Sorry, I couldn't find information about this store.", 
      sessionId: sessionId || '' 
    };
  }

  // Get or create session
  const chatSession = await getOrCreateSession(
    storeId, 
    userId, 
    sessionId || `session_${Date.now()}`
  );

  // Build conversation history
  const recentMessages = chatSession.messages.slice(-10);
  const conversationHistory = recentMessages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');

  // Generate response using LLM
  const response = await generateLLMResponse(
    userMessage,
    storeContext,
    conversationHistory
  );

  // Save message to session
  await saveChatMessage(chatSession._id!, {
    role: 'user',
    content: userMessage
  });

  await saveChatMessage(chatSession._id!, {
    role: 'assistant',
    content: response
  });

  return { response, sessionId: chatSession.sessionId };
}

/**
 * Get store context for chatbot
 */
async function getStoreContext(storeId: ObjectId): Promise<IChatbotContext | null> {
  const seller = await Seller.findById(storeId)
    .select('store policies')
    .lean();

  if (!seller) return null;

  // Get top products
  const products = await Product.find({
    sellerId: storeId,
    status: 'active',
    'inventory.totalStock': { $gt: 0 }
  })
  .sort({ 'stats.views': -1 })
  .limit(10)
  .select('title pricing.base inventory.totalStock')
  .lean();

  return {
    storeId: seller._id,
    storeName: seller.store?.name || 'Store',
    policies: {
      shipping: seller.policies?.shipping || 'Standard shipping',
      returns: seller.policies?.returns || 'No returns',
      paymentMethods: ['Mobile Money', 'Card', 'Cash on Delivery']
    },
    topProducts: products.map(p => ({
      id: p._id,
      name: p.title,
      price: p.pricing?.base || 0,
      stock: p.inventory?.totalStock || 0
    }))
  };
}

/**
 * Get or create chat session
 */
async function getOrCreateSession(
  storeId: ObjectId,
  userId?: ObjectId | null,
  sessionId?: string
): Promise<{ _id: ObjectId; sessionId: string; messages: IChatbotMessage[] }> {
  let session;

  if (sessionId) {
    session = await ChatbotSession.findOne({ sessionId, storeId });
  }

  if (!session && userId) {
    session = await ChatbotSession.findOne({ userId, storeId });
  }

  if (!session) {
    session = await ChatbotSession.create({
      userId: userId || null,
      sessionId: sessionId || `session_${Date.now()}`,
      storeId,
      messages: [],
      resolved: false
    });
  }

  return session as { _id: ObjectId; sessionId: string; messages: IChatbotMessage[] };
}

/**
 * Save message to chat session
 */
async function saveChatMessage(
  sessionId: ObjectId,
  message: { role: 'user' | 'assistant'; content: string }
): Promise<void> {
  await ChatbotSession.updateOne(
    { _id: sessionId },
    {
      $push: {
        messages: {
          role: message.role,
          content: message.content,
          ts: new Date()
        }
      }
    }
  );
}

/**
 * Generate response using LLM
 */
async function generateLLMResponse(
  userMessage: string,
  storeContext: IChatbotContext,
  conversationHistory: string
): Promise<string> {
  const systemPrompt = buildChatbotSystemPrompt(storeContext);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...(conversationHistory ? [{ role: 'system', content: `Recent conversation:\n${conversationHistory}` }] : []),
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "I'm not sure how to answer that. Let me connect you with the seller.";
  } catch (error) {
    console.error('Error generating chatbot response:', error);
    return "I'm having trouble processing your request. Please try again or contact the seller directly.";
  }
}

/**
 * Build system prompt for seller chatbot
 */
function buildChatbotSystemPrompt(context: IChatbotContext): string {
  const productsSummary = context.topProducts
    .slice(0, 5)
    .map(p => `- ${p.name}: ${p.price} RWF (${p.stock > 0 ? 'In Stock' : 'Out of Stock'})`)
    .join('\n');

  return `You are the customer service assistant for ${context.storeName}.
Store policies:
- Shipping: ${context.policies.shipping}
- Returns: ${context.policies.returns}
- Payment methods: ${context.policies.paymentMethods.join(', ')}

Current popular products:
${productsSummary}

Guidelines:
- Answer questions helpfully and concisely
- Provide accurate information about product availability and pricing
- If you don't know something, say "Let me connect you with the seller"
- Never make up information
- Be friendly and professional
- Keep responses short and to the point`;
}

/**
 * Get chat history for a session
 */
export async function getChatHistory(
  sessionId: string,
  storeId: ObjectId
): Promise<IChatbotMessage[]> {
  await connectDB();

  const session = await ChatbotSession.findOne({ sessionId, storeId })
    .select('messages')
    .lean();

  return session?.messages || [];
}

/**
 * Mark session as resolved
 */
export async function resolveChatSession(sessionId: string): Promise<void> {
  await connectDB();

  await ChatbotSession.updateOne(
    { sessionId },
    { $set: { resolved: true } }
  );
}

/**
 * Seller-facing AI assistant
 */
export async function generateSellerAssistantResponse(
  sellerId: ObjectId,
  userMessage: string
): Promise<string> {
  // Get seller context
  const seller = await Seller.findById(sellerId)
    .select('store stats policies')
    .lean();

  if (!seller) {
    return "I couldn't find your store information.";
  }

  const systemPrompt = `You are an AI assistant for a seller on Hipa, an e-commerce marketplace.
Store: ${seller.store?.name}
Total Orders: ${seller.stats?.totalOrders || 0}
Average Rating: ${seller.stats?.avgRating || 0}

You can help with:
- Drafting product descriptions from bullet points
- Suggesting tags for better SEO
- Summarizing customer feedback
- Writing reply templates for common buyer messages
- Advice on pricing and promotions

Be concise and actionable.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await response.json();
    return data.choices[0]?.message?.content || "I'm having trouble processing your request.";
  } catch (error) {
    console.error('Error generating seller assistant response:', error);
    return "I'm having trouble processing your request. Please try again.";
  }
}
