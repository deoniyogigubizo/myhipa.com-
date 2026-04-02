import Bull from 'bull';
import { ConfigService } from '@nestjs/config';

// ============================================
// BullMQ Queue Configuration
// ============================================

export interface QueueConfig {
  name: string;
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  defaultJobOptions: {
    attempts: number;
    backoff: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
    removeOnComplete: boolean | number;
    removeOnFail: boolean | number;
  };
}

// ============================================
// Queue Names
// ============================================
export const QUEUE_NAMES = {
  // Escrow queues
  ESCROW_JOBS: 'escrow-jobs',
  
  // Notification queues
  NOTIFICATIONS: 'notifications',
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  
  // AI queues
  AI_JOBS: 'ai-jobs',
  EMBEDDING_RECOMPUTE: 'embedding-recompute',
  AD_PERFORMANCE: 'ad-performance',
  DEMAND_FORECAST: 'demand-forecast',
  
  // Media processing
  MEDIA_PROCESSING: 'media-processing',
  IMAGE_COMPRESSION: 'image-compression',
  THUMBNAIL_GENERATION: 'thumbnail-generation',
  
  // Payouts
  PAYOUTS: 'payouts',
  BATCH_PAYOUT: 'batch-payout',
} as const;

// ============================================
// Queue Factory
// ============================================
export function createQueue(name: string, configService: ConfigService): Bull.Queue {
  const redisConfig = {
    host: configService.get<string>('redis.host') || 'localhost',
    port: configService.get<number>('redis.port') || 6379,
    password: configService.get<string>('redis.password'),
  };

  return new Bull(name, {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 100,
      removeOnFail: 200,
    },
  });
}

// ============================================
// Queue Instances
// ============================================
export const escrowQueue = {
  name: QUEUE_NAMES.ESCROW_JOBS,
  process: async () => {}, // Placeholder
};

export const notificationsQueue = {
  name: QUEUE_NAMES.NOTIFICATIONS,
  process: async () => {}, // Placeholder
};

export const aiJobsQueue = {
  name: QUEUE_NAMES.AI_JOBS,
  process: async () => {}, // Placeholder
};

export const mediaProcessingQueue = {
  name: QUEUE_NAMES.MEDIA_PROCESSING,
  process: async () => {}, // Placeholder
};

export const payoutsQueue = {
  name: QUEUE_NAMES.PAYOUTS,
  process: async () => {}, // Placeholder
};

// ============================================
// Job Processors
// ============================================

/**
 * Escrow Jobs Processor
 * - Auto-release checks (every hour)
 * - Seller SLA deadline alerts (every 15 min)
 * - Expired order cancellations (every 5 min)
 */
export async function processEscrowJob(job: Bull.Job): Promise<void> {
  const { type, data } = job.data;

  switch (type) {
    case 'check-auto-release':
      // Check orders ready for auto-release
      console.log('Checking auto-release orders...');
      break;
    
    case 'check-sla-deadline':
      // Check seller SLA deadlines
      console.log('Checking SLA deadlines...');
      break;
    
    case 'cancel-expired':
      // Cancel expired orders
      console.log('Cancelling expired orders...');
      break;
    
    default:
      console.log('Unknown escrow job type:', type);
  }
}

/**
 * Notifications Processor
 * - Email via SendGrid
 * - SMS via Twilio
 * - Push via Firebase
 */
export async function processNotificationJob(job: Bull.Job): Promise<void> {
  const { type, data } = job.data;

  switch (type) {
    case 'email':
      // Send email via SendGrid
      console.log('Sending email:', data);
      break;
    
    case 'sms':
      // Send SMS via Twilio
      console.log('Sending SMS:', data);
      break;
    
    case 'push':
      // Send push via Firebase
      console.log('Sending push notification:', data);
      break;
    
    default:
      console.log('Unknown notification type:', type);
  }
}

/**
 * AI Jobs Processor
 * - Nightly embedding recomputation
 * - Daily ad performance aggregation
 * - Weekly demand forecast updates
 */
export async function processAIJob(job: Bull.Job): Promise<void> {
  const { type, data } = job.data;

  switch (type) {
    case 'recompute-product-embeddings':
      console.log('Recomputing product embeddings...');
      break;
    
    case 'recompute-user-embeddings':
      console.log('Recomputing user embeddings...');
      break;
    
    case 'aggregate-ad-performance':
      console.log('Aggregating ad performance...');
      break;
    
    case 'update-demand-forecast':
      console.log('Updating demand forecasts...');
      break;
    
    default:
      console.log('Unknown AI job type:', type);
  }
}

/**
 * Media Processing Processor
 * - Image compression
 * - Thumbnail generation
 * - 360° asset processing
 */
export async function processMediaJob(job: Bull.Job): Promise<void> {
  const { type, data } = job.data;

  switch (type) {
    case 'compress-image':
      console.log('Compressing image:', data);
      break;
    
    case 'generate-thumbnail':
      console.log('Generating thumbnail:', data);
      break;
    
    case 'process-360':
      console.log('Processing 360 asset:', data);
      break;
    
    default:
      console.log('Unknown media job type:', type);
  }
}

/**
 * Payouts Processor
 * - Batch payout runs (twice daily)
 * - Invoice PDF generation
 * - Monthly statement emails
 */
export async function processPayoutJob(job: Bull.Job): Promise<void> {
  const { type, data } = job.data;

  switch (type) {
    case 'batch-payout':
      console.log('Processing batch payout:', data);
      break;
    
    case 'generate-invoice':
      console.log('Generating invoice PDF:', data);
      break;
    
    case 'monthly-statement':
      console.log('Sending monthly statements:', data);
      break;
    
    default:
      console.log('Unknown payout job type:', type);
  }
}

// ============================================
// Queue Health Check
// ============================================
export async function checkQueueHealth(queue: Bull.Queue): Promise<{
  isHealthy: boolean;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}> {
  const [waiting, active, completed, failed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
  ]);

  return {
    isHealthy: failed < 100, // Arbitrary threshold
    waiting,
    active,
    completed,
    failed,
  };
}
