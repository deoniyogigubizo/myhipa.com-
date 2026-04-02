import mongoose, { Schema, Document } from 'mongoose';

// ============================================
// POST TYPES
// ============================================

export type PostType = 
  | 'product_share'    // "I just listed this — check it out"
  | 'review_post'      // Shares a review publicly to feed
  | 'question'         // "Does anyone know a supplier for X?"
  | 'deal_alert'       // "Flash sale for next 2 hours"
  | 'community_update' // Text/image/video post
  | 'ama_question';   // Question during AMA session

export type PostStatus = 'draft' | 'published' | 'hidden' | 'under_review' | 'deleted';

// ============================================
// POST SCHEMA
// ============================================

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  author: {
    userId: mongoose.Types.ObjectId;
    name: string;
    avatar?: string;
    isVerified: boolean;
    reputationScore: number;
    level: string;
  };
  type: PostType;
  content: {
    text: string;
    media?: Array<{
      type: 'image' | 'video';
      url: string;
      thumbnail?: string;
    }>;
    productId?: mongoose.Types.ObjectId;
    productSnapshot?: {
      title: string;
      price: number;
      image: string;
      slug: string;
    };
  };
  groupId?: mongoose.Types.ObjectId;
  visibility: 'public' | 'followers' | 'group' | 'premium';
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    views: number;
  };
  likedBy: mongoose.Types.ObjectId[];
  savedBy: mongoose.Types.ObjectId[];
  mentions: mongoose.Types.ObjectId[];
  tags: string[];
  location?: {
    city: string;
    country: string;
  };
  status: PostStatus;
  flags: Array<{
    userId: mongoose.Types.ObjectId;
    reason: string;
    createdAt: Date;
  }>;
  boosted: boolean;
  boostedUntil?: Date;
  aiScore: number; // For feed ranking algorithm
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const PostSchema = new Schema<IPost>(
  {
    author: {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      name: { type: String, required: true },
      avatar: String,
      isVerified: { type: Boolean, default: false },
      reputationScore: { type: Number, default: 0 },
      level: { type: String, default: 'newcomer' },
    },
    type: {
      type: String,
      enum: ['product_share', 'review_post', 'question', 'deal_alert', 'community_update', 'ama_question'],
      required: true,
    },
    content: {
      text: { type: String, required: true },
      media: [{
        type: { type: String, enum: ['image', 'video'] },
        url: String,
        thumbnail: String,
      }],
      productId: { type: Schema.Types.ObjectId, ref: 'Product' },
      productSnapshot: {
        title: String,
        price: Number,
        image: String,
        slug: String,
      },
    },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
    visibility: {
      type: String,
      enum: ['public', 'followers', 'group', 'premium'],
      default: 'public',
    },
    engagement: {
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
      views: { type: Number, default: 0 },
    },
    likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    savedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    tags: [String],
    location: {
      city: String,
      country: String,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'hidden', 'under_review', 'deleted'],
      default: 'published',
    },
    flags: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      reason: String,
      createdAt: { type: Date, default: Date.now },
    }],
    boosted: { type: Boolean, default: false },
    boostedUntil: Date,
    aiScore: { type: Number, default: 0 },
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for feed queries
PostSchema.index({ createdAt: -1 });
PostSchema.index({ 'author.userId': 1 });
PostSchema.index({ groupId: 1 });
PostSchema.index({ status: 1, createdAt: -1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ aiScore: -1 });

// ============================================
// COMMENT SCHEMA
// ============================================

export interface IComment extends Document {
  _id: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  parentCommentId?: mongoose.Types.ObjectId;
  author: {
    userId: mongoose.Types.ObjectId;
    name: string;
    avatar?: string;
    isVerified: boolean;
    level: string;
  };
  content: {
    text: string;
    media?: Array<{
      type: 'image' | 'video';
      url: string;
    }>;
  };
  upvotes: number;
  upvotedBy: mongoose.Types.ObjectId[];
  isPinned: boolean;
  isAcceptedAnswer: boolean;
  status: PostStatus;
  flags: Array<{
    userId: mongoose.Types.ObjectId;
    reason: string;
    createdAt: Date;
  }>;
  mentions: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    parentCommentId: { type: Schema.Types.ObjectId, ref: 'Comment' },
    author: {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      name: { type: String, required: true },
      avatar: String,
      isVerified: { type: Boolean, default: false },
      level: { type: String, default: 'newcomer' },
    },
    content: {
      text: { type: String, required: true },
      media: [{
        type: { type: String, enum: ['image', 'video'] },
        url: String,
      }],
    },
    upvotes: { type: Number, default: 0 },
    upvotedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isPinned: { type: Boolean, default: false },
    isAcceptedAnswer: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['draft', 'published', 'hidden', 'under_review', 'deleted'],
      default: 'published',
    },
    flags: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      reason: String,
      createdAt: { type: Date, default: Date.now },
    }],
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

CommentSchema.index({ postId: 1, createdAt: -1 });
CommentSchema.index({ parentCommentId: 1 });

