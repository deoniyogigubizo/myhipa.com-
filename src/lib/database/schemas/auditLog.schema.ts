import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * AuditLog Collection Schema
 * 
 * Records every sensitive action permanently.
 * Used for disputes, admin reviews, and compliance.
 * 
 * @field actor - User who performed the action
 * @field action - Action name (snake_case)
 * @field entity - Entity being acted upon
 * @field changes - Before and after state
 * @field metadata - Additional metadata
 * TTL index: auto-delete after 2 years (configurable)
 */

// ============================================
// SUB-SCHEMAS
// ============================================

/**
 * Actor Sub-document
 * Who performed the action
 */
const ActorSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    description: 'User who performed the action'
  },
  role: {
    type: String,
    required: true,
    description: 'Role of the actor (admin, seller, user, system)'
  },
  ip: {
    type: String,
    required: true,
    description: 'IP address of the actor'
  },
  userAgent: {
    type: String,
    description: 'User agent string'
  }
}, { _id: false });

/**
 * Entity Sub-document
 * What entity was affected
 */
const EntitySchema = new Schema({
  type: {
    type: String,
    required: true,
    description: 'Type of entity (order, product, user, etc.)'
  },
  id: {
    type: Schema.Types.ObjectId,
    required: true,
    description: 'ID of the entity'
  }
}, { _id: false });

/**
 * Changes Sub-document
 * Before and after state
 */
const ChangesSchema = new Schema({
  before: {
    type: Schema.Types.Mixed,
    description: 'State before the change'
  },
  after: {
    type: Schema.Types.Mixed,
    description: 'State after the change'
  }
}, { _id: false });

/**
 * Metadata Sub-document
 * Additional information
 */
const MetadataSchema = new Schema({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type: { type: Schema.Types.Mixed }
}, { _id: false });

// ============================================
// MAIN AUDIT LOG SCHEMA
// ============================================

/**
 * IAuditLog Interface
 * TypeScript interface for AuditLog Document
 */
export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  actor: {
    userId?: mongoose.Types.ObjectId;
    role: string;
    ip: string;
    userAgent?: string;
  };
  action: string;
  entity: {
    type: string;
    id: mongoose.Types.ObjectId;
  };
  changes?: {
    before?: any;
    after?: any;
  };
  metadata?: any;
  createdAt: Date;
}

/**
 * AuditLog Schema Definition
 */
