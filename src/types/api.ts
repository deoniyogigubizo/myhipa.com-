export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

export interface ApiRequest {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  body?: any;
}

// Payment types
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  clientSecret?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'mobile_money' | 'bank_transfer';
  details: Record<string, any>;
}

// Webhook types
export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
}

// Upload types
export interface UploadedFile {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface UploadUrl {
  uploadUrl: string;
  fileId: string;
}