// ============================================
// GROUP SCHEMA
// ============================================

export type GroupType = 'category' | 'location' | 'interest' | 'seller_only';
export type GroupPrivacy = 'public' | 'private' | 'seller_only';

export interface IGroup extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  type: GroupType;
  privacy: GroupPrivacy;
  category?: string;
  location?: {
    city: string;
    country: string;
  };
  coverImage?: string;
  icon?: string;
  admin: {
    userId: mongoose.Types.ObjectId;
    name: string;
  };
  moderators: Array<{
    userId: mongoose.Types.ObjectId;
    name: string;
    addedAt: Date;
  }>;
  members: Array<{
    userId: mongoose.Types.ObjectId;
    role: 'member' | 'moderator' | 'admin';
    joinedAt: Date;
  }>;
  memberCount: number;
  rules?: string[];
  pinnedPosts: mongoose.Types.ObjectId[];
  weeklyDigestEnabled: boolean;
  groupDeals: Array<{
    sellerId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    discount: number;
    expiresAt: Date;
  }>;
  stats: {
    postsThisWeek: number;
    postsThisMonth: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ['category', 'location', 'interest', 'seller_only'],
      required: true,
    },
    privacy: {
      type: String,
      enum: ['public', 'private', 'seller_only'],
      default: 'public',
    },
    category: String,
    location: {
      city: String,
      country: String,
    },
    coverImage: String,
    icon: String,
    admin: {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      name: { type: String, required: true },
    },
    moderators: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      name: String,
      addedAt: { type: Date, default: Date.now },
    }],
    members: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, enum: ['member', 'moderator', 'admin'], default: 'member' },
      joinedAt: { type: Date, default: Date.now },
    }],
    memberCount: { type: Number, default: 0 },
    rules: [String],
    pinnedPosts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
    weeklyDigestEnabled: { type: Boolean, default: true },
    groupDeals: [{
      sellerId: { type: Schema.Types.ObjectId, ref: 'Seller' },
      productId: { type: Schema.Types.ObjectId, ref: 'Product' },
      discount: Number,
      expiresAt: Date,
    }],
    stats: {
      postsThisWeek: { type: Number, default: 0 },
      postsThisMonth: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

GroupSchema.index({ slug: 1 }, { unique: true });
GroupSchema.index({ type: 1, isActive: 1 });
GroupSchema.index({ 'members.userId': 1 });

// ============================================
// GROUP MEMBER SCHEMA (Separate collection)
// ============================================

export type GroupMemberRole = 'member' | 'moderator' | 'admin';

export interface IGroupMember extends Document {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: GroupMemberRole;
  joinedAt: Date;
}

const GroupMemberSchema = new Schema<IGroupMember>(
  {
    groupId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Group', 
      required: true,
      index: true
    },
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin'],
      default: 'member',
    },
    joinedAt: { 
      type: Date, 
      default: Date.now 
    },
  },
  {
    timestamps: false,
    collection: 'group_members'
  }
);

// Compound unique index (one membership per user per group)
GroupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });
GroupMemberSchema.index({ role: 1 });

// ============================================
// QUESTION SCHEMA (Q&A)
// ============================================

export interface IQuestion extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  author: {
    userId: mongoose.Types.ObjectId;
    name: string;
    avatar?: string;
    level: string;
  };
  groupId?: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  content: {
    text: string;
    media?: Array<{
      type: 'image' | 'video';
      url: string;
    }>;
  };
  tags: string[];
  category: string;
  location?: {
    city: string;
    country: string;
  };
  answers: Array<{
    _id: mongoose.Types.ObjectId;
    author: {
      userId: mongoose.Types.ObjectId;
      name: string;
      avatar?: string;
      isVerified: boolean;
      sellerId?: mongoose.Types.ObjectId;
      level: string;
    };
    content: {
      text: string;
      media?: Array<{
        type: 'image' | 'video';
        url: string;
      }>;
    };
    upvotes: number;
    upvotedBy: mongoose.Types.ObjectId[];
    isPinned: boolean;
    isAcceptedAnswer: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
  upvoteCount: number;
  viewCount: number;
  status: PostStatus;
  flags: Array<{
    userId: mongoose.Types.ObjectId;
    reason: string;
    createdAt: Date;
  }>;
  seoKeywords: string[];
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true },
    author: {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      name: { type: String, required: true },
      avatar: String,
      level: { type: String, default: 'newcomer' },
    },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    content: {
      text: { type: String, required: true },
      media: [{
        type: { type: String, enum: ['image', 'video'] },
        url: String,
      }],
    },
    tags: [String],
    category: String,
    location: {
      city: String,
      country: String,
    },
    answers: [{
      author: {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        avatar: String,
        isVerified: { type: Boolean, default: false },
        sellerId: { type: Schema.Types.ObjectId, ref: 'Seller' },
        level: { type: String, default: 'newcomer' },
      },
      content: {
        text: { type: String, required: true },
        media: [{
          type: { type: String, enum: ['image', 'video'] },
          url: String,
        }],
      },
      upvotes: { type: Number, default: 0 },
      upvotedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      isPinned: { type: Boolean, default: false },
      isAcceptedAnswer: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    }],
    upvoteCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'published', 'hidden', 'under_review', 'deleted'],
      default: 'published',
    },
    flags: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      reason: String,
      createdAt: { type: Date, default: Date.now },
    }],
    seoKeywords: [String],
  },
  {
    timestamps: true,
  }
);

