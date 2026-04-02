'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { INotification, getTimeAgo, notificationTypeLabels } from '@/lib/community';

interface NotificationPanelProps {
  notifications: INotification[];
  onMarkAllRead?: () => void;
  onNotificationClick?: (notificationId: string) => void;
}

export default function NotificationPanel({ 
  notifications, 
  onMarkAllRead,
  onNotificationClick 
}: NotificationPanelProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'follow': return '👤';
      case 'mention': return '@';
      case 'answer': return '✅';
      case 'upvote': return '⬆️';
      case 'badge_earned': return '🏆';
      case 'level_up': return '⬆️';
      case 'deal_alert': return '⚡';
      case 'group_invite': return '👥';
      case 'ama_reminder': return '🎤';
      case 'order_update': return '📦';
      case 'review_received': return '⭐';
      case 'question_answered': return '❓';
      default: return '🔔';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-sm text-hipa-primary hover:text-hipa-secondary transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 border-b border-gray-100 flex gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`text-sm font-medium pb-2 transition-colors ${
            filter === 'all'
              ? 'text-hipa-primary border-b-2 border-hipa-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`text-sm font-medium pb-2 transition-colors ${
            filter === 'unread'
              ? 'text-hipa-primary border-b-2 border-hipa-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <Link
              key={notification._id}
              href={notification.actionUrl || '#'}
              onClick={() => onNotificationClick?.(notification._id)}
              className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                !notification.read ? 'bg-blue-50/50' : ''
              }`}
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-lg">
                {getNotificationIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${
                    !notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'
                  }`}>
                    {notification.title}
                  </p>
                  {!notification.read && (
                    <span className="w-2 h-2 bg-hipa-primary rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {getTimeAgo(notification.createdAt)}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100">
          <Link
            href="/notifications"
            className="block text-center text-sm text-hipa-primary hover:text-hipa-secondary transition-colors font-medium"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
