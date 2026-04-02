'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Notification {
  id: string;
  type: 'order' | 'payment' | 'message' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock notifications
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'order',
        title: 'New Order Received',
        message: 'You have a new order from John Doe',
        read: false,
        createdAt: '2026-03-20T10:00:00Z',
        link: '/seller/orders/1',
      },
      {
        id: '2',
        type: 'payment',
        title: 'Payment Received',
        message: 'Payment of RWF 50,000 has been processed',
        read: false,
        createdAt: '2026-03-20T09:00:00Z',
        link: '/seller/finance',
      },
      {
        id: '3',
        type: 'message',
        title: 'New Message',
        message: 'You have a new message from a customer',
        read: true,
        createdAt: '2026-03-19T15:00:00Z',
        link: '/messages',
      },
    ];
    
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
    setIsLoading(false);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback((id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, [notifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
}
