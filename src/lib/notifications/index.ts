import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import admin from 'firebase-admin';

// ============================================
// Notification Services
// ============================================

// ============================================
// Email Service (SendGrid)
// ============================================

export class EmailService {
  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('sendgrid.apiKey');
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    }
  }

  async sendEmail(params: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    templateId?: string;
    dynamicTemplateData?: Record<string, unknown>;
  }): Promise<void> {
    const fromEmail = this.configService.get<string>('sendgrid.fromEmail') || 'noreply@myhipa.rw';

    const msg = {
      to: params.to,
      from: fromEmail,
      subject: params.subject,
      text: params.text,
      html: params.html,
      ...(params.templateId && {
        templateId: params.templateId,
        dynamicTemplateData: params.dynamicTemplateData,
      }),
    };

    try {
      await sgMail.send(msg);
      console.log(`[EMAIL] Sent to ${params.to}: ${params.subject}`);
    } catch (error) {
      console.error('[EMAIL] Failed to send:', error);
      throw error;
    }
  }

  // Template emails
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Welcome to Hipa!',
      templateId: 'd-welcome',
      dynamicTemplateData: { name },
    });
  }

  async sendOrderConfirmation(email: string, orderData: Record<string, unknown>): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Order Confirmed - Hipa',
      templateId: 'd-order-confirmation',
      dynamicTemplateData: orderData,
    });
  }

  async sendOrderShipped(email: string, orderData: Record<string, unknown>): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Your Order Has Shipped - Hipa',
      templateId: 'd-order-shipped',
      dynamicTemplateData: orderData,
    });
  }

  async sendEscrowReleased(email: string, amount: number, orderNumber: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `Payment Released - Order ${orderNumber}`,
      templateId: 'd-escrow-released',
      dynamicTemplateData: { amount, orderNumber },
    });
  }

  async sendPayoutNotification(email: string, amount: number): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Payout Processed - Hipa',
      templateId: 'd-payout-processed',
      dynamicTemplateData: { amount },
    });
  }
}

// ============================================
// SMS Service (Twilio)
// ============================================

export class SMSService {
  private readonly client: twilio.Twilio | null;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('twilio.accountSid');
    const authToken = this.configService.get<string>('twilio.authToken');
    
    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
    }
  }

  async sendSMS(to: string, message: string): Promise<void> {
    if (!this.client) {
      console.log(`[SMS] Would send to ${to}: ${message}`);
      return;
    }

    try {
      await this.client.messages.create({
        body: message,
        from: this.configService.get<string>('twilio.fromNumber'),
        to,
      });
      console.log(`[SMS] Sent to ${to}: ${message}`);
    } catch (error) {
      console.error('[SMS] Failed to send:', error);
      throw error;
    }
  }

  // Template SMS
  async sendOTP(phone: string, otp: string): Promise<void> {
    await this.sendSMS(phone, `Your Hipa verification code is: ${otp}. Valid for 10 minutes.`);
  }

  async sendOrderStatusUpdate(phone: string, status: string, orderNumber: string): Promise<void> {
    await this.sendSMS(phone, `Hipa: Your order ${orderNumber} is now ${status}.`);
  }

  async sendEscrowNotification(phone: string, action: string, amount: number): Promise<void> {
    await this.sendSMS(phone, `Hipa: ${action} - RWF ${amount.toLocaleString()}`);
  }
}

// ============================================
// Push Notification Service (Firebase)
// ============================================

export class PushService {
  private initialized = false;

  constructor(private readonly configService: ConfigService) {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const credentials = this.configService.get<string>('firebase.credentials');
      
      if (credentials && !admin.apps.length) {
        const serviceAccount = JSON.parse(credentials);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        this.initialized = true;
      }
    } catch (error) {
      console.error('[PUSH] Failed to initialize Firebase:', error);
    }
  }

  async sendPush(params: {
    token: string;
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<void> {
    if (!this.initialized) {
      console.log(`[PUSH] Would send to ${params.token}: ${params.title}`);
      return;
    }

    try {
      await admin.messaging().send({
        token: params.token,
        notification: {
          title: params.title,
          body: params.body,
        },
        data: params.data,
        android: {
          priority: 'high' as const,
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      });
      console.log(`[PUSH] Sent to token: ${params.title}`);
    } catch (error) {
      console.error('[PUSH] Failed to send:', error);
    }
  }

  async sendToTopic(params: {
    topic: string;
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<void> {
    if (!this.initialized) {
      console.log(`[PUSH] Would send to topic ${params.topic}: ${params.title}`);
      return;
    }

    try {
      await admin.messaging().send({
        topic: params.topic,
        notification: {
          title: params.title,
          body: params.body,
        },
        data: params.data,
      });
      console.log(`[PUSH] Sent to topic: ${params.topic}`);
    } catch (error) {
      console.error('[PUSH] Failed to send to topic:', error);
    }
  }

  // Subscribe device to topic
  async subscribeToTopic(token: string, topic: string): Promise<void> {
    if (!this.initialized) return;

    try {
      await admin.messaging().subscribeToTopic(token, topic);
      console.log(`[PUSH] Subscribed ${token} to ${topic}`);
    } catch (error) {
      console.error('[PUSH] Failed to subscribe:', error);
    }
  }
}

// ============================================
// Notification Queue Jobs
// ============================================

export interface NotificationJob {
  type: 'email' | 'sms' | 'push';
  data: Record<string, unknown>;
}

export async function processNotificationJob(job: NotificationJob): Promise<void> {
  const { type, data } = job;

  switch (type) {
    case 'email':
      // Would use EmailService
      console.log('[QUEUE] Processing email job:', data);
      break;

    case 'sms':
      // Would use SMSService
      console.log('[QUEUE] Processing SMS job:', data);
      break;

    case 'push':
      // Would use PushService
      console.log('[QUEUE] Processing push job:', data);
      break;

    default:
      console.log('[QUEUE] Unknown notification type:', type);
  }
}