QuestionSchema.index({ slug: 1 }, { unique: true });
QuestionSchema.index({ tags: 1 });
QuestionSchema.index({ category: 1 });
QuestionSchema.index({ 'answers.isAcceptedAnswer': -1, 'answers.upvotes': -1 });

// ============================================
// NOTIFICATION SCHEMA
// ============================================

export type NotificationType = 
  | 'like' 
  | 'comment' 
  | 'follow' 
  | 'mention'
  | 'answer'
  | 'upvote'
  | 'badge_earned'
  | 'level_up'
  | 'deal_alert'
  | 'group_invite'
  | 'ama_reminder'
  | 'order_update'
  | 'review_received'
  | 'question_answered';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data: {
    postId?: mongoose.Types.ObjectId;
    commentId?: mongoose.Types.ObjectId;
    questionId?: mongoose.Types.ObjectId;
    answerId?: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    groupId?: mongoose.Types.ObjectId;
    productId?: mongoose.Types.ObjectId;
    orderId?: mongoose.Types.ObjectId;
    badgeId?: string;
    badgeName?: string;
  };
  actionUrl?: string;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['like', 'comment', 'follow', 'mention', 'answer', 'upvote', 'badge_earned', 'level_up', 'deal_alert', 'group_invite', 'ama_reminder', 'order_update', 'review_received', 'question_answered'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: {
      postId: { type: Schema.Types.ObjectId, ref: 'Post' },
      commentId: { type: Schema.Types.ObjectId, ref: 'Comment' },
      questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
      answerId: mongoose.Types.ObjectId,
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
      productId: { type: Schema.Types.ObjectId, ref: 'Product' },
      orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
      badgeId: String,
      badgeName: String,
    },
    actionUrl: String,
    read: { type: Boolean, default: false },
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

// CRITICAL: Notification inbox - Compound index covering unread count and sorted inbox
// Pattern: { userId: 1, "channels.inApp.read": 1, createdAt: -1 }
NotificationSchema.index(
  { userId: 1, 'channels.inApp.read': 1, createdAt: -1 },
  { name: 'notification_inbox_idx' }
);

// ============================================
// AMA EVENT SCHEMA
// ============================================

export interface IAMAEvent extends Document {
  _id: mongoose.Types.ObjectId;
  seller: {
    sellerId: mongoose.Types.ObjectId;
    name: string;
    avatar?: string;
    storeName: string;
  };
  title: string;
  description: string;
  scheduledAt: Date;
  endsAt: Date;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  questions: Array<{
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    userName: string;
    userAvatar?: string;
    question: string;
    upvotes: number;
    upvotedBy: mongoose.Types.ObjectId[];
    isAnswered: boolean;
    answer?: string;
    answeredAt?: Date;
    createdAt: Date;
  }>;
  participantCount: number;
  maxParticipants?: number;
  isPromoted: boolean;
  promotedUntil?: Date;
  createdAt: Date;
}

const AMAEventSchema = new Schema<IAMAEvent>(
  {
    seller: {
      sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
      name: { type: String, required: true },
      avatar: String,
      storeName: { type: String, required: true },
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    scheduledAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended', 'cancelled'],
      default: 'scheduled',
    },
    questions: [{
      _id: { type: Schema.Types.ObjectId, auto: true },
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      userName: { type: String, required: true },
      userAvatar: String,
      question: { type: String, required: true },
      upvotes: { type: Number, default: 0 },
      upvotedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      isAnswered: { type: Boolean, default: false },
      answer: String,
      answeredAt: Date,
      createdAt: { type: Date, default: Date.now },
    }],
    participantCount: { type: Number, default: 0 },
    maxParticipants: Number,
    isPromoted: { type: Boolean, default: false },
    promotedUntil: Date,
  },
  {
    timestamps: true,
  }
);

AMAEventSchema.index({ status: 1, scheduledAt: 1 });
AMAEventSchema.index({ 'seller.sellerId': 1 });

// ============================================
// EXPORTS
// ============================================

export const Post = mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);
export const Comment = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);
export const Group = mongoose.models.Group || mongoose.model<IGroup>('Group', GroupSchema);
export const GroupMember = mongoose.models.GroupMember || mongoose.model<IGroupMember>('GroupMember', GroupMemberSchema);
export const Question = mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);
export const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
export const AMAEvent = mongoose.models.AMAEvent || mongoose.model<IAMAEvent>('AMAEvent', AMAEventSchema);
