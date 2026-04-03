import Flutterwave from "flutterwave-node-v3";
import * as crypto from "crypto";

// ============================================
// Flutterwave Payment Integration for Escrow
// ============================================

export interface PaymentRequest {
  amount: number;
  currency: string;
  email: string;
  phone: string;
  name: string;
  orderId: string;
  redirectUrl: string;
}

export interface PaymentResponse {
  paymentLink: string;
  txRef: string;
}

export interface VerifyResponse {
  verified: boolean;
  amount: number;
  currency: string;
  txRef: string;
}

export interface PayoutRequest {
  amount: number;
  currency: string;
  accountNumber: string;
  accountBank: string;
  reference: string;
  narration: string;
}

export class FlutterwaveService {
  private flw: any;

  constructor() {
    // Only initialize if environment variables are set
    if (process.env.FLW_PUBLIC_KEY && process.env.FLW_SECRET_KEY) {
      this.flw = new Flutterwave(
        process.env.FLW_PUBLIC_KEY,
        process.env.FLW_SECRET_KEY,
      );
    }
  }

  // Step 1 of payment: create a payment link for the buyer
  async initiatePayment(params: PaymentRequest): Promise<PaymentResponse> {
    if (!this.flw) {
      throw new Error(
        "Flutterwave not initialized. Please set FLW_PUBLIC_KEY and FLW_SECRET_KEY environment variables.",
      );
    }

    const payload = {
      tx_ref: `HIPA-${params.orderId}-${Date.now()}`,
      amount: params.amount / 100, // convert from smallest unit
      currency: params.currency,
      redirect_url: params.redirectUrl,
      customer: {
        email: params.email,
        phonenumber: params.phone,
        name: params.name,
      },
      customizations: {
        title: "Hipa Marketplace",
        description: `Order #${params.orderId}`,
        logo: "https://hipa.com/logo.png",
      },
      meta: { orderId: params.orderId },
    };

    const response = await this.flw.Payment.initialize(payload);
    return {
      paymentLink: response.data.link,
      txRef: payload.tx_ref,
    };
  }

  // Step 2: verify the payment after redirect
  async verifyPayment(transactionId: string): Promise<VerifyResponse> {
    if (!this.flw) {
      throw new Error(
        "Flutterwave not initialized. Please set FLW_PUBLIC_KEY and FLW_SECRET_KEY environment variables.",
      );
    }

    const response = await this.flw.Transaction.verify({ id: transactionId });
    return {
      verified: response.data.status === "successful",
      amount: Math.round(response.data.amount * 100), // back to smallest unit
      currency: response.data.currency,
      txRef: response.data.tx_ref,
    };
  }

  // Step 3: pay out to seller when escrow releases
  async payoutToSeller(params: PayoutRequest) {
    if (!this.flw) {
      throw new Error(
        "Flutterwave not initialized. Please set FLW_PUBLIC_KEY and FLW_SECRET_KEY environment variables.",
      );
    }

    const payload = {
      account_bank: params.accountBank,
      account_number: params.accountNumber,
      amount: params.amount / 100,
      narration: params.narration,
      currency: params.currency,
      reference: params.reference,
      callback_url: `${process.env.API_URL}/webhooks/flutterwave/payout`,
      debit_currency: params.currency,
    };

    const response = await this.flw.Transfer.initiate(payload);
    return response.data;
  }

  // Verify webhook signature from Flutterwave
  verifyWebhookSignature(signature: string, payload: string): boolean {
    const hash = crypto
      .createHmac("sha256", process.env.FLW_WEBHOOK_SECRET_HASH!)
      .update(payload)
      .digest("hex");
    return hash === signature;
  }
}
