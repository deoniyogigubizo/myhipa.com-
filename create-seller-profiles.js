const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://deoniyogisubizo:maiden410@myhipa.qkj7r5a.mongodb.net/hipa';

// Define schemas inline to avoid import issues
const UserSchema = new mongoose.Schema({
  email: String,
  passwordHash: String,
  phone: String,
  role: String,
  profile: {
    displayName: String,
    avatar: String,
    bio: String,
    location: {
      city: String,
      country: String
    },
    language: String
  },
  reputation: {
    score: Number,
    level: String,
    badges: [String],
    disputesFiled: Number,
    disputesLost: Number
  },
  wallet: {
    balance: Number,
    currency: String,
    pendingRefunds: Number
  },
  auth: {
    emailVerified: Boolean,
    twoFactorEnabled: Boolean,
    lastLogin: Date,
    loginProvider: String
  },
  preferences: {
    notifications: {
      email: Boolean,
      push: Boolean,
      sms: Boolean
    },
    savedSearches: [String],
    wishlist: [mongoose.Schema.Types.ObjectId],
    followedSellers: [mongoose.Schema.Types.ObjectId]
  },
  kycStatus: String,
  deletedAt: Date,
  createdAt: Date,
  updatedAt: Date
}, { timestamps: true });

const SellerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  store: {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    logo: String,
    banner: String,
    bio: String,
    categories: [String],
    location: {
      city: { type: String, required: true },
      country: { type: String, required: true },
      coords: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number]
      }
    },
    customUrl: String
  },
  tier: {
    type: String,
    enum: ['standard', 'silver', 'gold', 'pro'],
    default: 'standard'
  },
  feeRate: {
    type: Number,
    default: 0.03
  },
  kycStatus: {
    type: String,
    enum: ['none', 'pending', 'verified', 'rejected'],
    default: 'none'
  },
  kycDocs: [String],
  verifiedAt: Date,
  stats: {
    totalRevenue: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    cancelledOrders: { type: Number, default: 0 },
    disputeRate: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    avgResponseTimeMin: { type: Number, default: 0 },
    followerCount: { type: Number, default: 0 },
    productCount: { type: Number, default: 0 }
  },
  wallet: {
    available: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    held: { type: Number, default: 0 },
    currency: { type: String, default: 'RWF' },
    totalWithdrawn: { type: Number, default: 0 }
  },
  payoutMethods: [{
    type: { type: String, enum: ['mobile_money', 'bank'] },
    provider: String,
    number: String,
    bankName: String,
    accountNumber: String,
    isPrimary: { type: Boolean, default: false }
  }],
  policies: {
    shipping: { type: String, default: '' },
    returns: { type: String, default: '' },
    autoReply: String
  },
  shippingZones: [{
    zone: String,
    price: Number,
    estimatedDays: Number
  }],
  businessHours: { type: Map, of: String },
  onboardingStep: { type: String, default: 'profile' },
  suspendedAt: Date,
  suspendReason: String,
  createdAt: Date,
  updatedAt: Date
}, { timestamps: true });

// Create models
const User = mongoose.model('User', UserSchema);
const Seller = mongoose.model('Seller', SellerSchema);

async function createSellerProfiles() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users with role 'seller' or 'both'
    const sellers = await User.find({
      role: { $in: ['seller', 'both'] }
    });

    console.log(`Found ${sellers.length} seller users`);

    for (const user of sellers) {
      // Check if seller profile already exists
      const existingSeller = await Seller.findOne({ userId: user._id });
      
      if (existingSeller) {
        console.log(`Seller profile already exists for ${user.email}`);
        continue;
      }

      // Create store name from display name or email
      const storeName = user.profile?.displayName || user.email.split('@')[0];
      const storeSlug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      // Create seller profile
      const seller = new Seller({
        userId: user._id,
        store: {
          name: storeName,
          slug: storeSlug,
          bio: user.profile?.bio || '',
          categories: [],
          location: {
            city: user.profile?.location?.city || 'Kigali',
            country: user.profile?.location?.country || 'Rwanda',
            coords: {
              type: 'Point',
              coordinates: [30.0589, -1.9500] // Default Kigali coordinates
            }
          }
        },
        tier: 'standard',
        feeRate: 0.03,
        kycStatus: user.kycStatus || 'none',
        stats: {
          totalRevenue: 0,
          totalOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          disputeRate: 0,
          avgRating: 0,
          reviewCount: 0,
          avgResponseTimeMin: 0,
          followerCount: 0,
          productCount: 0
        },
        wallet: {
          available: 0,
          pending: 0,
          held: 0,
          currency: 'RWF',
          totalWithdrawn: 0
        },
        payoutMethods: [],
        policies: {
          shipping: '',
          returns: ''
        },
        shippingZones: [],
        businessHours: {},
        onboardingStep: 'profile'
      });

      await seller.save();
      console.log(`Created seller profile for ${user.email} with store name: ${storeName}`);
    }

    console.log('Seller profile creation completed');
    process.exit(0);
  } catch (error) {
    console.error('Error creating seller profiles:', error);
    process.exit(1);
  }
}

createSellerProfiles();
