import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

// ============================================
// Stripe Payment Integration
// ============================================

export class StripeService {
  private readonly stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('stripe.secretKey') || '';
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    });
  }

  /**
   * Create a checkout session
   */
  async createCheckoutSession(params: {
    amount: number;
    currency: string;
    customerEmail?: string;
    lineItems: Array<{
      name: string;
      description?: string;
      images?: string[];
      amount: number;
      quantity: number;
    }>;
    metadata?: Record<string, string>;
    successUrl: string;
    cancelUrl: string;
  }): Promise<Stripe.Checkout.Session> {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: params.customerEmail,
      line_items: params.lineItems.map(item => ({
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: {
            name: item.name,
            description: item.description,
            images: item.images,
          },
          unit_amount: Math.round(item.amount * 100), // Convert to cents
        },
        quantity: item.quantity,
      })),
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
    });

    return session;
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    customer?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.PaymentIntent> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100),
      currency: params.currency.toLowerCase(),
      customer: params.customer,
      metadata: params.metadata,
    });

    return paymentIntent;
  }

  /**
   * Verify a payment intent
   */
  async verifyPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  /**
   * Create a customer
   */
  async createCustomer(params: {
    email: string;
    name?: string;
    phone?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Customer> {
    const customer = await this.stripe.customers.create({
      email: params.email,
      name: params.name,
      phone: params.phone,
      metadata: params.metadata,
    });

    return customer;
  }

  /**
   * Create a seller connected account
   */
  async createConnectedAccount(params: {
    email: string;
    businessType: 'individual' | 'company';
    country?: string;
  }): Promise<Stripe.Account> {
    const account = await this.stripe.accounts.create({
      type: 'express',
      email: params.email,
      business_type: params.businessType,
      country: params.country || 'US',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    return account;
  }

  /**
   * Create account link for onboarding
   */
  async createAccountLink(
    accountId: string,
    refreshUrl: string,
    returnUrl: string
  ): Promise<Stripe.AccountLink> {
    const accountLink = await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return accountLink;
  }

  /**
   * Create a transfer to seller
   */
  async createTransfer(params: {
    amount: number;
    currency: string;
    destination: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Transfer> {
    const transfer = await this.stripe.transfers.create({
      amount: Math.round(params.amount * 100),
      currency: params.currency.toLowerCase(),
      destination: params.destination,
      description: params.description,
      metadata: params.metadata,
    });

    return transfer;
  }

  /**
   * Create a payout to seller's bank
   */
  async createPayout(params: {
    amount: number;
    currency: string;
    destination: string;
    description?: string;
  }): Promise<Stripe.Payout> {
    const payout = await this.stripe.payouts.create(
      {
        amount: Math.round(params.amount * 100),
        currency: params.currency.toLowerCase(),
        destination: params.destination,
        description: params.description,
      },
      {
        stripeAccount: params.destination,
      }
    );

    return payout;
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<Stripe.Balance> {
    return this.stripe.balance.retrieve();
  }

  /**
   * Create webhook signature for verification
   */
  constructWebhookEvent(
    payload: string | Buffer,
    signature: string
  ): Stripe.Event {
    const webhookSecret = this.configService.get<string>('stripe.webhookSecret') || '';
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
  }
}
