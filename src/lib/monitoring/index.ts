// Mock Sentry implementation (install @sentry/nextjs for production)
const Sentry = {
  init: (options?: any) => {},
  captureException: (error: any, options?: any) => {},
  captureMessage: (message: string, options?: any) => {},
  setUser: (user: any) => {},
  addBreadcrumb: (breadcrumb: any) => {},
  httpIntegration: () => ({}),
  linkedErrorsIntegration: () => ({}),
  requestDataIntegration: () => ({}),
  SeverityLevel: {} as any,
};

type SeverityLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

import { ConfigService } from '@nestjs/config';

// ============================================
// Monitoring & Observability Services
// ============================================

/**
 * Sentry Error Tracking
 */
export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  
  if (dsn) {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      integrations: [
        Sentry.httpIntegration(),
        Sentry.linkedErrorsIntegration(),
        Sentry.requestDataIntegration(),
      ],
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      ignoreErrors: [
        'NetworkError',
        'ChunkLoadError',
        'ResizeObserver loop limit exceeded',
      ],
    });
  }
}

/**
 * Capture exception to Sentry
 */
export function captureError(error: Error, context?: Record<string, unknown>): void {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture message to Sentry
 */
export function captureMessage(
  message: string,
  level: SeverityLevel = 'info',
  context?: Record<string, unknown>
): void {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Set user context
 */
export function setUser(user: { id: string; email?: string; ip?: string } | null): void {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      ip_address: user.ip,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: SeverityLevel = 'info'
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
  });
}

// ============================================
// Metrics Interface (Datadog compatible)
// ============================================

export interface MetricPoint {
  value: number;
  timestamp: number;
}

export interface MetricsService {
  // Counters
  increment(metric: string, value?: number, tags?: Record<string, string>): void;
  
  // Gauges
  gauge(metric: string, value: number, tags?: Record<string, string>): void;
  
  // Histograms
  histogram(metric: string, value: number, tags?: Record<string, string>): void;
  
  // Timing
  timing(metric: string, valueMs: number, tags?: Record<string, string>): void;
}

/**
 * Datadog Metrics Service
 */
export class DatadogMetricsService implements MetricsService {
  private readonly prefix = 'myhipa.';

  constructor(private readonly configService: ConfigService) {}

  private formatMetricName(metric: string): string {
    return `${this.prefix}${metric}`;
  }

  private formatTags(tags?: Record<string, string>): string[] {
    if (!tags) return [];
    return Object.entries(tags).map(([key, value]) => `${key}:${value}`);
  }

  increment(metric: string, value = 1, tags?: Record<string, string>): void {
    // In production, would send to Datadog Agent
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[METRIC] increment ${this.formatMetricName(metric)}: ${value}`, tags);
    }
    // Datadog API call would go here
  }

  gauge(metric: string, value: number, tags?: Record<string, string>): void {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[METRIC] gauge ${this.formatMetricName(metric)}: ${value}`, tags);
    }
  }

  histogram(metric: string, value: number, tags?: Record<string, string>): void {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[METRIC] histogram ${this.formatMetricName(metric)}: ${value}`, tags);
    }
  }

  timing(metric: string, valueMs: number, tags?: Record<string, string>): void {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[METRIC] timing ${this.formatMetricName(metric)}: ${valueMs}ms`, tags);
    }
  }
}

// ============================================
// Custom Metrics for Hipa
// ============================================

export const hipaMetrics = {
  // API Metrics
  apiRequest: (method: string, route: string, statusCode: number) => ({
    increment: (value = 1) => {
      // api.requests.count
    },
    timing: (ms: number) => {
      // api.requests.latency
    },
  }),

  // Business Metrics
  orders: {
    created: () => { /* orders.created */ },
    completed: () => { /* orders.completed */ },
    cancelled: () => { /* orders.cancelled */ },
  },

  payments: {
    success: () => { /* payments.success */ },
    failed: () => { /* payments.failed */ },
  },

  users: {
    signup: () => { /* users.signup */ },
    login: () => { /* users.login */ },
  },

  search: {
    query: (results: number) => { /* search.query */ },
    noResults: () => { /* search.no_results */ },
  },

  ads: {
    impression: () => { /* ads.impression */ },
    click: () => { /* ads.click */ },
    conversion: () => { /* ads.conversion */ },
  },
};

// ============================================
// CloudWatch Integration
// ============================================

export interface CloudWatchMetric {
  MetricName: string;
  Value: number;
  Unit: 'Count' | 'Milliseconds' | 'Bytes';
  Timestamp: Date;
  Dimensions?: Array<{ Name: string; Value: string }>;
}

export async function sendToCloudWatch(metrics: CloudWatchMetric[]): Promise<void> {
  // In production, use AWS SDK CloudWatch client
  console.log('[CLOUDWATCH] Sending metrics:', metrics.length);
}

// ============================================
// Health Check
// ============================================

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, {
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    latencyMs?: number;
  }>;
}

export async function performHealthCheck(): Promise<HealthCheckResult> {
  const checks: HealthCheckResult['checks'] = {};
  let overallStatus: HealthCheckResult['status'] = 'healthy';

  // Check database
  try {
    const start = Date.now();
    // await mongoose.connection.db.admin().ping();
    checks.database = { status: 'pass', latencyMs: Date.now() - start };
  } catch {
    checks.database = { status: 'fail', message: 'Database connection failed' };
    overallStatus = 'unhealthy';
  }

  // Check Redis
  try {
    const start = Date.now();
    // await redis.ping();
    checks.redis = { status: 'pass', latencyMs: Date.now() - start };
  } catch {
    checks.redis = { status: 'fail', message: 'Redis connection failed' };
    overallStatus = 'degraded';
  }

  // Check Elasticsearch
  try {
    const start = Date.now();
    // await es.ping();
    checks.elasticsearch = { status: 'pass', latencyMs: Date.now() - start };
  } catch {
    checks.elasticsearch = { status: 'warn', message: 'Elasticsearch not available' };
    if (overallStatus === 'healthy') overallStatus = 'degraded';
  }

  return { status: overallStatus, checks };
}