export const AuditLogSchema = new Schema<IAuditLog>(
  {
    // ========================================
    // ACTOR
    // ========================================
    
    actor: {
      type: ActorSchema,
      required: [true, 'Actor information is required'],
      description: 'User who performed the action'
    },

    // ========================================
    // ACTION
    // ========================================
    
    action: {
      type: String,
      required: [true, 'Action is required'],
      index: true,
      description: 'Snake_case action name'
    },

    // ========================================
    // ENTITY
    // ========================================
    
    entity: {
      type: EntitySchema,
      required: [true, 'Entity is required'],
      description: 'Entity being acted upon'
    },

    // ========================================
    // CHANGES
    // ========================================
    
    changes: {
      type: ChangesSchema,
      description: 'Before and after state'
    },

    // ========================================
    // METADATA
    // ========================================
    
    metadata: {
      type: MetadataSchema,
      description: 'Additional metadata'
    }
  },
  {
    // ========================================
    // SCHEMA OPTIONS
    // ========================================
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'audit_logs',
    toJSON: {
      virtuals: false,
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// ============================================
// INDEXES
// ============================================

// Action index for querying by action type
AuditLogSchema.index({ action: 1 }, { name: 'action_idx' });

// Entity type index
AuditLogSchema.index({ 'entity.type': 1 }, { name: 'entity_type_idx' });

// Entity ID index
AuditLogSchema.index({ 'entity.id': 1 }, { name: 'entity_id_idx' });

// Actor user ID index
AuditLogSchema.index({ 'actor.userId': 1 }, { name: 'actor_user_id_idx' });

// Actor role index
AuditLogSchema.index({ 'actor.role': 1 }, { name: 'actor_role_idx' });

// Created at index (for time-based queries)
AuditLogSchema.index({ createdAt: -1 }, { name: 'created_at_idx' });

// Compound indexes for common queries
AuditLogSchema.index(
  { 'entity.type': 1, 'entity.id': 1, createdAt: -1 },
  { name: 'entity_history_idx' }
);

AuditLogSchema.index(
  { 'actor.userId': 1, createdAt: -1 },
  { name: 'user_activity_idx' }
);

// TTL index - auto-delete after 2 years (17520 minutes = 365 * 24 * 2)
// Set to 0 or remove if you want to keep logs forever
AuditLogSchema.index(
  { createdAt: 1 },
  { 
    name: 'ttl_idx',
    expireAfterSeconds: 63072000 // 2 years in seconds
  }
);

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find logs by entity
 */
AuditLogSchema.statics.findByEntity = function(entityType: string, entityId: string) {
  return this.find({
    'entity.type': entityType,
    'entity.id': new mongoose.Types.ObjectId(entityId)
  }).sort({ createdAt: -1 });
};

/**
 * Find logs by action
 */
AuditLogSchema.statics.findByAction = function(action: string, limit: number = 100) {
  return this.find({ action })
    .sort({ createdAt: -1 })
    .limit(limit);
};

/**
 * Find logs by user
 */
AuditLogSchema.statics.findByUser = function(userId: string, limit: number = 100) {
  return this.find({ 'actor.userId': new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(limit);
};

/**
 * Find logs by IP
 */
AuditLogSchema.statics.findByIP = function(ip: string, limit: number = 100) {
  return this.find({ 'actor.ip': ip })
    .sort({ createdAt: -1 })
    .limit(limit);
};

/**
 * Get recent admin actions
 */
AuditLogSchema.statics.getAdminActions = function(days: number = 7, limit: number = 100) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.find({
    'actor.role': 'admin',
    createdAt: { $gte: cutoffDate }
  })
    .sort({ createdAt: -1 })
    .limit(limit);
};

/**
 * Log an action (static method for creating logs)
 */
AuditLogSchema.statics.log = function(data: {
  actor: {
    userId?: mongoose.Types.ObjectId;
    role: string;
    ip: string;
    userAgent?: string;
  };
  action: string;
  entity: {
    type: string;
    id: mongoose.Types.ObjectId;
  };
  changes?: {
    before?: any;
    after?: any;
  };
  metadata?: any;
}) {
  return this.create(data);
};

/**
 * Get action statistics
 */
AuditLogSchema.statics.getActionStats = function(startDate?: Date, endDate?: Date) {
  const match: any = {};
  
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = startDate;
    if (endDate) match.createdAt.$lte = endDate;
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$actor.userId' },
        uniqueEntities: { $addToSet: '$entity.id' }
      }
    },
    {
      $project: {
        action: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        uniqueEntities: { $size: '$uniqueEntities' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

/**
 * Get user activity summary
 */
AuditLogSchema.statics.getUserActivity = function(userId: string, days: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        'actor.userId': new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: cutoffDate }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        lastPerformed: { $max: '$createdAt' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

/**
 * Search logs with filters
 */
AuditLogSchema.statics.search = function(filters: {
  action?: string;
  entityType?: string;
  userId?: string;
  role?: string;
  ip?: string;
  startDate?: Date;
  endDate?: Date;
}, limit: number = 100, skip: number = 0) {
  const query: any = {};
  
  if (filters.action) query.action = filters.action;
  if (filters.entityType) query['entity.type'] = filters.entityType;
  if (filters.userId) query['actor.userId'] = new mongoose.Types.ObjectId(filters.userId);
  if (filters.role) query['actor.role'] = filters.role;
  if (filters.ip) query['actor.ip'] = filters.ip;
  
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = filters.startDate;
    if (filters.endDate) query.createdAt.$lte = filters.endDate;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Check if this is a system action
 */
AuditLogSchema.methods.isSystemAction = function(): boolean {
  return this.actor.role === 'system' || this.actor.role === 'cron_job';
};

/**
 * Check if this is an admin action
 */
AuditLogSchema.methods.isAdminAction = function(): boolean {
  return this.actor.role === 'admin';
};

/**
 * Get time since action
 */
AuditLogSchema.methods.getTimeSince = function(): string {
  const now = new Date();
  const diff = now.getTime() - this.createdAt.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

// ============================================
// EXPORT MODEL
// ============================================

export const AuditLog: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
