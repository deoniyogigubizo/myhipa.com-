import mongoose from 'mongoose';

// ============================================
// COMMUNITY TYPES
// ============================================

// Post Types
export type PostType = 
  | 'product_share'
  | 'review_post'
  | 'question'
  | 'deal_alert'
  | 'community_update'
  | 'ama_question';

export type PostStatus = 'draft' | 'published' | 'hidden' | 'under_review' | 'deleted';

export interface PostAuthor {
  userId: string;
  name: string;
  avatar?: string;
  isVerified: boolean;
  reputationScore: number;
  level: string;
}

export interface PostMedia {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

export interface ProductSnapshot {
  title: string;
  price: number;
  image: string;
  slug: string;
}

export interface PostContent {
  text: string;
  media?: PostMedia[];
  productId?: string;
  productSnapshot?: ProductSnapshot;
}

export interface PostLocation {
  city: string;
  country: string;
}

export interface PostEngagement {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views: number;
}

export interface PostFlag {
  userId: string;
  reason: string;
  createdAt: Date;
}

export interface IPost {
  _id: string;
  author: PostAuthor;
  type: PostType;
  content: PostContent;
  groupId?: string;
  visibility: 'public' | 'followers' | 'group' | 'premium';
  engagement: PostEngagement;
  tags: string[];
  location?: PostLocation;
  status: PostStatus;
  flags: PostFlag[];
  boosted: boolean;
  boostedUntil?: Date;
  aiScore: number;
  createdAt: Date;
  updatedAt: Date;
}

// Comment Types
export interface CommentAuthor {
  userId: string;
  name: string;
  avatar?: string;
  isVerified: boolean;
  level: string;
}

export interface CommentContent {
  text: string;
  media?: PostMedia[];
}

export interface IComment {
  _id: string;
  postId: string;
  parentCommentId?: string;
  author: CommentAuthor;
  content: CommentContent;
  upvotes: number;
  upvotedBy: string[];
  isPinned: boolean;
  isAcceptedAnswer: boolean;
  status: PostStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Group Types
export type GroupType = 'category' | 'location' | 'interest' | 'seller_only';
export type GroupPrivacy = 'public' | 'private' | 'seller_only';

export interface GroupMember {
  userId: string;
  role: 'member' | 'moderator' | 'admin';
  joinedAt: Date;
}

export interface GroupAdmin {
  userId: string;
  name: string;
}

export interface GroupModerator {
  userId: string;
  name: string;
  addedAt: Date;
}

export interface GroupDeal {
  sellerId: string;
  productId: string;
  discount: number;
  expiresAt: Date;
}

export interface GroupStats {
  postsThisWeek: number;
  postsThisMonth: number;
}

export interface IGroup {
  _id: string;
  name: string;
  slug: string;
  description: string;
  type: GroupType;
  privacy: GroupPrivacy;
  category?: string;
  location?: PostLocation;
  coverImage?: string;
  icon?: string;
  admin: GroupAdmin;
  moderators: GroupModerator[];
  members: GroupMember[];
  memberCount: number;
  rules?: string[];
  pinnedPosts: string[];
  weeklyDigestEnabled: boolean;
  groupDeals: GroupDeal[];
  stats: GroupStats;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Question Types
export interface QuestionAuthor {
  userId: string;
  name: string;
  avatar?: string;
  level: string;
}

export interface AnswerAuthor {
  userId: string;
  name: string;
  avatar?: string;
  isVerified: boolean;
  sellerId?: string;
  level: string;
}

export interface Answer {
  _id: string;
  author: AnswerAuthor;
  content: CommentContent;
  upvotes: number;
  upvotedBy: string[];
  isPinned: boolean;
  isAcceptedAnswer: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuestion {
  _id: string;
  title: string;
  slug: string;
  author: QuestionAuthor;
  groupId?: string;
  productId?: string;
  content: CommentContent;
  tags: string[];
  category?: string;
  location?: PostLocation;
  answers: Answer[];
  upvoteCount: number;
  viewCount: number;
  status: PostStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Notification Types
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

export interface NotificationData {
  postId?: string;
  commentId?: string;
  questionId?: string;
  answerId?: string;
  userId?: string;
  groupId?: string;
  productId?: string;
  orderId?: string;
  badgeId?: string;
  badgeName?: string;
}

export interface INotification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: NotificationData;
  actionUrl?: string;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
}

// User Level Types
export type UserLevel = 
  | 'newcomer'
  | 'active_member'
  | 'trusted_contributor'
  | 'community_leader'
  | 'hipa_pro';

// Reputation Types
export interface Badge {
  badgeId: string;
  earnedAt: Date;
  earnedFrom: 'auto' | 'manual';
}

export interface Streak {
  current: number;
  longest: number;
  lastActivityAt: Date;
}

export interface ReputationStats {
  totalPosts: number;
  totalComments: number;
  totalQuestions: number;
  totalAnswers: number;
  totalReviews: number;
  totalLikesReceived: number;
  totalUpvotesReceived: number;
  productsPurchased: number;
  productsSold: number;
  followersCount: number;
  followingCount: number;
  referralCount: number;
}

export interface PointsHistoryEntry {
  points: number;
  action: string;
  description: string;
  createdAt: Date;
}

export interface Achievement {
  achievementId: string;
  unlockedAt: Date;
  progress: number;
  target: number;
}

export interface IUserReputation {
  _id: string;
  userId: string;
  points: number;
  level: UserLevel;
  streak: Streak;
  badges: Badge[];
  stats: ReputationStats;
  pointsHistory: PointsHistoryEntry[];
  achievements: Achievement[];
  weeklyRank: number;
  monthlyRank: number;
  allTimeRank: number;
  lastCalculatedAt: Date;
}

// ============================================
// MOCK DATA FOR DEVELOPMENT
// ============================================

export const mockPosts: IPost[] = [
  {
    _id: '1',
    author: {
      userId: 'user1',
      name: 'Marie Uwase',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      isVerified: true,
      reputationScore: 1250,
      level: 'hipa_pro',
    },
    type: 'product_share',
    content: {
      text: 'Just listed these handmade Rwandan baskets! Each piece takes about 3 days to weave. DM for custom orders 🧺',
      media: [
        { type: 'image', url: 'https://images.unsplash.com/photo-1595408076683-5d0c228cc359?w=600' }
      ],
      productSnapshot: {
        title: 'Handwoven Rwandan Baskets Set',
        price: 45000,
        image: 'https://images.unsplash.com/photo-1595408076683-5d0c228cc359?w=300',
        slug: 'handwoven-rwandan-baskets',
      },
    },
    visibility: 'public',
    engagement: { likes: 234, comments: 45, shares: 12, saves: 67, views: 1520 },
    tags: ['rwandan', 'handmade', 'baskets', 'artisan'],
    status: 'published',
    flags: [],
    boosted: true,
    aiScore: 0.92,
    createdAt: new Date('2026-03-18T10:30:00'),
    updatedAt: new Date('2026-03-18T10:30:00'),
  },
  {
    _id: '2',
    author: {
      userId: 'user2',
      name: 'Jean-Paul Nkusi',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      isVerified: true,
      reputationScore: 890,
      level: 'community_leader',
    },
    type: 'deal_alert',
    content: {
      text: '⚡ FLASH SALE! 50% off all smartphones for the next 2 hours only! Use code: FLASH50',
      media: [
        { type: 'image', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600' }
      ],
    },
    visibility: 'public',
    engagement: { likes: 567, comments: 89, shares: 234, saves: 123, views: 4520 },
    tags: ['flash-sale', 'smartphones', 'deal', 'electronics'],
    status: 'published',
    flags: [],
    boosted: true,
    boostedUntil: new Date('2026-03-18T14:00:00'),
    aiScore: 0.98,
    createdAt: new Date('2026-03-18T12:00:00'),
    updatedAt: new Date('2026-03-18T12:00:00'),
  },
  {
    _id: '3',
    author: {
      userId: 'user3',
      name: 'Fatou Diallo',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
      isVerified: false,
      reputationScore: 156,
      level: 'active_member',
    },
    type: 'question',
    content: {
      text: 'Does anyone know a reliable supplier for quality fabrics in Kigali? Looking for African wax prints specifically. Thanks in advance! 🙏',
    },
    groupId: 'group1',
    visibility: 'public',
    engagement: { likes: 23, comments: 15, shares: 2, saves: 8, views: 234 },
    tags: ['supplier', 'fabrics', 'kigali', 'help'],
    location: { city: 'Kigali', country: 'Rwanda' },
    status: 'published',
    flags: [],
    boosted: false,
    aiScore: 0.65,
    createdAt: new Date('2026-03-17T16:45:00'),
    updatedAt: new Date('2026-03-17T16:45:00'),
  },
  {
    _id: '4',
    author: {
      userId: 'user4',
      name: 'Emmanuel Osei',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      isVerified: true,
      reputationScore: 2100,
      level: 'hipa_pro',
    },
    type: 'community_update',
    content: {
      text: 'Excited to announce that our tech startup has officially launched! After 2 years of hard work, HipaTech is now live. Thank you to everyone who believed in us! 🎉\n\nCheck us out at hipatech.rw',
      media: [
        { type: 'image', url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600' }
      ],
    },
    visibility: 'public',
    engagement: { likes: 892, comments: 156, shares: 89, saves: 234, views: 6780 },
    tags: ['startup', 'launch', 'techt', 'celebration'],
    status: 'published',
    flags: [],
    boosted: false,
    aiScore: 0.88,
    createdAt: new Date('2026-03-16T09:00:00'),
    updatedAt: new Date('2026-03-16T09:00:00'),
  },
];

export const mockGroups: IGroup[] = [
  {
    _id: 'group1',
    name: 'Electronics Rwanda',
    slug: 'electronics-rwanda',
    description: 'Buy, sell, and discuss electronics in Rwanda. Laptops, phones, accessories, and more!',
    type: 'category',
    privacy: 'public',
    category: 'Electronics',
    location: { city: 'Kigali', country: 'Rwanda' },
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
    icon: '💻',
    admin: { userId: 'admin1', name: 'TechHub Rwanda' },
    moderators: [],
    members: [],
    memberCount: 4523,
    rules: ['No spam', 'Be respectful', 'Verified sellers only for new listings'],
    pinnedPosts: [],
    weeklyDigestEnabled: true,
    groupDeals: [],
    stats: { postsThisWeek: 89, postsThisMonth: 345 },
    isActive: true,
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2026-03-18'),
  },
  {
    _id: 'group2',
    name: 'Kigali Fashion District',
    slug: 'kigali-fashion',
    description: 'The go-to community for fashion enthusiasts in Kigali. Share styles, discover local designers, and shop unique pieces.',
    type: 'location',
    privacy: 'public',
    category: 'Fashion',
    location: { city: 'Kigali', country: 'Rwanda' },
    coverImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    icon: '👗',
    admin: { userId: 'admin2', name: 'Fashion Kigali' },
    moderators: [],
    members: [],
    memberCount: 3891,
    rules: ['Original content only', 'Credit designers', 'No counterfeit items'],
    pinnedPosts: [],
    weeklyDigestEnabled: true,
    groupDeals: [],
    stats: { postsThisWeek: 67, postsThisMonth: 278 },
    isActive: true,
    createdAt: new Date('2025-02-20'),
    updatedAt: new Date('2026-03-18'),
  },
  {
    _id: 'group3',
    name: 'African Artisans Collective',
    slug: 'african-artisans',
    description: 'Connecting artisans across Africa. Share your crafts, find suppliers, and grow your business.',
    type: 'interest',
    privacy: 'public',
    coverImage: 'https://images.unsplash.com/photo-1459909633680-206dc5c67abb?w=800',
    icon: '🎨',
    admin: { userId: 'admin3', name: 'Artisan Africa' },
    moderators: [],
    members: [],
    memberCount: 2156,
    rules: ['Authentic African crafts only', 'Support fair trade', 'Share knowledge'],
    pinnedPosts: [],
    weeklyDigestEnabled: true,
    groupDeals: [],
    stats: { postsThisWeek: 45, postsThisMonth: 189 },
    isActive: true,
    createdAt: new Date('2025-03-10'),
    updatedAt: new Date('2026-03-18'),
  },
];

export const mockQuestions: IQuestion[] = [
  {
    _id: 'q1',
    title: 'Best places to buy wholesale fabrics in Kigali?',
    slug: 'best-wholesale-fabrics-kigali',
    author: {
      userId: 'user5',
      name: 'Amara Mbeki',
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100',
      level: 'active_member',
    },
    content: {
      text: 'I\'m starting a clothing line and need reliable wholesale fabric suppliers in Kigali. Any recommendations for quality African wax prints at competitive prices?',
    },
    tags: ['fabrics', 'wholesale', 'kigali', 'business'],
    category: 'Business',
    location: { city: 'Kigali', country: 'Rwanda' },
    answers: [
      {
        _id: 'a1',
        author: {
          userId: 'seller1',
          name: 'Kigali Textiles Ltd',
          avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100',
          isVerified: true,
          sellerId: 'seller123',
          level: 'hipa_pro',
        },
        content: {
          text: 'We supply premium African wax prints at wholesale prices! Visit our store at Kimironko Market, Stall 45. We also deliver countrywide. Contact: +250 788 XXX XXX',
        },
        upvotes: 24,
        upvotedBy: [],
        isPinned: true,
        isAcceptedAnswer: true,
        createdAt: new Date('2026-03-17T10:00:00'),
        updatedAt: new Date('2026-03-17T10:00:00'),
      },
    ],
    upvoteCount: 18,
    viewCount: 342,
    status: 'published',
    createdAt: new Date('2026-03-16T14:30:00'),
    updatedAt: new Date('2026-03-17T10:00:00'),
  },
  {
    _id: 'q2',
    title: 'How to start selling on MyHipa.com as a beginner?',
    slug: 'how-to-start-selling-myhipa',
    author: {
      userId: 'user6',
      name: 'Junior Musoni',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      level: 'newcomer',
    },
    content: {
      text: 'Hi everyone! I want to start selling my handmade jewelry on Hipa.com but I\'m not sure how to set up my store. Can someone guide me through the process? What are the requirements?',
    },
    tags: ['selling', 'beginner', 'guide', 'help'],
    category: 'Getting Started',
    answers: [],
    upvoteCount: 12,
    viewCount: 189,
    status: 'published',
    createdAt: new Date('2026-03-15T11:00:00'),
    updatedAt: new Date('2026-03-15T11:00:00'),
  },
];

export const mockNotifications: INotification[] = [
  {
    _id: 'n1',
    userId: 'currentUser',
    type: 'like',
    title: 'Someone liked your post',
    message: 'Marie Uwase liked your post about Rwandan baskets',
    data: { postId: '1', userId: 'user1' },
    actionUrl: '/community/post/1',
    read: false,
    createdAt: new Date('2026-03-18T11:00:00'),
  },
  {
    _id: 'n2',
    userId: 'currentUser',
    type: 'comment',
    title: 'New comment on your question',
    message: 'Kigali Textiles Ltd answered your question about wholesale fabrics',
    data: { questionId: 'q1', answerId: 'a1' },
    actionUrl: '/community/questions/q1',
    read: false,
    createdAt: new Date('2026-03-17T10:00:00'),
  },
  {
    _id: 'n3',
    userId: 'currentUser',
    type: 'badge_earned',
    title: '🎉 New badge earned!',
    message: 'Congratulations! You\'ve earned the "Active Contributor" badge',
    data: { badgeId: 'active_contributor', badgeName: 'Active Contributor' },
    actionUrl: '/profile/badges',
    read: true,
    readAt: new Date('2026-03-16T15:00:00'),
    createdAt: new Date('2026-03-16T14:30:00'),
  },
];

// ============================================
// COMMUNITY HELPER FUNCTIONS
// ============================================

export function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

export function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export function getLevelColor(level: string): string {
  switch (level) {
    case 'newcomer': return 'text-gray-500';
    case 'active_member': return 'text-blue-500';
    case 'trusted_contributor': return 'text-green-500';
    case 'community_leader': return 'text-purple-500';
    case 'hipa_pro': return 'text-yellow-500';
    default: return 'text-gray-500';
  }
}

export function getLevelBadge(level: string): string {
  switch (level) {
    case 'newcomer': return '🆕';
    case 'active_member': return '⭐';
    case 'trusted_contributor': return '🌟';
    case 'community_leader': return '👑';
    case 'hipa_pro': return '💎';
    default: return '🆕';
  }
}

export const postTypeLabels: Record<PostType, string> = {
  product_share: 'Product Share',
  review_post: 'Review',
  question: 'Question',
  deal_alert: 'Deal Alert',
  community_update: 'Update',
  ama_question: 'AMA',
};

export const groupTypeLabels: Record<GroupType, string> = {
  category: 'Category',
  location: 'Location',
  interest: 'Interest',
  seller_only: 'Sellers Only',
};

export const notificationTypeLabels: Record<NotificationType, string> = {
  like: 'Liked your post',
  comment: 'Commented on your post',
  follow: 'Started following you',
  mention: 'Mentioned you',
  answer: 'Answered your question',
  upvote: 'Upvoted your content',
  badge_earned: 'Badge earned!',
  level_up: 'Level up!',
  deal_alert: 'Deal alert',
  group_invite: 'Group invitation',
  ama_reminder: 'AMA reminder',
  order_update: 'Order update',
  review_received: 'New review',
  question_answered: 'Question answered',
};
