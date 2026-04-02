import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Chat Conversation Schema
 * 
 * Represents a conversation between two users (buyer and seller)
 * 
 * @field participants - Array of user IDs in the conversation
 * @field lastMessage - Reference to the last message for preview
 * @field unreadCount - Map of userId to unread message count
 * @field orderId - Optional reference to an order if conversation is about an order
 * @field productId - Optional reference to a product if conversation is about a product
 * @field status - Conversation status (active, archived, blocked)
 */

// ============================================
// SUB-SCHEMAS
// ============================================

/**
 * Unread Count Sub-document
 */
const UnreadCountSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  count: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

// ============================================
// MAIN CONVERSATION SCHEMA
// ============================================

export interface IConversation extends Document {
  _id: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  lastMessage?: {
    content: string;
    senderId: mongoose.Types.ObjectId;
    createdAt: Date;
  };
  unreadCount: Array<{
    userId: mongoose.Types.ObjectId;
    count: number;
  }>;
  orderId?: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  status: 'active' | 'archived' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

export const ConversationSchema = new Schema<IConversation>(
  {
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true
    }],
    
    lastMessage: {
      content: String,
      senderId: {
        type: Schema.Types.ObjectId,
        ref: 'users'
      },
      createdAt: Date
    },
    
    unreadCount: [UnreadCountSchema],
    
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'orders'
    },
    
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'products'
    },
    
    status: {
      type: String,
      enum: ['active', 'archived', 'blocked'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ 'participants': 1, 'status': 1 });
ConversationSchema.index({ updatedAt: -1 });

export const Conversation: Model<IConversation> = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);

/**
 * Chat Message Schema
 * 
 * Individual messages within a conversation
 * 
 * @field conversationId - Reference to the conversation
 * @field senderId - Reference to the sender
 * @field content - Message content (text, image URL, or product reference)
 * @field contentType - Type of content (text, image, product, order)
 * @field readBy - Array of user IDs who have read this message
 * @field editedAt - Timestamp if message was edited
 * @field deleted - Soft delete flag
 */

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  contentType: 'text' | 'image' | 'product' | 'order';
  productId?: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  imageUrl?: string;
  readBy: mongoose.Types.ObjectId[];
  editedAt?: Date;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    
    content: {
      type: String,
      required: true
    },
    
    contentType: {
      type: String,
      enum: ['text', 'image', 'product', 'order'],
      default: 'text'
    },
    
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'products'
    },
    
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'orders'
    },
    
    imageUrl: {
      type: String
    },
    
    readBy: [{
      type: Schema.Types.ObjectId,
      ref: 'users'
    }],
    
    editedAt: {
      type: Date
    },
    
    deleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ readBy: 1 });

export const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

/**
 * Typing Indicator Schema
 * 
 * Tracks who is currently typing in a conversation
 */

export interface ITypingIndicator extends Document {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  isTyping: boolean;
  updatedAt: Date;
}

export const TypingIndicatorSchema = new Schema<ITypingIndicator>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true
    },
    
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    
    isTyping: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

TypingIndicatorSchema.index({ conversationId: 1, userId: 1 }, { unique: true });

export const TypingIndicator: Model<ITypingIndicator> = mongoose.models.TypingIndicator || mongoose.model<ITypingIndicator>('TypingIndicator', TypingIndicatorSchema);
