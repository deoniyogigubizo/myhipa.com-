// Offline Storage System for Message Queuing
// Handles messages when recipient is offline

interface OfflineMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  contentType: string;
  timestamp: Date;
  status: 'pending' | 'queued' | 'delivered' | 'failed';
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'normal' | 'high';
  metadata?: any;
}

interface OfflineStorageConfig {
  maxMessages: number;
  maxAge: number; // in milliseconds
  cleanupInterval: number; // in milliseconds
}

class OfflineStorage {
  private storage: Map<string, OfflineMessage[]> = new Map();
  private config: OfflineStorageConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<OfflineStorageConfig> = {}) {
    this.config = {
      maxMessages: config.maxMessages || 1000,
      maxAge: config.maxAge || 7 * 24 * 60 * 60 * 1000, // 7 days
      cleanupInterval: config.cleanupInterval || 60 * 60 * 1000 // 1 hour
    };

    this.startCleanupTimer();
  }

  // Store message for offline recipient
  async storeMessage(
    recipientId: string,
    message: Omit<OfflineMessage, 'id' | 'status' | 'retryCount'>
  ): Promise<string> {
    const messageId = this.generateId();
    const offlineMessage: OfflineMessage = {
      ...message,
      id: messageId,
      status: 'pending',
      retryCount: 0,
      maxRetries: message.maxRetries || 3
    };

    if (!this.storage.has(recipientId)) {
      this.storage.set(recipientId, []);
    }

    const messages = this.storage.get(recipientId)!;
    
    // Check if we've reached max messages
    if (messages.length >= this.config.maxMessages) {
      // Remove oldest low-priority message
      const lowPriorityIndex = messages.findIndex(m => m.priority === 'low');
      if (lowPriorityIndex !== -1) {
        messages.splice(lowPriorityIndex, 1);
      } else {
        // Remove oldest message
        messages.shift();
      }
    }

    // Insert based on priority
    if (offlineMessage.priority === 'high') {
      messages.unshift(offlineMessage);
    } else if (offlineMessage.priority === 'low') {
      messages.push(offlineMessage);
    } else {
      // Normal priority - insert after high priority messages
      const highPriorityCount = messages.filter(m => m.priority === 'high').length;
      messages.splice(highPriorityCount, 0, offlineMessage);
    }

    console.log(`Stored offline message ${messageId} for recipient ${recipientId}`);
    return messageId;
  }

  // Get pending messages for recipient
  async getPendingMessages(recipientId: string): Promise<OfflineMessage[]> {
    const messages = this.storage.get(recipientId) || [];
    return messages.filter(m => m.status === 'pending' || m.status === 'queued');
  }

  // Get all messages for recipient
  async getAllMessages(recipientId: string): Promise<OfflineMessage[]> {
    return this.storage.get(recipientId) || [];
  }

  // Mark message as delivered
  async markAsDelivered(recipientId: string, messageId: string): Promise<boolean> {
    const messages = this.storage.get(recipientId);
    if (!messages) return false;

    const message = messages.find(m => m.id === messageId);
    if (!message) return false;

    message.status = 'delivered';
    console.log(`Marked message ${messageId} as delivered for recipient ${recipientId}`);
    return true;
  }

  // Mark message as failed
  async markAsFailed(recipientId: string, messageId: string): Promise<boolean> {
    const messages = this.storage.get(recipientId);
    if (!messages) return false;

    const message = messages.find(m => m.id === messageId);
    if (!message) return false;

    message.status = 'failed';
    console.log(`Marked message ${messageId} as failed for recipient ${recipientId}`);
    return true;
  }

  // Increment retry count
  async incrementRetryCount(recipientId: string, messageId: string): Promise<boolean> {
    const messages = this.storage.get(recipientId);
    if (!messages) return false;

    const message = messages.find(m => m.id === messageId);
    if (!message) return false;

    message.retryCount++;
    
    if (message.retryCount >= message.maxRetries) {
      message.status = 'failed';
      console.log(`Message ${messageId} exceeded max retries for recipient ${recipientId}`);
      return false;
    }

    console.log(`Incremented retry count for message ${messageId} to ${message.retryCount}`);
    return true;
  }

  // Remove message
  async removeMessage(recipientId: string, messageId: string): Promise<boolean> {
    const messages = this.storage.get(recipientId);
    if (!messages) return false;

    const index = messages.findIndex(m => m.id === messageId);
    if (index === -1) return false;

    messages.splice(index, 1);
    console.log(`Removed message ${messageId} for recipient ${recipientId}`);
    return true;
  }

  // Clear all messages for recipient
  async clearMessages(recipientId: string): Promise<void> {
    this.storage.delete(recipientId);
    console.log(`Cleared all messages for recipient ${recipientId}`);
  }

  // Get storage statistics
  getStats(): {
    totalRecipients: number;
    totalMessages: number;
    messagesByStatus: Record<string, number>;
    messagesByPriority: Record<string, number>;
  } {
    let totalMessages = 0;
    const messagesByStatus: Record<string, number> = {};
    const messagesByPriority: Record<string, number> = {};

    for (const messages of this.storage.values()) {
      totalMessages += messages.length;
      
      for (const message of messages) {
        messagesByStatus[message.status] = (messagesByStatus[message.status] || 0) + 1;
        messagesByPriority[message.priority] = (messagesByPriority[message.priority] || 0) + 1;
      }
    }

    return {
      totalRecipients: this.storage.size,
      totalMessages,
      messagesByStatus,
      messagesByPriority
    };
  }

  // Cleanup old messages
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [recipientId, messages] of this.storage.entries()) {
      const initialLength = messages.length;
      
      // Remove messages older than maxAge
      const filteredMessages = messages.filter(message => {
        const messageAge = now - message.timestamp.getTime();
        return messageAge < this.config.maxAge;
      });

      if (filteredMessages.length < initialLength) {
        this.storage.set(recipientId, filteredMessages);
        cleanedCount += initialLength - filteredMessages.length;
      }

      // Remove empty recipient entries
      if (filteredMessages.length === 0) {
        this.storage.delete(recipientId);
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} old offline messages`);
    }
  }

  // Start cleanup timer
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  // Stop cleanup timer
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  // Generate unique ID
  private generateId(): string {
    return `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorage();

// Export types
export type { OfflineMessage, OfflineStorageConfig };
