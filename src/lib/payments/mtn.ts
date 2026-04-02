import * as crypto from 'crypto'

// ============================================
// MTN MoMo Payment Integration for Deposits
// ============================================

export interface MTNPaymentRequest {
  amount: number;
  currency: string;
  phone: string;
  orderId: string;
}

export interface MTNPaymentResponse {
  paymentLink?: string;
  txRef: string;
  status: string;
}

export class MTNMoMoService {
  private baseUrl: string;
  private subscriptionKey: string;
  private apiUser: string;
  private apiKey: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.subscriptionKey = process.env.MTN_SUBSCRIPTION_KEY!;
    this.apiUser = process.env.MTN_API_USER!;
    this.apiKey = process.env.MTN_API_KEY!;

    // Check for explicit environment override or use NODE_ENV
    const isProduction = process.env.MTN_ENVIRONMENT === 'production' || process.env.NODE_ENV === 'production';

    // Use sandbox for development, production for production
    this.baseUrl = isProduction
      ? 'https://api.mtn.com/v1_0/api'
      : 'https://sandbox.momodeveloper.mtn.com/v1_0/api';

    if (!this.subscriptionKey || !this.apiUser || !this.apiKey) {
      throw new Error('MTN MoMo configuration missing');
    }

    // Log configuration for debugging (remove in production)
    console.log('MTN MoMo Config:', {
      subscriptionKey: this.subscriptionKey ? '***' + this.subscriptionKey.slice(-4) : 'missing',
      apiUser: this.apiUser ? '***' + this.apiUser.slice(-4) : 'missing',
      apiKey: this.apiKey ? '***' + this.apiKey.slice(-4) : 'missing',
      baseUrl: this.baseUrl,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
    });
  }

  // Get target environment based on current setup
  private getTargetEnvironment(): string {
    return process.env.NODE_ENV === 'production' ? 'mtnrwanda' : 'sandbox';
  }

  // Create access token
  private async createAccessToken(): Promise<string> {
    try {
      const auth = Buffer.from(`${this.apiUser}:${this.apiKey}`).toString('base64');

      const response = await fetch(`${this.baseUrl}/collection/token/`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('MTN Token API Error:', {
          status: response.status,
          statusText: response.statusText,
          response: errorText,
          headers: Object.fromEntries(response.headers.entries())
        });
        throw new Error(`Failed to create access token: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      // Token expires in 3600 seconds (1 hour)
      this.tokenExpiry = new Date(Date.now() + 3600 * 1000);

      return this.accessToken;
    } catch (error) {
      console.error('MTN MoMo access token error:', error);
      throw error;
    }
  }

  // Get valid access token
  private async getAccessToken(): Promise<string> {
    if (!this.accessToken || !this.tokenExpiry || this.tokenExpiry <= new Date()) {
      return await this.createAccessToken();
    }
    return this.accessToken;
  }

  // Validate account holder status
  async validateAccountHolderStatus(phone: string): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      const cleanPhone = phone.replace(/^(\+250|250)/, ''); // Remove Rwanda prefix

      const response = await fetch(
        `${this.baseUrl}/collection/v1_0/accountholder/msisdn/${cleanPhone}/active`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'X-Target-Environment': this.getTargetEnvironment(),
          },
        }
      );

      if (response.status === 200) {
        const data = await response.json();
        return data.result === true;
      } else if (response.status === 404) {
        // Account not found or not active
        return false;
      } else {
        throw new Error(`Account validation failed: ${response.status}`);
      }
    } catch (error) {
      console.error('MTN MoMo account validation error:', error);
      throw error;
    }
  }

  // Request to pay (initiate deposit)
  async requestToPay(params: MTNPaymentRequest): Promise<MTNPaymentResponse> {
    try {
      // Validate account holder first
      const isValid = await this.validateAccountHolderStatus(params.phone);
      if (!isValid) {
        throw new Error('Account holder is not active or valid');
      }

      const token = await this.getAccessToken();
      const cleanPhone = params.phone.replace(/^(\+250|250)/, '');

      const payload = {
        amount: params.amount.toString(),
        currency: params.currency,
        externalId: params.orderId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: cleanPhone,
        },
        payerMessage: `Deposit ${params.amount} ${params.currency}`,
        payeeNote: 'Hipacom deposit',
      };

      const response = await fetch(`${this.baseUrl}/collection/v1_0/requesttopay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'X-Target-Environment': this.getTargetEnvironment(),
          'X-Reference-Id': params.orderId, // UUID for the transaction
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 202) {
        // Accepted for processing
        return {
          txRef: params.orderId,
          status: 'pending',
        };
      } else {
        const errorData = await response.json();
        throw new Error(`Payment request failed: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('MTN MoMo payment request error:', error);
      throw error;
    }
  }

  // Check payment status
  async getPaymentStatus(referenceId: string): Promise<string> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(
        `${this.baseUrl}/collection/v1_0/requesttopay/${referenceId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'X-Target-Environment': this.getTargetEnvironment(),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.status; // SUCCESSFUL, FAILED, PENDING
      } else {
        throw new Error(`Status check failed: ${response.status}`);
      }
    } catch (error) {
      console.error('MTN MoMo status check error:', error);
      throw error;
    }
  }
}