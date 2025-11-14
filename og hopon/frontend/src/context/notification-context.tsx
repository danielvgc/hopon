// frontend/context/notification-context.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Api } from '@/lib/api';
import type { Notification as HopOnNotification } from '@/lib/api';
import { socketClient } from '@/lib/socket';
import { useAuth } from './auth-context';

interface NotificationContextType {
  notifications: HopOnNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<HopOnNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const { notifications: newNotifications } = await Api.getNotifications(1, 50);
      setNotifications(newNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await Api.markNotificationRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await Api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, []);

  // Load notifications on mount and when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshNotifications();
    }
  }, [isAuthenticated, refreshNotifications]);

  // Listen for real-time notifications via Socket.io
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNewNotification = (notification: HopOnNotification) => {
      setNotifications(prev => [notification, ...prev]);
      
      // Optional: Show browser notification using the global Notification API
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (window.Notification.permission === 'granted') {
          new window.Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: `notification-${notification.id}`,
          });
        }
      }
    };

    socketClient.onNotification(handleNewNotification);

    // Request notification permission on first load
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (window.Notification.permission === 'default') {
        window.Notification.requestPermission().then(permission => {
          console.log('Notification permission:', permission);
        });
      }
    }

    return () => {
      socketClient.offNotification();
    };
  }, [isAuthenticated]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
