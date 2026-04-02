// Push Notifications System
// Handles real-time alerts via APNs (iOS) and FCM (Android)

interface PushNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  priority: 'normal' | 'high';
  ttl: number; // Time to live in seconds
  timestamp: Date;
}

interface DeviceToken {
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
}

class PushNotificationService {
  private deviceTokens: Map<string, DeviceToken[]> = new Map();
  private notificationQueue: PushNotification[] = [];
  private processing: boolean = false;

  constructor() {
    this.startProcessing();
  }

  // Register device token
  async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android' | 'web',
    deviceId: string
  ): Promise<void> {
    if (!this.deviceTokens.has(userId)) {
      this.deviceTokens.set(userId, []);
    }

    const tokens = this.deviceTokens.get(userId)!;
    
    // Check if token already exists
    const existingToken = tokens.find(t => t.token === token);
    if (existingToken) {
      existingToken.active = true;
      existingToken.updatedAt = new Date();
      console.log(`Updated existing device token for user ${userId}`);
      return;
    }

    // Add new token
    const deviceToken: DeviceToken = {
      userId,
      token,
      platform,
      deviceId,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    tokens.push(deviceToken);
    console.log(`Registered new device token for user ${userId} on ${platform}`);
  }

  // Unregister device token
  async unregisterDeviceToken(userId: string, token: string): Promise<void> {
    const tokens = this.deviceTokens.get(userId);
    if (!tokens) return;

    const index = tokens.findIndex(t => t.token === token);
    if (index !== -1) {
      tokens[index].active = false;
      tokens[index].updatedAt = new Date();
      console.log(`Unregistered device token for user ${userId}`);
    }
  }

  // Send notification to user
  async sendNotification(
    userId: string,
    payload: NotificationPayload,
    options: {
      priority?: 'normal' | 'high';
      ttl?: number;
    } = {}
  ): Promise<string> {
    const notificationId = this.generateId();
    
    const notification: PushNotification = {
      id: notificationId,
      userId,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      badge: payload.badge,
      sound: payload.sound || 'default',
      priority: options.priority || 'normal',
      ttl: options.ttl || 3600, // 1 hour default
      timestamp: new Date()
    };

    this.notificationQueue.push(notification);
    console.log(`Queued notification ${notificationId} for user ${userId}`);
    
    return notificationId;
  }

  // Send notification to multiple users
  async sendBulkNotification(
    userIds: string[],
    payload: NotificationPayload,
    options: {
      priority?: 'normal' | 'high';
      ttl?: number;
    } = {}
  ): Promise<string[]> {
    const notificationIds: string[] = [];
    
    for (const userId of userIds) {
      const notificationId = await this.sendNotification(userId, payload, options);
      notificationIds.push(notificationId);
    }
    
    return notificationIds;
  }

  // Process notification queue
  private async startProcessing(): Promise<void> {
    if (this.processing) return;
    
    this.processing = true;
    console.log('Started push notification processing');
    
    while (this.processing) {
      if (this.notificationQueue.length > 0) {
        const notification = this.notificationQueue.shift()!;
        await this.processNotification(notification);
      } else {
        // Wait before checking queue again
        await this.sleep(1000);
      }
    }
  }

  // Process individual notification
  private async processNotification(notification: PushNotification): Promise<void> {
    try {
      const tokens = this.deviceTokens.get(notification.userId) || [];
      const activeTokens = tokens.filter(t => t.active);
      
      if (activeTokens.length === 0) {
        console.log(`No active device tokens for user ${notification.userId}`);
        return;
      }

      // Send to each platform
      for (const deviceToken of activeTokens) {
        try {
          await this.sendToPlatform(deviceToken, notification);
          console.log(`Sent notification ${notification.id} to ${deviceToken.platform} device`);
        } catch (error) {
          console.error(`Failed to send notification to ${deviceToken.platform}:`, error);
          
          // Mark token as inactive if delivery fails
          if (this.isTokenError(error)) {
            deviceToken.active = false;
            deviceToken.updatedAt = new Date();
          }
        }
      }
    } catch (error) {
      console.error(`Error processing notification ${notification.id}:`, error);
    }
  }

  // Send notification to specific platform
  private async sendToPlatform(deviceToken: DeviceToken, notification: PushNotification): Promise<void> {
    switch (deviceToken.platform) {
      case 'ios':
        await this.sendToAPNs(deviceToken, notification);
        break;
      case 'android':
        await this.sendToFCM(deviceToken, notification);
        break;
      case 'web':
        await this.sendToWebPush(deviceToken, notification);
        break;
      default:
        console.warn(`Unknown platform: ${deviceToken.platform}`);
    }
  }

  // Send to Apple Push Notification service
  private async sendToAPNs(deviceToken: DeviceToken, notification: PushNotification): Promise<void> {
    // In production, this would use the APNs API
    // For now, we'll simulate the API call
    
    const payload = {
      aps: {
        alert: {
          title: notification.title,
          body: notification.body
        },
        badge: notification.badge,
        sound: notification.sound,
        'content-available': 1
      },
      data: notification.data
    };

    // Simulate API call
    console.log(`[APNs] Sending to ${deviceToken.token.substring(0, 20)}...`);
    console.log(`[APNs] Payload:`, JSON.stringify(payload, null, 2));
    
    // In production:
    // const response = await fetch('https://api.push.apple.com/3/device/' + deviceToken.token, {
    //   method: 'POST',
    //   headers: {
    //     'authorization': 'bearer ' + APNS_KEY,
    //     'apns-topic': BUNDLE_ID,
    //     'apns-priority': notification.priority === 'high' ? '10' : '5',
    //     'apns-expiration': Math.floor(Date.now() / 1000) + notification.ttl
    //   },
    //   body: JSON.stringify(payload)
    // });
  }

  // Send to Firebase Cloud Messaging
  private async sendToFCM(deviceToken: DeviceToken, notification: PushNotification): Promise<void> {
    // In production, this would use the FCM API
    // For now, we'll simulate the API call
    
    const payload = {
      to: deviceToken.token,
      notification: {
        title: notification.title,
        body: notification.body,
        sound: notification.sound,
        badge: notification.badge
      },
      data: notification.data,
      priority: notification.priority === 'high' ? 'high' : 'normal',
      ttl: notification.ttl
    };

    // Simulate API call
    console.log(`[FCM] Sending to ${deviceToken.token.substring(0, 20)}...`);
    console.log(`[FCM] Payload:`, JSON.stringify(payload, null, 2));
    
    // In production:
    // const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    //   method: 'POST',
    //   headers: {
    //     'authorization': 'key=' + FCM_SERVER_KEY,
    //     'content-type': 'application/json'
    //   },
    //   body: JSON.stringify(payload)
    // });
  }

  // Send to Web Push
  private async sendToWebPush(deviceToken: DeviceToken, notification: PushNotification): Promise<void> {
    // In production, this would use the Web Push API
    // For now, we'll simulate the API call
    
    const payload = {
      title: notification.title,
      body: notification.body,
      icon: '/icon.png',
      badge: '/badge.png',
      data: notification.data,
      tag: notification.id,
      renotify: true
    };

    // Simulate API call
    console.log(`[Web Push] Sending to ${deviceToken.token.substring(0, 20)}...`);
    console.log(`[Web Push] Payload:`, JSON.stringify(payload, null, 2));
    
    // In production:
    // const subscription = JSON.parse(deviceToken.token);
    // await webPush.sendNotification(subscription, JSON.stringify(payload));
  }

  // Check if error is token-related
  private isTokenError(error: any): boolean {
    // Check for common token errors
    const tokenErrors = [
      'InvalidRegistration',
      'NotRegistered',
      'InvalidToken',
      'TokenNotRegistered'
    ];
    
    return tokenErrors.some(errorType => 
      error.message?.includes(errorType) || error.code === errorType
    );
  }

  // Get notification statistics
  getStats(): {
    totalDevices: number;
    activeDevices: number;
    devicesByPlatform: Record<string, number>;
    queueLength: number;
  } {
    let totalDevices = 0;
    let activeDevices = 0;
    const devicesByPlatform: Record<string, number> = {};

    for (const tokens of this.deviceTokens.values()) {
      totalDevices += tokens.length;
      
      for (const token of tokens) {
        if (token.active) {
          activeDevices++;
        }
        
        devicesByPlatform[token.platform] = (devicesByPlatform[token.platform] || 0) + 1;
      }
    }

    return {
      totalDevices,
      activeDevices,
      devicesByPlatform,
      queueLength: this.notificationQueue.length
    };
  }

  // Stop processing
  stop(): void {
    this.processing = false;
    console.log('Stopped push notification processing');
  }

  // Sleep helper
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generate unique ID
  private generateId(): string {
    return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const pushNotificationService = new PushNotificationService();

// Export types
export type { PushNotification, DeviceToken, NotificationPayload };
