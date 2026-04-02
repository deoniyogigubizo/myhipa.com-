import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Promotion Collection Schema
 * 
 * Manages promotional campaigns and discounts for the platform.
 * 
 * @field title - Promotion title
 * @field description - Promotion description
 * @field type - Type of promotion (percentage, fixed, buy_x_get_y, free_shipping)
 * @field value - Discount value (percentage or fixed amount)
 * @field code - Promo code (optional)
 * @field startDate - Promotion start date
 * @field endDate - Promotion end date
 * @field status - Promotion status (draft, active, paused, expired)
 * @field applicableTo - What the promotion applies to (all, categories, products, sellers)
 * @field applicableIds - IDs of applicable items
 * @field minPurchase - Minimum purchase amount
 * @field maxDiscount - Maximum discount amount
 * @field usageLimit - Maximum number of uses
 * @field usageCount - Current usage count
 * @field createdBy - Admin who created the promotion
 */

// ============================================
// INTERFACES
// ============================================

export interface IPromotion extends Document {
  title: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'buy_x_get_y' | 'free_shipping';
  value: number;
  code?: string;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'paused' | 'expired';
  applicableTo: 'all' | 'categories' | 'products' | 'sellers';
  applicableIds?: string[];
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMA
// ============================================

const PromotionSchema = new Schema<IPromotion>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      description: 'Promotion title'
    },
    description: {
      type: String,
      trim: true,
      description: 'Promotion description'
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'buy_x_get_y', 'free_shipping'],
      required: true,
      description: 'Type of promotion'
    },
    value: {
      type: Number,
      required: true,
      min: 0,
      description: 'Discount value (percentage or fixed amount)'
    },
    code: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      description: 'Promo code'
    },
    startDate: {
      type: Date,
      required: true,
      description: 'Promotion start date'
    },
    endDate: {
      type: Date,
      required: true,
      description: 'Promotion end date'
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'expired'],
      default: 'draft',
      description: 'Promotion status'
    },
    applicableTo: {
      type: String,
      enum: ['all', 'categories', 'products', 'sellers'],
      default: 'all',
      description: 'What the promotion applies to'
    },
    applicableIds: [{
      type: String,
      description: 'IDs of applicable items'
    }],
    minPurchase: {
      type: Number,
      min: 0,
      description: 'Minimum purchase amount'
    },
    maxDiscount: {
      type: Number,
      min: 0,
      description: 'Maximum discount amount'
    },
    usageLimit: {
      type: Number,
      min: 0,
      description: 'Maximum number of uses'
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Current usage count'
    },
    createdBy: {
      type: String,
      required: true,
      description: 'Admin who created the promotion'
    }
  },
  {
    timestamps: true,
    collection: 'promotions'
  }
);

// ============================================
// INDEXES
// ============================================

PromotionSchema.index({ status: 1 });
PromotionSchema.index({ code: 1 }, { sparse: true });
PromotionSchema.index({ startDate: 1, endDate: 1 });
PromotionSchema.index({ applicableTo: 1, applicableIds: 1 });

// ============================================
// MODEL EXPORT
// ============================================

export const Promotion: Model<IPromotion> = mongoose.models.Promotion || mongoose.model<IPromotion>('Promotion', PromotionSchema);
